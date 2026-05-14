import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import {
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../types";

import { getCategories } from "../../services/taskService";
import Category from "./Category";
import { SectionHeader } from "../UI/foundation";

export interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category_id?: number;
  status_code?: number;
  is_shared?: boolean;
  owner_id?: number;
  owner_name?: string;
  is_owned?: boolean;
  permission_level?: "READ_ONLY" | "READ_WRITE";
}

export interface CategoryViewProps {
  onCategoryAdded: (category: CategoryType) => void;
  onCategoryDeleted: () => void;
  onCategoryEdited: () => void;
  reloadCategories: () => void;
}

export interface CategoryViewRef {
  fetchCategories: (forceRefresh?: boolean, silent?: boolean) => void;
  hardReload: () => void;
}

// ── Animated wrapper for each category card ──
const CARD_STAGGER = 50;
const CARD_DURATION = 400;

const AnimatedCard: React.FC<{
  index: number;
  isVisible: boolean;
  children: React.ReactNode;
}> = ({ index, isVisible, children }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: CARD_DURATION,
          delay: index * CARD_STAGGER,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: CARD_DURATION,
          delay: index * CARD_STAGGER,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset without animation so next entrance animates in
      fade.setValue(0);
      slideY.setValue(20);
    }
  }, [isVisible, index]);

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: slideY }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// ── Skeleton placeholder cards ──
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [index, shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const screenWidth = Dimensions.get("window").width;
  const mx = screenWidth < 350 ? 8 : 16;

  return (
    <View
      style={[
        styles.skeletonCard,
        { marginHorizontal: mx, marginVertical: 8 },
      ]}
    >
      <View style={styles.skeletonRow}>
        {/* Avatar circle */}
        <View style={styles.skeletonCircle} />
        {/* Text lines */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View
            style={[styles.skeletonLine, { width: "55%", marginBottom: 8 }]}
          />
          <View style={[styles.skeletonLine, { width: "30%", height: 12 }]} />
        </View>
      </View>
      {/* Shimmer overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.skeletonShimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
};

const SKELETON_COUNT = 4;

// ── Main CategoryView ──
const CategoryView = forwardRef<CategoryViewRef, CategoryViewProps>(
  (
    { onCategoryAdded, onCategoryDeleted, onCategoryEdited, reloadCategories },
    ref
  ) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isReloading, setIsReloading] = useState<boolean>(false);
    const previousCategoriesRef = React.useRef<CategoryType[]>([]);
    const animKeyRef = useRef(0);

    const categoriesAreEqual = (
      cat1: CategoryType[],
      cat2: CategoryType[]
    ): boolean => {
      if (cat1.length !== cat2.length) return false;
      return cat1.every((c1) =>
        cat2.some(
          (c2) =>
            c1.id === c2.id &&
            c1.name === c2.name &&
            c1.description === c2.description &&
            c1.category_id === c2.category_id
        )
      );
    };

    const fetchCategories = async (
      forceRefresh: boolean = false,
      silent: boolean = false
    ) => {
      const startedAt = Date.now();
      if (!silent) {
        setLoading(true);
      }
      try {
        const categoriesData = await getCategories(!forceRefresh);
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error(
            "getCategories non ha restituito un array:",
            categoriesData
          );
        }
      } catch (error) {
        console.error("Errore nel recupero delle categorie:", error);
      } finally {
        if (!silent) {
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(0, 500 - elapsed);
          if (remaining > 0) {
            setTimeout(() => setLoading(false), remaining);
          } else {
            setLoading(false);
          }
        }
      }
    };

    const hardReload = useCallback(async () => {
      const startedAt = Date.now();
      setIsReloading(true);
      animKeyRef.current += 1;
      setCategories([]);
      try {
        const categoriesData = await getCategories(false);
        if (Array.isArray(categoriesData)) {
          if (!categoriesAreEqual(categoriesData, previousCategoriesRef.current)) {
            setCategories(categoriesData);
            previousCategoriesRef.current = categoriesData;
          } else {
            setCategories(categoriesData);
          }
        } else {
          console.error("getCategories non ha restituito un array:", categoriesData);
        }
      } catch (error) {
        console.error("Errore nel ricaricamento delle categorie:", error);
        setCategories(previousCategoriesRef.current);
      } finally {
        const elapsed = Date.now() - startedAt;
        const minDisplay = 400;
        const remaining = Math.max(0, minDisplay - elapsed);
        if (remaining > 0) {
          setTimeout(() => setIsReloading(false), remaining);
        } else {
          setIsReloading(false);
        }
      }
    }, []);

    useEffect(() => {
      fetchCategories();
    }, []);

    useImperativeHandle(ref, () => ({
      fetchCategories,
      hardReload,
    }));

    const showCards = !loading && !isReloading && categories.length > 0;
    const showEmpty = !loading && !isReloading && categories.length === 0;

    return (
      <View style={styles.container}>
        {/* Skeleton loading */}
        {(loading || isReloading) && (
          <View>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} index={i} />
            ))}
          </View>
        )}

        {/* Category cards with staggered entrance */}
        {showCards && (
          <View pointerEvents={isReloading ? "none" : "auto"}>
            {categories.map((category, index) => (
              <AnimatedCard
                key={`${category.id || category.name}-${index}-${animKeyRef.current}`}
                index={index}
                isVisible={showCards}
              >
                <Category
                  title={category.name}
                  description={category.description}
                  imageUrl={category.imageUrl}
                  categoryId={category.category_id || category.id}
                  isShared={category.is_shared}
                  isOwned={category.is_owned}
                  ownerName={category.owner_name}
                  permissionLevel={category.permission_level}
                  onDelete={onCategoryDeleted}
                  onEdit={onCategoryEdited}
                />
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Empty state */}
        {showEmpty && (
          <View style={styles.noCategoriesContainer}>
            <SectionHeader
              title="Nessuna categoria"
              subtitle="Aggiungi la tua prima categoria per iniziare"
              style={styles.emptyHeader}
            />
            <Text style={styles.noCategoriesMessage}>
              oppure{"\n"}
            </Text>
            <TouchableOpacity
              style={[styles.reloadButton, styles.goToLoginButton]}
              onPress={() => {
                navigation.navigate("Login");
              }}
            >
              <Text style={[styles.reloadButtonText]}>Vai al login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  noCategoriesContainer: {
    textAlign: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyHeader: {
    marginBottom: 10,
  },
  noCategoriesMessage: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    fontFamily: "System",
    fontWeight: "300",
    lineHeight: 26,
  },
  reloadButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 44,
    minHeight: 44,
    flexShrink: 0,
  },
  goToLoginButton: {
    width: 150,
    alignSelf: "center",
  },
  reloadButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "400",
  },
  // Skeleton styles
  skeletonCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E1E5E9",
    overflow: "hidden",
    height: 76,
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8ECF0",
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E8ECF0",
  },
  skeletonShimmer: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});

CategoryView.displayName = "CategoryView";

export default CategoryView;

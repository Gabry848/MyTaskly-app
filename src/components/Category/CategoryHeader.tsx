import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import CategoryBadge from './CategoryBadge';

export interface CategoryHeaderProps {
  title: string;
  imageUrl?: string;
  taskCount: number;
  isLoading: boolean;
  screenWidth: number;
  badgeType?: 'shared' | 'readOnly' | 'canEdit';
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  imageUrl,
  taskCount,
  isLoading,
  screenWidth,
  badgeType
}) => {
  return (
    <View style={styles.headerContainer}>
      <View
        style={[styles.imageContainer, {
          width: screenWidth < 350 ? 48 : 56,
          height: screenWidth < 350 ? 48 : 56,
        }]}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.image, {
            width: screenWidth < 350 ? 28 : 36,
            height: screenWidth < 350 ? 28 : 36,
          }]} />
        ) : (
          <MaterialIcons
            name="category"
            size={screenWidth < 350 ? 28 : 32}
            color="#000000"
          />
        )}
      </View>

      <View style={[styles.categoryContainer, {
        marginHorizontal: screenWidth < 350 ? 10 : 15,
      }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.add, {
            fontSize: screenWidth < 350 ? 16 : 18,
            padding: screenWidth < 350 ? 3 : 5,
          }]}>{title}</Text>
          {badgeType && (
            <View style={styles.inlineBadgeWrapper}>
              <CategoryBadge type={badgeType} />
            </View>
          )}
        </View>
        <View style={styles.counterRow}>
          <MaterialIcons name="check-circle-outline" size={screenWidth < 350 ? 14 : 16} color="#757575" />
          <Text style={[styles.title, {
            fontSize: screenWidth < 350 ? 12 : 14,
            marginLeft: screenWidth < 350 ? 4 : 6,
          }]}>
            {isLoading ? "Caricamento..." : `${taskCount} cose da fare`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  categoryContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inlineBadgeWrapper: {
    marginLeft: 6,
    marginTop: 2,
  },
  add: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    lineHeight: 24,
    letterSpacing: -0.3,
    fontFamily: "System",
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    color: "#616161",
    marginLeft: 6,
    fontFamily: "System",
    fontWeight: "400",
  },
});

export default CategoryHeader;
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from "@react-navigation/native";
import CategoryList from "../../components/Category/CategoryList";
import AddCategoryButton from "../../components/Category/AddCategoryButton";
import GlobalTaskSearch from "../../components/Task/GlobalTaskSearch";
import { useTranslation } from "react-i18next";
import { TaskCacheService } from "../../services/TaskCacheService";
import SyncManager from "../../services/SyncManager";
import {
  ContentContainer,
  ScreenContainer,
  ScreenHeader,
} from "../../components/UI/foundation";
import { MaterialIcons } from "@expo/vector-icons";

export default function Categories() {
  const { t } = useTranslation();
  const categoryListRef = useRef<{
    reloadCategories: (silent?: boolean) => void;
    hardReload: () => void;
  } | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (categoryListRef.current) {
        categoryListRef.current.reloadCategories(true);
      }
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await TaskCacheService.getInstance().clearCache();
      await SyncManager.getInstance().startSync();
      if (categoryListRef.current) {
        categoryListRef.current.hardReload();
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCategoryAdded = () => {
    if (categoryListRef.current) {
      categoryListRef.current.reloadCategories();
    }
  };

  const handleOpenSearch = () => {
    setSearchModalVisible(true);
  };

  const handleCloseSearch = () => {
    setSearchModalVisible(false);
  };

  return (
    <ScreenContainer>
      <StatusBar style="dark" />

      <ScreenHeader
        title={t("categories.title")}
        style={{ paddingEnd: 35 }}
        rightActions={(
          <TouchableOpacity
            onPress={handleOpenSearch}
            style={styles.searchIconButton}
            accessibilityRole="button"
            accessibilityLabel={t("globalTaskSearch.searchAllTasks")}
          >
            <MaterialIcons name="search" size={22} color="#333333" />
          </TouchableOpacity>
        )}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={["#000000"]}
            progressViewOffset={20}
          />
        }
      >
        <ContentContainer padded={false}>
          <CategoryList ref={categoryListRef} />
        </ContentContainer>
        <View style={styles.addButtonContainer}>
          <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
        </View>
      </ScrollView>

      <GlobalTaskSearch
        visible={searchModalVisible}
        onClose={handleCloseSearch}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 10,
    right: 80,
    paddingHorizontal: 24,
  },
});

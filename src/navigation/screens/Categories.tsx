import React, { useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from "@react-navigation/native";
import CategoryList from "../../components/Category/CategoryList";
import AddCategoryButton from "../../components/Category/AddCategoryButton";
import SearchTasksButton from "../../components/UI/SearchTasksButton";
import GlobalTaskSearch from "../../components/Task/GlobalTaskSearch";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { TaskCacheService } from "../../services/TaskCacheService";
import SyncManager from "../../services/SyncManager";

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

  const handleReload = () => {
    if (categoryListRef.current) {
      categoryListRef.current.hardReload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header con titolo principale - stesso stile di Home20 */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t("categories.title")}</Text>
      </View>

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
        <View style={styles.searchContainer}>
          <SearchTasksButton
            onPress={handleOpenSearch}
            style={styles.searchButton}
          />
        </View>
        <CategoryList ref={categoryListRef} />
        <View style={styles.addButtonContainer}>
          <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
        </View>
      </ScrollView>

      <GlobalTaskSearch
        visible={searchModalVisible}
        onClose={handleCloseSearch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 15,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "700", // Stesso peso di Home20
    color: "#000000",
    textAlign: "left",
    fontFamily: "System",
    letterSpacing: -1.5,
    marginBottom: 0,
    paddingBottom: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  searchButton: {
    flex: 1,
    marginHorizontal: 0, // Override default margin
    marginRight: 10,
    marginVertical: 0, // Override default margin
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
  },
});

import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CategoryList from '../../components/Category/CategoryList';
import AddCategoryButton from "../../components/Category/AddCategoryButton";
import SearchTasksButton from "../../components/UI/SearchTasksButton";
import GlobalTaskSearch from "../../components/Task/GlobalTaskSearch";
import { useTranslation } from 'react-i18next';

export default function Categories() {
  const { t } = useTranslation();
  const categoryListRef = useRef<{ reloadCategories: () => void } | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // Ricarica le categorie quando la schermata viene visualizzata
  useFocusEffect(
    React.useCallback(() => {
      if (categoryListRef.current) {
        categoryListRef.current.reloadCategories();
      }
    }, [])
  );

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con titolo principale - stesso stile di Home20 */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('categories.title')}</Text>
      </View>

      <View style={styles.content}>
        <SearchTasksButton onPress={handleOpenSearch} />
        <CategoryList ref={categoryListRef} />
        <View style={styles.addButtonContainer}>
          <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
        </View>
      </View>

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
    backgroundColor: '#ffffff',
  },  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },  mainTitle: {
    paddingTop: 10,
    fontSize: 30,
    fontWeight: "200", // Stesso peso di Home20
    color: "#000000",
    textAlign: "left",
    fontFamily: "System",
    letterSpacing: -1.5,
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 80,
  },
});

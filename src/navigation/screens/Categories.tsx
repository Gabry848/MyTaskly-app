import React, { useRef, useState } from "react";
import { 
  View, 
  StyleSheet, 
  Text, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import CategoryList from '../../../components/CategoryList';
import AddCategoryButton from "../../../components/AddCategoryButton";
import SearchTasksButton from "../../../components/SearchTasksButton";
import GlobalTaskSearch from "../../../components/GlobalTaskSearch";

export default function Categories() {
  const categoryListRef = useRef<{ reloadCategories: () => void } | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  
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
        <Text style={styles.mainTitle}>Le tue categorie</Text>
      </View>

      <View style={styles.content}>
        <SearchTasksButton onPress={handleOpenSearch} />
        <CategoryList />
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

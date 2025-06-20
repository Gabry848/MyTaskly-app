import React, { useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import CategoryList from '../../../components/CategoryList';
import AddCategoryButton from "../../../components/AddCategoryButton";

export default function Categories() {
  const categoryListRef = useRef<{ reloadCategories: () => void } | null>(null);
  
  const handleCategoryAdded = () => {
    if (categoryListRef.current) {
      categoryListRef.current.reloadCategories();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con titolo principale - stesso stile di Home20 */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Le tue categorie</Text>
      </View>

      <View style={styles.content}>
        <CategoryList />
        <View style={styles.addButtonContainer}>
          <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainTitle: {
    paddingTop: 10,
    fontSize: 30,
    fontWeight: "200", // Stesso peso di Home20
    color: "#000000",
    textAlign: "left",
    fontFamily: "System",
    letterSpacing: -1.5,
    marginBottom: 10,
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

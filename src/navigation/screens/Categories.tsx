import React, { useRef } from "react";
import { View, StyleSheet, ScrollView } from 'react-native';
import CategoryList from '../../../components/CategoryList';
import AddCategoryButton from "../../../components/AddCategoryButton"; // nuovo import

export default function Categories() {
  const categoryListRef = useRef<{ reloadCategories: () => void } | null>(null);
  const handleCategoryAdded = () => {
    if (categoryListRef.current) {
      categoryListRef.current.reloadCategories();
    }
  };
  return (
    <View style={styles.container}>
      <CategoryList />
      <View style={styles.inner}>
        <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  inner: {
    position: 'absolute',
    bottom: 10,
    right: 80, // Cambia da 'right' a 'left'
  },
});

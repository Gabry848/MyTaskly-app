import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getCategories } from '../src/services/taskService';
import Category from './Category'; // Importa il componente Category
import AddCategoryButton from './AddCategoryButton'; // Importa il componente AddCategoryButton
import { View, StyleSheet, Text, Button, Dimensions } from 'react-native';
interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string; // Aggiungi l'URL dell'immagine
}

const CategoryList = forwardRef((props, ref) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    try {
      const categories = await getCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Errore nel recupero delle categorie:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useImperativeHandle(ref, () => ({
    reloadCategories: () => {
      setLoading(true);
      fetchCategories();
    }
  }));

  

  return (
    <View>
      <AddCategoryButton onCategoryAdded={() => {
          setLoading(true);
          fetchCategories();
      }} /> {/* Passa la funzione come prop */}
      {categories && categories.length > 0 ? (
        categories.map((category, index) => (
          <Category
            key={category.id ?? index}
            title={category.name}
            imageUrl={category.imageUrl}
          />
        ))
      ) : (
        !loading && (
          <View style={styles.noCategoriesContainer}>
            <Text style={styles.noCategoriesMessage}>Nessuna categoria disponibile al momento. Riprova più tardi!</Text>
            <Button title="Ricarica" onPress={fetchCategories} color="#007bff" />
          </View>
        )
      )}
      {loading && (
        <View style={styles.loadingSpinner}>
          <View style={styles.spinner}></View>
        </View>
      )}
    </View>
  );
});


const styles = StyleSheet.create({
  noCategoriesContainer: {
    textAlign: 'center',
    marginTop: 20,
  },
  noCategoriesMessage: {
    fontSize: 18,
    color: '#555',
  },
  reloadButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: 10,
    fontSize: 16,
    cursor: 'pointer',
    borderRadius: 5,
    marginTop: 10,
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height,
  },
  spinner: {
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#22a6b3',
    borderRadius: 50,
    width: 40,
    height: 40,
  },
});

export default CategoryList;

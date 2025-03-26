import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getCategories } from '../src/services/taskService';
import Category from './Category'; // Importa il componente Category
import AddCategoryButton from './AddCategoryButton'; // Importa il componente AddCategoryButton
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, Image } from 'react-native';

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
      }} /> 
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          <Text style={{ fontWeight: 'bold' }}>Le mie categorie</Text>
        </Text>
        <TouchableOpacity style={styles.reloadButton} onPress={fetchCategories}>
          <Image 
            source={require('../assets/refresh.png')}
            style={{ width: 20, height: 20 }}
            />
        </TouchableOpacity>
      </View>
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
            <TouchableOpacity style={styles.reloadButton} onPress={fetchCategories}>
              <Text style={styles.reloadButtonText}>Ricarica</Text>
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
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
  iconButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 10
  },
  headerTitle: {
    fontSize: 20
  }
});

export default CategoryList;

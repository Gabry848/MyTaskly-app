import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../src/types';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories } from '../src/services/taskService';
import Category from './Category';
import AddCategoryButton from './AddCategoryButton';

interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category_id?: number;
  status_code?: number;
}

interface CategoryViewProps {
  onCategoryAdded: (category: CategoryType) => void;
  onCategoryDeleted: () => void;
  onCategoryEdited: () => void;
  reloadCategories: () => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  onCategoryAdded,
  onCategoryDeleted,
  onCategoryEdited,
  reloadCategories
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        console.error("getCategories non ha restituito un array:", categoriesData);
      }
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
    }, [])
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <ScrollView>
      {/* RIMOSSO AddCategoryButton che era visualizzato all'inizio */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          <Text style={{ fontWeight: "bold" }}>Le mie categorie</Text>
        </Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={reloadCategories}
        >
          <Image
            source={require("../assets/refresh.png")}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      </View>
      {categories && categories.length > 0
        ? categories.map((category, index) => (
            <Category
              key={`${category.id || category.name}-${index}`}
              title={category.name}
              description={category.description}
              imageUrl={category.imageUrl}
              onDelete={onCategoryDeleted}
              onEdit={onCategoryEdited}
            />
          ))
        : !loading && (
            <View style={styles.noCategoriesContainer}>
              <Text style={styles.noCategoriesMessage}>
                Aggiungi la tua prima categoria per iniziare!{"\n"}
              </Text>
              <Text
                style={[
                  styles.noCategoriesMessage,
                  { padding: 5, fontSize: 16, color: "black" },
                ]}
              >
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
      {loading && (
        <View style={styles.loadingSpinner}>
          <View style={styles.spinner}></View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 10,
  },
  headerTitle: {
    fontSize: 20,
  },
  noCategoriesContainer: {
    textAlign: "center",
    marginTop: 20,
  },
  noCategoriesMessage: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  reloadButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  goToLoginButton: {
    width: 150,
    alignSelf: "center",
  },
  reloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingSpinner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: Dimensions.get("window").height,
  },
  spinner: {
    borderWidth: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderLeftColor: "#22a6b3",
    borderRadius: 50,
    width: 40,
    height: 40,
  },
});

export default CategoryView;
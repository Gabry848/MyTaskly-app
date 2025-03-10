import React, { useEffect, useState } from 'react';
import { getCategories } from '../src/services/taskService';
import Category from './Category'; // Importa il componente Category
import './LoadingSpinner.css'; // Assicurati di avere un file CSS per lo spinner

interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string; // Aggiungi l'URL dell'immagine
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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

    fetchCategories();
  }, []);

  return (
    <div>
      {categories && categories.length > 0 ? (
        categories.map((category, index) => (
          <Category
            key={category.id ?? index}
            title={category.name}
            imageUrl={category.imageUrl}
          />
        ))
      ) : (
        !loading && <p className="no-categories-message">Nessuna categoria disponibile al momento. Riprova più tardi!</p>
      )}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;

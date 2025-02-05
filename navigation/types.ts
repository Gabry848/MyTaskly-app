interface CardListProps {
  categoryName: string;
  lista: Lista[];
}

interface Lista {
  title: string;
  image: string;
  descrizione: string;
  importanza: number;
  scadenza: string;
}

type RootStackParamList = {
  Home: undefined;
  Category: undefined;
  CardList: { lista: Lista[]; categoryName: string };
};
import { Dimensions } from "react-native";

export const { width } = Dimensions.get("window");

// Funzioni di utility per date e priorità
export const getDaysRemainingText = (endDate) => {
  const today = new Date();
  const dueDate = new Date(endDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Scaduto";
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  return `${diffDays} giorni`;
};

export const getDaysRemainingColor = (endDate) => {
  const today = new Date();
  const dueDate = new Date(endDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "#ff4444";
  if (diffDays <= 2) return "#ff8800";
  return "#007AFF";
};

// Colori di priorità per lo sfondo della card
export const getPriorityColors = (priority) => {
  switch (priority) {
    case "Alta":
      return "#FFCDD2"; // Sfondo rosso acceso
    case "Media":
      return "#FFF8E6"; // Sfondo giallo chiaro
    case "Bassa":
    default:
      return "#C8E6C9"; // Sfondo verde più chiaro
  }
};
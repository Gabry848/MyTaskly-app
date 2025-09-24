import { Dimensions } from "react-native";

export const { width } = Dimensions.get("window");

// Funzioni di utility per date e priorità
export const getDaysRemainingText = (endDate) => {
  if (!endDate) return "Nessuna scadenza";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(endDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Scaduto";
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  return `${diffDays} giorni`;
};

export const getDaysRemainingColor = (endDate) => {
  if (!endDate) return "#999999"; // Grigio neutro per task senza scadenza

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(endDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "#000000"; // Nero per scaduti
  if (diffDays <= 2) return "#333333"; // Grigio molto scuro per urgenti
  return "#666666"; // Grigio medio per il resto
};

// Colore del testo in base alla priorità (più scuro = più importante)
export const getPriorityTextColor = (priority) => {
  switch (priority) {
    case "Alta":
      return "#000000"; // Nero per alta priorità
    case "Media":
      return "#333333"; // Grigio scuro per media priorità
    case "Bassa":
    default:
      return "#666666"; // Grigio medio per bassa priorità
  }
};

// Colori di priorità per lo sfondo della card (gradiente di scurezza)
export const getPriorityColors = (priority) => {
  switch (priority) {
    case "Alta":
      return "#f0f0f0"; // Grigio molto chiaro per alta priorità (più scuro)
    case "Media":
      return "#f8f8f8"; // Grigio chiarissimo per media priorità
    case "Bassa":
    default:
      return "#ffffff"; // Bianco per bassa priorità (più chiaro)
  }
};

// Ottieni il colore del bordo sinistro in base alla priorità (più scuro = più importante)
export const getPriorityBorderColor = (priority) => {
  switch (priority) {
    case "Alta":
      return "#000000"; // Nero per alta priorità
    case "Media":
      return "#333333"; // Grigio scuro per media priorità
    case "Bassa":
    default:
      return "#666666"; // Grigio medio per bassa priorità
  }
};
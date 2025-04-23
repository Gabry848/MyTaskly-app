import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Stili della card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedCard: {
    backgroundColor: "#F5F5F5",
  },
  
  // Layout
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  taskInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  
  // Testo
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888888",
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    paddingLeft: 34, // Align with title text
  },
  
  descriptionContainer: {
    marginTop: 10,
    paddingBottom: 5,
    overflow: 'hidden',
  },
  
  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: "#2EC4B6",
    borderColor: "#2EC4B6",
  },
  
  // Data e giorni rimanenti
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
    fontWeight: "500",
  },
  daysRemainingContainer: {
    marginLeft: 'auto',
    marginRight: 8,
    justifyContent: 'center',
  },
  daysRemaining: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: 'right',
  },
  
  // Pulsanti e menu
  expandButton: {
    alignSelf: "center",
    marginTop: 4,
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    borderRadius: 8,
    marginTop: 8,
  },
  
  // Stili del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  
  // Stili per il modal di modifica
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#10e0e0',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  editModalContent: {
    padding: 16,
  },
  editModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityButtonLow: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  priorityButtonMedium: {
    borderColor: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  priorityButtonHigh: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flex: 3,
    marginRight: 8,
  },
  timeButton: {
    flex: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusButtonPending: {
    borderColor: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  statusButtonInProgress: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  statusButtonCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
});
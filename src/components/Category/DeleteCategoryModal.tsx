import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DeleteCategoryModalProps {
  visible: boolean;
  categoryName: string;
  isCalendarConnected: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (deleteFromCalendar: boolean) => void;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  visible,
  categoryName,
  isCalendarConnected,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.title}>Elimina categoria</Text>

          <Text style={styles.message}>
            Sei sicuro di voler eliminare{" "}
            <Text style={styles.categoryName}>"{categoryName}"</Text>?
          </Text>
          <Text style={styles.subMessage}>
            Tutti i task al suo interno verranno eliminati.
          </Text>

          {/* Sezione Google Calendar — visibile solo se connesso */}
          {isCalendarConnected && (
            <View style={styles.calendarSection}>
              <View style={styles.calendarSectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#000000" />
                <Text style={styles.calendarTitle}>Google Calendar</Text>
              </View>
              <Text style={styles.calendarDescription}>
                Vuoi eliminare i task di questa categoria anche da Google Calendar?
              </Text>

              <View style={styles.calendarButtons}>
                <TouchableOpacity
                  style={[styles.calendarBtn, styles.calendarBtnYes]}
                  onPress={() => onConfirm(true)}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.calendarBtnYesText}>
                      Sì, elimina ovunque
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.calendarBtn, styles.calendarBtnNo]}
                  onPress={() => onConfirm(false)}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calendarBtnNoText}>
                    No, solo dall'app
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottoni standard — solo se non connesso a Google Calendar */}
          {!isCalendarConnected && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Annulla
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => onConfirm(false)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>
                    Elimina
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Link annulla — visibile solo quando la sezione Google Calendar è presente */}
          {isCalendarConnected && (
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={onCancel}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelLinkText}>Annulla</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 28,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "300",
    color: "#000000",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 17,
    color: "#000000",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 6,
    fontFamily: "System",
    fontWeight: "400",
  },
  categoryName: {
    fontWeight: "500",
    color: "#000000",
  },
  subMessage: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
    fontWeight: "400",
  },
  // Sezione Google Calendar
  calendarSection: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  calendarDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 14,
    fontFamily: "System",
    fontWeight: "400",
  },
  calendarButtons: {
    gap: 10,
  },
  calendarBtn: {
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  calendarBtnYes: {
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarBtnYesText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "System",
  },
  calendarBtnNo: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
  },
  calendarBtnNoText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "System",
  },
  // Bottoni standard (senza calendar)
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
  },
  cancelButtonText: {
    color: "#000000",
  },
  deleteButton: {
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteButtonText: {
    color: "#ffffff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "System",
  },
  // Link annulla (sotto la sezione calendar)
  cancelLink: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    color: "#999999",
    fontFamily: "System",
    fontWeight: "400",
  },
});

export default DeleteCategoryModal;

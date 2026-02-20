import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";

export interface DeleteCategoryModalProps {
  visible: boolean;
  categoryName: string;
  isCalendarConnected: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  /** deleteFromCalendar sarà true se l'utente vuole eliminare anche da Google Calendar, false altrimenti */
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
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon area */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🗑️</Text>
          </View>

          <Text style={styles.title}>Elimina categoria</Text>
          <Text style={styles.message}>
            Sei sicuro di voler eliminare la categoria{" "}
            <Text style={styles.categoryName}>"{categoryName}"</Text>?
          </Text>
          <Text style={styles.subMessage}>
            Tutti i task al suo interno verranno eliminati.
          </Text>

          {/* Google Calendar section — visible only when connected */}
          {isCalendarConnected && (
            <View style={styles.calendarSection}>
              <View style={styles.calendarSectionHeader}>
                <Text style={styles.calendarIcon}>📅</Text>
                <Text style={styles.calendarTitle}>Google Calendar</Text>
              </View>
              <Text style={styles.calendarDescription}>
                Vuoi eliminare anche i task di questa categoria da Google Calendar?
              </Text>

              <View style={styles.calendarButtons}>
                <TouchableOpacity
                  style={[styles.calendarBtn, styles.calendarBtnYes]}
                  onPress={() => onConfirm(true)}
                  disabled={isDeleting}
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarBtnNoText}>
                    No, solo dall'app
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Standard buttons — shown only when NOT connected to Google Calendar */}
          {!isCalendarConnected && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Annulla
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => onConfirm(false)}
                disabled={isDeleting}
                activeOpacity={0.8}
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

          {/* Cancel link — shown when Google Calendar section is visible */}
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff5f5",
    borderWidth: 1.5,
    borderColor: "#ffd0d0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "300",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: "#444444",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  categoryName: {
    fontWeight: "600",
    color: "#000000",
  },
  subMessage: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginBottom: 20,
  },
  // Google Calendar section
  calendarSection: {
    width: "100%",
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    padding: 16,
    marginBottom: 4,
  },
  calendarSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  calendarIcon: {
    fontSize: 16,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  calendarDescription: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 19,
    marginBottom: 14,
  },
  calendarButtons: {
    gap: 10,
  },
  calendarBtn: {
    borderRadius: 12,
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
    fontSize: 15,
    fontWeight: "500",
  },
  calendarBtnNo: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
  },
  calendarBtnNoText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "400",
  },
  // Standard buttons (no calendar)
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
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
  },
  // Cancel link (shown below calendar section)
  cancelLink: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    color: "#888888",
    textDecorationLine: "underline",
  },
});

export default DeleteCategoryModal;

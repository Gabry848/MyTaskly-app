import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import categoryShareService from "../../services/categoryShareService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/authConstants";

interface ShareCategoryDialogProps {
  visible: boolean;
  categoryId: number;
  categoryName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ShareCategoryDialog: React.FC<ShareCategoryDialogProps> = ({
  visible,
  categoryId,
  categoryName,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"READ_ONLY" | "READ_WRITE">("READ_ONLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user email for validation
      const currentUserEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL) || "";

      // Validate the request
      const validation = categoryShareService.validateShareRequest(email, currentUserEmail);
      if (!validation.valid) {
        setError(validation.error || "Errore di validazione");
        setLoading(false);
        return;
      }

      // Share the category
      const result = await categoryShareService.shareCategory(categoryId, email, permission);

      onSuccess(`Categoria condivisa con ${result.shared_with}`);
      handleClose();
    } catch (err: any) {
      // Handle specific error messages
      let errorMessage = "Errore sconosciuto. Riprova più tardi.";

      if (err.status === 400) {
        if (err.message.includes("already shared")) {
          errorMessage = "Categoria già condivisa con questo utente";
        } else if (err.message.includes("not found")) {
          errorMessage = "Utente non trovato. Verifica l'email.";
        } else if (err.message.includes("yourself")) {
          errorMessage = "Non puoi condividere con te stesso!";
        }
      } else if (err.status === 403) {
        errorMessage = "Non hai i permessi per condividere questa categoria";
      } else if (err.status === 404) {
        errorMessage = "Categoria non trovata";
      } else if (err.status === 401) {
        errorMessage = "Sessione scaduta. Effettua nuovamente il login.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPermission("READ_ONLY");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.dialog}>
          <Text style={styles.title}>Condividi "{categoryName}"</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email utente:</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Permessi:</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setPermission("READ_ONLY")}
                disabled={loading}
              >
                <View style={styles.radioCircle}>
                  {permission === "READ_ONLY" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Sola lettura (READ_ONLY)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setPermission("READ_WRITE")}
                disabled={loading}
              >
                <View style={styles.radioCircle}>
                  {permission === "READ_WRITE" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Lettura e scrittura (READ_WRITE)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (loading || !email) && styles.disabledButton,
              ]}
              onPress={handleShare}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Condividi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#c33",
    fontSize: 14,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default ShareCategoryDialog;

import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";
import { useTranslation } from "react-i18next";

export interface ReadOnlyModalProps {
  visible: boolean;
  onClose: () => void;
  taskTitle: string;
}

const ReadOnlyModal = ({ visible, onClose, taskTitle }: ReadOnlyModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>{t("tasks.readOnly.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.editModalContent}>
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialIcons name="lock" size={64} color="#666" />
              <Text style={{
                fontSize: 16,
                color: "#666",
                textAlign: "center",
                marginTop: 20,
                lineHeight: 24,
                paddingHorizontal: 10
              }}>
                {t("tasks.readOnly.message")}
              </Text>
              <Text style={{
                fontSize: 14,
                color: "#888",
                textAlign: "center",
                marginTop: 10,
                paddingHorizontal: 10
              }}>
                {t("tasks.readOnly.subMessage")}
              </Text>
            </View>
          </View>

          <View style={styles.editModalFooter}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onClose}
            >
              <Text style={styles.saveButtonText}>{t("tasks.readOnly.confirmButton")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReadOnlyModal;

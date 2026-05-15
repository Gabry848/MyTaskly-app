import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import categoryShareService, {
  UserShareInfo,
} from "../../services/categoryShareService";
import { useTranslation } from "react-i18next";

export interface ManageCategorySharesProps {
  visible: boolean;
  categoryId: number;
  categoryName: string;
  isOwner: boolean;
  onClose: () => void;
  onAddPerson: () => void;
}

const ManageCategoryShares: React.FC<ManageCategorySharesProps> = ({
  visible,
  categoryId,
  categoryName,
  isOwner,
  onClose,
  onAddPerson,
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserShareInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible, categoryId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await categoryShareService.getCategoryUsers(categoryId);
      setUsers(usersData);
    } catch (error: any) {
      console.error("Error loading users:", error);
      Alert.alert(t("categories.messages.error"), t("categories.manageAccess.errors.loadUsers"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleChangePermission = (user: UserShareInfo) => {
    if (!isOwner) {
      Alert.alert(t("categories.messages.error"), t("categories.manageAccess.errors.onlyOwnerCanModify"));
      return;
    }

    const newPermission = user.permission_level === "READ_ONLY" ? "READ_WRITE" : "READ_ONLY";

    Alert.alert(
      t("categories.manageAccess.changePermissionTitle"),
      t("categories.manageAccess.changePermissionMessage", {
        name: user.name,
        permission: newPermission
      }),
      [
        { text: t("categories.manageAccess.cancel"), style: "cancel" },
        {
          text: t("categories.manageAccess.confirm"),
          onPress: async () => {
            try {
              // Find the share_id from the shares list
              const shares = await categoryShareService.getCategoryShares(categoryId);
              const share = shares.find((s) => s.shared_with_user_id === user.user_id);

              if (!share) {
                Alert.alert(t("categories.messages.error"), t("categories.manageAccess.errors.shareNotFound"));
                return;
              }

              await categoryShareService.updateSharePermission(
                categoryId,
                share.share_id,
                newPermission
              );

              Alert.alert(t("categories.shared.success"), t("categories.manageAccess.success.permissionUpdated", { permission: newPermission }));
              loadUsers();
            } catch (error: any) {
              console.error("Error updating permission:", error);
              Alert.alert(t("categories.messages.error"), error.message || t("categories.manageAccess.errors.updateFailed"));
            }
          },
        },
      ]
    );
  };

  const handleRemoveUser = (user: UserShareInfo) => {
    if (!isOwner) {
      Alert.alert(t("categories.messages.error"), t("categories.manageAccess.errors.onlyOwnerCanRemove"));
      return;
    }

    Alert.alert(
      t("categories.manageAccess.removeAccessTitle"),
      t("categories.manageAccess.removeAccessMessage", { name: user.name }),
      [
        { text: t("categories.manageAccess.cancel"), style: "cancel" },
        {
          text: t("categories.manageAccess.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await categoryShareService.removeShare(categoryId, user.user_id);
              Alert.alert(t("categories.shared.success"), t("categories.manageAccess.success.accessRemoved", { name: user.name }));
              loadUsers();
            } catch (error: any) {
              console.error("Error removing user:", error);
              Alert.alert(t("categories.messages.error"), error.message || t("categories.manageAccess.errors.removeFailed"));
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserShareInfo }) => {
    const isCurrentUserOwner = item.permission_level === "OWNER";

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.userIconContainer}>
            <Text style={styles.userIcon}>👤</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.name} {isCurrentUserOwner && t("categories.manageAccess.you")}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userPermission}>
              {isCurrentUserOwner
                ? t("categories.manageAccess.owner")
                : item.permission_level === "READ_ONLY"
                ? t("categories.manageAccess.readOnly")
                : t("categories.manageAccess.readWrite")}
            </Text>
          </View>
        </View>

        {!isCurrentUserOwner && isOwner && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                t("categories.manageAccess.actions"),
                t("categories.manageAccess.whatToDo", { name: item.name }),
                [
                  { text: t("categories.manageAccess.cancel"), style: "cancel" },
                  {
                    text: t("categories.manageAccess.changePermission"),
                    onPress: () => handleChangePermission(item),
                  },
                  {
                    text: t("categories.manageAccess.remove"),
                    style: "destructive",
                    onPress: () => handleRemoveUser(item),
                  },
                ]
              );
            }}
          >
            <Text style={styles.menuButtonText}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("categories.manageAccess.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.categoryName}>{categoryName}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <>
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.user_id.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t("categories.manageAccess.noUsers")}</Text>
                  </View>
                }
              />

              {isOwner && (
                <TouchableOpacity style={styles.addButton} onPress={onAddPerson}>
                  <Text style={styles.addButtonText}>{t("categories.manageAccess.addPerson")}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 24,
    color: "#999",
  },
  categoryName: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userIcon: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  userPermission: {
    fontSize: 12,
    color: "#999",
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 24,
    color: "#999",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  addButton: {
    backgroundColor: "#000000",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ManageCategoryShares;

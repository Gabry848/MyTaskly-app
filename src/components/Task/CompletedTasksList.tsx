import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface CompletedTaskProps {
  id: number | string;
  title: string;
  completedDate: string;
}

export interface CompletedTasksListProps {
  tasks: CompletedTaskProps[];
  onTaskPress: (taskId: number | string) => void;
  isLoading?: boolean;
}

const SKELETON_COUNT = 3;

const SkeletonRow: React.FC<{ index: number }> = ({ index }) => {
  const shimmer = new Animated.Value(0);

  useEffect(() => {
    const offset = index * 200;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(offset),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [index]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonCheck} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle}>
          <Animated.View
            style={[styles.skeletonShimmer, { transform: [{ translateX }] }]}
          />
        </View>
        <View style={styles.skeletonDate}>
          <Animated.View
            style={[styles.skeletonShimmer, { transform: [{ translateX }] }]}
          />
        </View>
      </View>
    </View>
  );
};

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({
  tasks,
  onTaskPress,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleTasksCount, setVisibleTasksCount] = useState(3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleViewAll = () => {
    setVisibleTasksCount(tasks.length);
  };

  const safeVisibleTasks = isExpanded
    ? (visibleTasksCount < tasks.length
        ? tasks.slice(0, visibleTasksCount)
        : tasks
      ).filter((task) => task && task.id != null)
    : [];

  const renderTaskItem = ({ item }: { item: CompletedTaskProps }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => onTaskPress(item.id)}
    >
      <View style={styles.checkIconContainer}>
        <MaterialIcons name="check-circle" size={20} color="#34C759" />
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.completedTime}>
          Completato il {formatDate(item.completedDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!tasks || tasks.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.skeletonTitleLabel}>
              <Animated.View style={styles.skeletonShimmerStatic} />
            </View>
            <View style={styles.skeletonBadge}>
              <Animated.View style={styles.skeletonShimmerStatic} />
            </View>
          </View>
          <View style={styles.skeletonToggleButton}>
            <Animated.View style={styles.skeletonShimmerStatic} />
          </View>
        </View>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonRow key={i} index={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Completati di recente</Text>
          <Text style={styles.counterText}>{tasks.length}</Text>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleButtonText}>
            {isExpanded ? "Chiudi" : "Mostra"}
          </Text>
          <MaterialIcons
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#000000"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <>
          <FlatList
            data={safeVisibleTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) =>
              item.id !== undefined ? item.id.toString() : `task-${Math.random()}`
            }
            scrollEnabled={false}
          />

          {tasks.length > visibleTasksCount && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAll}
            >
              <Text style={styles.viewAllText}>
                Mostra tutti ({tasks.length})
              </Text>
            </TouchableOpacity>
          )}

          {tasks.length > 0 && tasks.length <= visibleTasksCount && (
            <Text style={styles.taskCountText}>
              {tasks.length} {tasks.length === 1 ? "task completato" : "task completati"}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    overflow: "hidden",
  },
  viewAllButton: {
    alignSelf: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  viewAllText: {
    color: "#000000",
    fontWeight: "400",
    fontSize: 15,
    fontFamily: "System",
  },
  taskCountText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 14,
    marginTop: 8,
    fontFamily: "System",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  checkIconContainer: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 2,
    fontFamily: "System",
  },
  completedTime: {
    fontSize: 13,
    color: "#666666",
    fontFamily: "System",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
    fontFamily: "System",
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  skeletonCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    width: "65%",
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  skeletonDate: {
    height: 12,
    width: "40%",
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  skeletonShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e8e8e8",
    width: 120,
    borderRadius: 4,
  },
  skeletonShimmerStatic: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eaeaea",
    borderRadius: 4,
  },
  skeletonTitleLabel: {
    height: 20,
    width: 150,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  skeletonBadge: {
    width: 24,
    height: 20,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginLeft: 10,
    overflow: "hidden",
  },
  skeletonToggleButton: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    overflow: "hidden",
  },
});

export default CompletedTasksList;

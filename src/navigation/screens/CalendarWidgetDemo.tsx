import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  taskWidget?: {
    taskId: string;
    action: 'created' | 'moved' | 'updated';
  };
}

const { height } = Dimensions.get('window');

export default function CalendarWidgetDemo() {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [botModifiedDates, setBotModifiedDates] = useState<string[]>(['2025-12-30', '2026-01-02']);
  const [focusMode, setFocusMode] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [showTaskAnimation, setShowTaskAnimation] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // Animated values
  const focusModeScale = useRef(new Animated.Value(0)).current;
  const focusModeOpacity = useRef(new Animated.Value(0)).current;
  const botPulse = useRef(new Animated.Value(1)).current;
  const taskMoveAnim = useRef(new Animated.Value(0)).current;
  const taskCardAnim = useRef(new Animated.Value(0)).current;
  const thinkingDots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Demo tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Riunione team', date: '2025-12-29', completed: false },
    { id: '2', title: 'Palestra', date: '2025-12-30', completed: false },
    { id: '3', title: 'Appuntamento medico', date: '2025-12-31', completed: false },
    { id: '4', title: 'Compleanno Maria', date: '2026-01-02', completed: false },
  ]);

  // Demo messages
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: 'Ciao! Come posso aiutarti oggi?',
      isBot: true,
      timestamp: new Date('2025-12-29T10:00:00'),
    },
    {
      id: '2',
      text: 'Vorrei organizzare i miei impegni della settimana',
      isBot: false,
      timestamp: new Date('2025-12-29T10:01:00'),
    },
    {
      id: '3',
      text: 'Perfetto! Ho aperto il calendario per te. Puoi vedere tutti i tuoi impegni e spostarli. Cosa vuoi organizzare per primo?',
      isBot: true,
      timestamp: new Date('2025-12-29T10:01:30'),
    },
    {
      id: '4',
      text: 'Devo spostare la riunione a domani',
      isBot: false,
      timestamp: new Date('2025-12-29T10:02:00'),
    },
    {
      id: '5',
      text: 'Ho spostato la "Riunione team" a domani, 30 dicembre.',
      isBot: true,
      timestamp: new Date('2025-12-29T10:02:15'),
      taskWidget: {
        taskId: '1',
        action: 'moved',
      },
    },
    {
      id: '6',
      text: 'Grazie! Aggiungi anche cena con amici il 2 gennaio',
      isBot: false,
      timestamp: new Date('2025-12-29T10:03:00'),
    },
    {
      id: '7',
      text: 'Perfetto! Ho aggiunto "Cena con amici" per il 2 gennaio.',
      isBot: true,
      timestamp: new Date('2025-12-29T10:03:15'),
      taskWidget: {
        taskId: '4',
        action: 'created',
      },
    },
  ]);

  // Calendar marked dates
  const getMarkedDates = () => {
    const marked: any = {};
    tasks.forEach((task) => {
      const isBotModified = botModifiedDates.includes(task.date);
      const isSelected = selectedTaskId === task.id;

      if (!marked[task.date]) {
        marked[task.date] = {
          dots: [],
          selected: isSelected,
          selectedColor: isSelected ? '#000000' : undefined,
        };
      }

      // Aggiungi evidenziazione per date modificate dal bot
      if (isBotModified) {
        marked[task.date].marked = true;
        marked[task.date].dotColor = '#000000';
      }

      marked[task.date].dots.push({
        key: task.id,
        color: task.completed ? '#666666' : '#000000',
      });
    });
    return marked;
  };

  const handleTaskWidgetPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCalendarModalVisible(true);
  };

  // Animazione bot pulse quando parla
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (isBotSpeaking) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(botPulse, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(botPulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      botPulse.stopAnimation();
      botPulse.setValue(1);
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isBotSpeaking]);

  // Animazione thinking dots
  useEffect(() => {
    let thinkingAnimations: Animated.CompositeAnimation[] = [];

    if (botThinking) {
      const animations = thinkingDots.map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(dot, {
              toValue: -8,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      );

      thinkingAnimations = animations;
      Animated.parallel(animations).start();
    } else {
      thinkingDots.forEach(dot => {
        dot.stopAnimation();
        dot.setValue(0);
      });
    }

    return () => {
      thinkingAnimations.forEach(anim => anim.stop());
    };
  }, [botThinking]);

  // Animazione focus mode
  useEffect(() => {
    if (focusMode) {
      Animated.parallel([
        Animated.spring(focusModeScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(focusModeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(focusModeScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(focusModeOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focusMode]);

  const toggleRecording = () => {
    const wasRecording = isRecording;
    setIsRecording(!isRecording);

    if (!wasRecording && focusMode) {
      // Inizia sequenza animazioni solo se entriamo in recording mode in focus
      // Bot pensa
      setBotThinking(true);

      const thinkingTimeout = setTimeout(() => {
        setBotThinking(false);
        setIsBotSpeaking(true);

        // Dopo 1.5sec inizia animazione spostamento
        const animationTimeout = setTimeout(() => {
          setMovingTaskId('1');
          setShowTaskAnimation(true);

          // Animazione task card che appare
          Animated.sequence([
            Animated.spring(taskCardAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(taskCardAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowTaskAnimation(false);
            setMovingTaskId(null);
          });

          // Animazione movimento task effettivo
          Animated.sequence([
            Animated.timing(taskMoveAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(taskMoveAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }, 1500);

        // Ferma il bot che parla dopo 5 secondi TOTALI (2s thinking + 3s speaking)
        const speakingTimeout = setTimeout(() => {
          setIsBotSpeaking(false);
          setIsRecording(false);
        }, 3000);

        return () => {
          clearTimeout(animationTimeout);
          clearTimeout(speakingTimeout);
        };
      }, 2000);

      return () => {
        clearTimeout(thinkingTimeout);
      };
    } else if (wasRecording) {
      // Se stiamo fermando la registrazione, ferma tutto
      setBotThinking(false);
      setIsBotSpeaking(false);
      setShowTaskAnimation(false);
      setMovingTaskId(null);
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAttachTask = () => {
    // Apri modal per selezionare task da allegare
    setCalendarModalVisible(true);
  };

  const toggleFocusMode = () => {
    const wasFocusMode = focusMode;
    setFocusMode(!focusMode);

    if (!wasFocusMode) {
      // Entrando in focus mode - non fare nulla, aspetta che user prema rec
    } else {
      // Uscendo da focus mode - resetta tutto
      setIsRecording(false);
      setIsBotSpeaking(false);
      setBotThinking(false);
      setShowTaskAnimation(false);
      setMovingTaskId(null);

      // Resetta anche le animazioni
      taskCardAnim.setValue(0);
      taskMoveAnim.setValue(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Calendar Widget Demo</Text>
          <Text style={styles.headerSubtitle}>Concept di organizzazione collaborativa</Text>
        </View>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]}
            onPress={() => setMode('text')}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={mode === 'text' ? '#FFF' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'voice' && styles.modeButtonActive]}
            onPress={() => setMode('voice')}
          >
            <Ionicons
              name="mic-outline"
              size={20}
              color={mode === 'voice' ? '#FFF' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calendario Organizzazione</Text>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <Calendar
              style={styles.calendar}
              markedDates={getMarkedDates()}
              markingType="multi-dot"
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#000000',
                selectedDayBackgroundColor: '#000000',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#000000',
                dayTextColor: '#000000',
                textDisabledColor: '#d9d9d9',
                dotColor: '#000000',
                selectedDotColor: '#ffffff',
                arrowColor: '#000000',
                monthTextColor: '#000000',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              onDayPress={(day) => {
                console.log('Selected day:', day.dateString);
              }}
            />

            {/* Task list */}
            <ScrollView style={styles.taskListContainer}>
              <View style={styles.taskListHeader}>
                <Text style={styles.taskListTitle}>I tuoi impegni</Text>
                {selectedTaskId && (
                  <TouchableOpacity onPress={() => setSelectedTaskId(null)}>
                    <Text style={styles.clearSelectionText}>Deseleziona</Text>
                  </TouchableOpacity>
                )}
              </View>
              {tasks.map((task) => {
                const isBotModified = botModifiedDates.includes(task.date);
                const isSelected = selectedTaskId === task.id;

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      isSelected && styles.taskItemSelected,
                      isBotModified && styles.taskItemBotModified,
                    ]}
                    onPress={() => setSelectedTaskId(task.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.taskInfo}>
                      <TouchableOpacity onPress={() => toggleTaskComplete(task.id)}>
                        <Ionicons
                          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={isSelected ? '#fff' : task.completed ? '#666' : '#000'}
                        />
                      </TouchableOpacity>
                      <View style={styles.taskTextContainer}>
                        <View style={styles.taskTitleRow}>
                          <Text
                            style={[
                              styles.taskTitle,
                              task.completed && styles.taskTitleCompleted,
                              isSelected && styles.taskTitleSelected,
                            ]}
                          >
                            {task.title}
                          </Text>
                          {isBotModified && !isSelected && (
                            <View style={styles.botBadge}>
                              <Ionicons name="sparkles" size={12} color="#000" />
                              <Text style={styles.botBadgeText}>Bot</Text>
                            </View>
                          )}
                          {isBotModified && isSelected && (
                            <View style={[styles.botBadge, styles.botBadgeSelected]}>
                              <Ionicons name="sparkles" size={12} color="#fff" />
                              <Text style={[styles.botBadgeText, styles.botBadgeTextSelected]}>Bot</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.taskDate, isSelected && styles.taskDateSelected]}>
                          {task.date}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.moveButton}>
                      <Ionicons name="swap-horizontal" size={20} color={isSelected ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat/Voice Interface */}
      <View style={styles.chatContainer}>
        {mode === 'text' ? (
          <>
            {/* Text Chat Messages */}
            <ScrollView style={styles.messagesContainer}>
              {messages.map((message) => (
                <View key={message.id} style={styles.messageWrapper}>
                  <View
                    style={[
                      styles.messageBubble,
                      message.isBot ? styles.botMessage : styles.userMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isBot ? styles.botMessageText : styles.userMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        !message.isBot && styles.messageTimeUser,
                      ]}
                    >
                      {message.timestamp.toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Task Widget */}
                  {message.taskWidget && message.isBot && (
                    <TouchableOpacity
                      style={styles.taskWidgetContainer}
                      onPress={() => handleTaskWidgetPress(message.taskWidget!.taskId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskWidgetContent}>
                        <View style={styles.taskWidgetIcon}>
                          <Ionicons
                            name={
                              message.taskWidget.action === 'created'
                                ? 'add-circle'
                                : message.taskWidget.action === 'moved'
                                ? 'swap-horizontal'
                                : 'create'
                            }
                            size={20}
                            color="#000"
                          />
                        </View>
                        <View style={styles.taskWidgetInfo}>
                          <Text style={styles.taskWidgetTitle}>
                            {tasks.find((t) => t.id === message.taskWidget!.taskId)?.title}
                          </Text>
                          <Text style={styles.taskWidgetDate}>
                            {tasks.find((t) => t.id === message.taskWidget!.taskId)?.date}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                      </View>
                      <View style={styles.taskWidgetFooter}>
                        <Ionicons name="calendar-outline" size={14} color="#666" />
                        <Text style={styles.taskWidgetFooterText}>
                          Tocca per modificare nel calendario
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Text Input */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.calendarToggleButton}
                  onPress={() => setCalendarModalVisible(true)}
                >
                  <Ionicons name="calendar-outline" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={handleAttachTask}
                >
                  <Ionicons name="attach" size={22} color="#000" />
                </TouchableOpacity>
                <TextInput
                  style={styles.textInput}
                  placeholder="Scrivi un messaggio..."
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity style={styles.sendButton}>
                  <Ionicons name="send" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Voice Chat Interface */}
            {!focusMode ? (
              <View style={styles.voiceContainer}>
                <View style={styles.voiceHeader}>
                  <Text style={styles.voiceStatus}>
                    {isRecording ? 'Ascolto in corso...' : 'Tocca per parlare'}
                  </Text>
                </View>

                {/* Waveform visualization */}
                {isRecording && (
                  <View style={styles.waveformContainer}>
                    {[...Array(20)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: Math.random() * 60 + 20 },
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Voice messages transcription */}
                <ScrollView style={styles.transcriptionContainer}>
                  <View style={styles.transcriptionBubble}>
                    <Text style={styles.transcriptionLabel}>Tu:</Text>
                    <Text style={styles.transcriptionText}>
                      "Vorrei organizzare i miei impegni della settimana"
                    </Text>
                  </View>
                  <View style={[styles.transcriptionBubble, styles.botTranscription]}>
                    <Text style={styles.transcriptionLabel}>Bot:</Text>
                    <Text style={styles.transcriptionText}>
                      "Perfetto! Ho aperto il calendario per te. Puoi vedere tutti i
                      tuoi impegni. Cosa vuoi organizzare per primo?"
                    </Text>
                  </View>
                </ScrollView>

                {/* Voice controls */}
                <View style={styles.voiceControls}>
                  <TouchableOpacity
                    style={styles.voiceControlButton}
                    onPress={() => setCalendarModalVisible(true)}
                  >
                    <Ionicons name="calendar-outline" size={28} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      isRecording && styles.recordButtonActive,
                    ]}
                    onPress={toggleRecording}
                  >
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={40}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.voiceControlButton}
                    onPress={toggleFocusMode}
                  >
                    <Ionicons name="expand" size={28} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Focus Mode - Calendar Full Screen */
              <Animated.View
                style={[
                  styles.focusModeContainer,
                  {
                    opacity: focusModeOpacity,
                    transform: [{ scale: focusModeScale }],
                  },
                ]}
              >
                <Calendar
                  style={styles.focusCalendar}
                  markedDates={getMarkedDates()}
                  markingType="multi-dot"
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#000000',
                    selectedDayBackgroundColor: '#000000',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#000000',
                    dayTextColor: '#000000',
                    textDisabledColor: '#d9d9d9',
                    dotColor: '#000000',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#000000',
                    monthTextColor: '#000000',
                    textDayFontFamily: 'System',
                    textMonthFontFamily: 'System',
                    textDayHeaderFontFamily: 'System',
                    textDayFontWeight: '400',
                    textMonthFontWeight: '600',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 18,
                    textMonthFontSize: 22,
                    textDayHeaderFontSize: 16,
                  }}
                  onDayPress={(day) => {
                    console.log('Selected day:', day.dateString);
                  }}
                />

                {/* Task Animation Overlay */}
                {showTaskAnimation && (
                  <Animated.View
                    style={[
                      styles.taskAnimationOverlay,
                      {
                        opacity: taskCardAnim,
                        transform: [
                          {
                            translateY: taskCardAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0],
                            }),
                          },
                          {
                            scale: taskCardAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.animatedTaskCard}>
                      <Ionicons name="swap-horizontal" size={24} color="#fff" />
                      <Text style={styles.animatedTaskText}>
                        Spostamento "Riunione team"...
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Floating Bot Avatar */}
                <View style={styles.floatingBotContainer}>
                  <Animated.View
                    style={[
                      styles.floatingBot,
                      isBotSpeaking && styles.floatingBotSpeaking,
                      botThinking && styles.floatingBotThinking,
                      {
                        transform: [{ scale: botPulse }],
                      },
                    ]}
                  >
                    <Ionicons
                      name={botThinking ? 'bulb' : 'chatbubbles'}
                      size={28}
                      color="#fff"
                    />
                    {isBotSpeaking && (
                      <View style={styles.botSpeakingIndicator}>
                        <View style={[styles.speakingDot]} />
                        <View style={[styles.speakingDot]} />
                        <View style={[styles.speakingDot]} />
                      </View>
                    )}
                    {botThinking && (
                      <View style={styles.botThinkingIndicator}>
                        {thinkingDots.map((dot, index) => (
                          <Animated.View
                            key={index}
                            style={[
                              styles.thinkingDot,
                              {
                                transform: [{ translateY: dot }],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </Animated.View>
                  <TouchableOpacity
                    style={styles.exitFocusButton}
                    onPress={toggleFocusMode}
                  >
                    <Ionicons name="contract" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Task List in Focus Mode */}
                <View style={styles.focusTaskList}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tasks.map((task) => {
                      const isBotModified = botModifiedDates.includes(task.date);
                      const isMoving = movingTaskId === task.id;

                      return (
                        <Animated.View
                          key={task.id}
                          style={[
                            styles.focusTaskCard,
                            isBotModified && styles.focusTaskCardBotModified,
                            isMoving && {
                              transform: [
                                {
                                  translateY: taskMoveAnim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0, -20, 0],
                                  }),
                                },
                                {
                                  scale: taskMoveAnim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [1, 1.1, 1],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          <View style={styles.focusTaskCardContent}>
                            <Text style={styles.focusTaskTitle}>{task.title}</Text>
                            <Text style={styles.focusTaskDate}>{task.date}</Text>
                          </View>
                          {isBotModified && (
                            <View style={styles.focusBotBadge}>
                              <Ionicons name="sparkles" size={12} color="#fff" />
                            </View>
                          )}
                          {isMoving && (
                            <View style={styles.movingTaskIndicator}>
                              <Ionicons name="trending-up" size={16} color="#fff" />
                            </View>
                          )}
                        </Animated.View>
                      );
                    })}
                  </ScrollView>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '200',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#666666',
    fontFamily: 'System',
    marginTop: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
    marginTop: 10,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  taskListContainer: {
    maxHeight: 250,
    padding: 20,
  },
  taskListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  taskListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  taskItemSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  taskItemBotModified: {
    borderColor: '#000000',
    borderWidth: 1.5,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskTitleSelected: {
    color: '#ffffff',
  },
  botBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  botBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  botBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  botBadgeTextSelected: {
    color: '#ffffff',
  },
  taskDate: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    fontFamily: 'System',
    fontWeight: '300',
  },
  taskDateSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moveButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#000000',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'System',
  },
  botMessageText: {
    color: '#000000',
  },
  userMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999999',
    marginTop: 6,
    textAlign: 'right',
    fontFamily: 'System',
    fontWeight: '300',
  },
  messageTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarToggleButton: {
    marginRight: 8,
    padding: 4,
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '400',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  voiceContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  voiceHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  voiceStatus: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    gap: 4,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  transcriptionContainer: {
    flex: 1,
    padding: 16,
  },
  transcriptionBubble: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  botTranscription: {
    backgroundColor: '#f0f0f0',
  },
  transcriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
    fontFamily: 'System',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    fontFamily: 'System',
    fontWeight: '300',
  },
  voiceControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 24,
  },
  voiceControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonActive: {
    backgroundColor: '#666666',
  },
  taskWidgetContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    marginTop: 8,
    marginLeft: 16,
    maxWidth: '80%',
    overflow: 'hidden',
  },
  taskWidgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  taskWidgetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskWidgetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskWidgetTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 2,
  },
  taskWidgetDate: {
    fontSize: 13,
    fontWeight: '300',
    color: '#666666',
    fontFamily: 'System',
  },
  taskWidgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    gap: 6,
  },
  taskWidgetFooterText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  // Focus Mode Styles
  focusModeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  focusCalendar: {
    height: height * 0.5,
  },
  taskAnimationOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  animatedTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  animatedTaskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'System',
  },
  floatingBotContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    gap: 10,
  },
  floatingBot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBotSpeaking: {
    backgroundColor: '#333333',
  },
  floatingBotThinking: {
    backgroundColor: '#4A90E2',
  },
  botSpeakingIndicator: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    gap: 4,
  },
  speakingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  botThinkingIndicator: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    gap: 3,
  },
  thinkingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  exitFocusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  focusTaskList: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  focusTaskCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  focusTaskCardBotModified: {
    borderColor: '#000000',
    borderWidth: 2,
    backgroundColor: '#fafafa',
  },
  focusTaskCardContent: {
    paddingRight: 24,
  },
  focusTaskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 6,
    lineHeight: 20,
  },
  focusTaskDate: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  focusBotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingTaskIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import { styles } from './styles';
import { FilterChip } from './FilterChip';

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filtroImportanza: string;
  setFiltroImportanza: (value: string) => void;
  filtroScadenza: string; 
  setFiltroScadenza: (value: string) => void;
  ordineScadenza: string;
  setOrdineScadenza: (value: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FilterModal = ({
  visible,
  onClose,
  filtroImportanza,
  setFiltroImportanza,
  filtroScadenza,
  setFiltroScadenza,
  ordineScadenza,
  setOrdineScadenza
}: FilterModalProps) => {
  
  const panY = useRef(new Animated.Value(0)).current;

  // Resetta l'animazione quando il modal si apre
  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  const closeWithAnimation = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Inizia il drag solo se ci si muove in verticale di almeno 10 pixel
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Permetti solo il drag verso il basso
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Se l'utente ha trascinato abbastanza giù o con velocità sufficiente, chiudi
        if (gestureState.dy > 100 || gestureState.vy > 1.5) {
          closeWithAnimation();
        } else {
          // Altrimenti rimbalza alla posizione originale
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={closeWithAnimation}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={{ flex: 1, width: '100%' }} 
          activeOpacity={1} 
          onPress={closeWithAnimation} 
        />
        
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: panY }] }
          ]}
        >
          {/* L'header e la drag handle sono responsabili di catturare il gesto di swipe */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtra task</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeWithAnimation}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Filtro per importanza */}
            <View style={[styles.filterSection, { paddingTop: 0 }]}>
              <Text style={styles.filterTitle}>Importanza</Text>
              <View style={styles.chipsContainer}>
                <FilterChip
                  label="Tutte"
                  isSelected={filtroImportanza === "Tutte"}
                  onPress={() => setFiltroImportanza("Tutte")}
                />
                <FilterChip
                  label="Alta"
                  isSelected={filtroImportanza === "Alta"}
                  onPress={() => setFiltroImportanza("Alta")}
                  color="#000000"
                />
                <FilterChip
                  label="Media"
                  isSelected={filtroImportanza === "Media"}
                  onPress={() => setFiltroImportanza("Media")}
                  color="#333333"
                />
                <FilterChip
                  label="Bassa"
                  isSelected={filtroImportanza === "Bassa"}
                  onPress={() => setFiltroImportanza("Bassa")}
                  color="#666666"
                />
              </View>
            </View>
            
            {/* Filtro per scadenza */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Scadenza</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
              >
                <FilterChip
                  label="Tutte"
                  isSelected={filtroScadenza === "Tutte"}
                  onPress={() => setFiltroScadenza("Tutte")}
                />
                <FilterChip
                  label="Oggi"
                  isSelected={filtroScadenza === "Oggi"}
                  onPress={() => setFiltroScadenza("Oggi")}
                />
                <FilterChip
                  label="Domani"
                  isSelected={filtroScadenza === "Domani"}
                  onPress={() => setFiltroScadenza("Domani")}
                />
                <FilterChip
                  label="Dopodomani"
                  isSelected={filtroScadenza === "Dopodomani"}
                  onPress={() => setFiltroScadenza("Dopodomani")}
                />
                <FilterChip
                  label="Fra 3 giorni"
                  isSelected={filtroScadenza === "Fra 3 giorni"}
                  onPress={() => setFiltroScadenza("Fra 3 giorni")}
                />
                <FilterChip
                  label="Fra 7 giorni"
                  isSelected={filtroScadenza === "Fra 7 giorni"}
                  onPress={() => setFiltroScadenza("Fra 7 giorni")}
                />
                <FilterChip
                  label="Senza scadenza"
                  isSelected={filtroScadenza === "Senza scadenza"}
                  onPress={() => setFiltroScadenza("Senza scadenza")}
                  color="#999999"
                />
              </ScrollView>
            </View>
            
            {/* Ordine di visualizzazione */}
            <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
              <Text style={styles.filterTitle}>Ordina per scadenza</Text>
              <View style={styles.orderContainer}>
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    ordineScadenza === "Recente" && styles.activeOrderButton
                  ]}
                  onPress={() => setOrdineScadenza("Recente")}
                >
                  <Text
                    style={[
                      styles.orderButtonText,
                      ordineScadenza === "Recente" && styles.activeOrderText
                    ]}
                  >
                    Più Recente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    ordineScadenza === "Vecchio" && styles.activeOrderButton
                  ]}
                  onPress={() => setOrdineScadenza("Vecchio")}
                >
                  <Text
                    style={[
                      styles.orderButtonText,
                      ordineScadenza === "Vecchio" && styles.activeOrderText
                    ]}
                  >
                    Più Vecchio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={closeWithAnimation}
            >
              <Text style={styles.applyButtonText}>Applica Filtri</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

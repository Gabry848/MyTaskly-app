import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles';
import { FilterChip } from './FilterChip';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filtroImportanza: string;
  setFiltroImportanza: (value: string) => void;
  filtroScadenza: string; 
  setFiltroScadenza: (value: string) => void;
  ordineScadenza: string;
  setOrdineScadenza: (value: string) => void;
}

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
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtra task</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Filtro per importanza */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Importanza</Text>
              <View style={styles.chipsContainer}>
                <FilterChip
                  label="Tutte"
                  isSelected={filtroImportanza === "Tutte"}
                  onPress={() => setFiltroImportanza("Tutte")}
                />                <FilterChip
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
              <View style={styles.chipsContainer}>
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
              </View>
              <View style={styles.chipsContainer}>
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
              </View>
            </View>
            
            {/* Ordine di visualizzazione */}
            <View style={styles.filterSection}>
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
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Applica Filtri</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SharingInfoProps {
  isOwned: boolean;
  ownerName?: string;
  permissionLevel?: 'READ_ONLY' | 'READ_WRITE';
}

const SharingInfo: React.FC<SharingInfoProps> = ({
  isOwned,
  ownerName,
  permissionLevel
}) => {
  if (isOwned) {
    return (
      <View style={styles.sharingInfoContainer}>
        <View style={styles.separator} />
        <View style={styles.sharingPrimaryRow}>
          <MaterialIcons
            name="people-outline"
            size={16}
            color="#424242"
            style={styles.sharingIcon}
          />
          <Text style={styles.sharingPrimaryText}>
            Condivisa con altri
          </Text>
        </View>
      </View>
    );
  }

  const ownerDisplayName = ownerName || 'altro utente';

  return (
    <View style={styles.sharingInfoContainer}>
      <View style={styles.separator} />
      <View style={styles.sharingPrimaryRow}>
        <MaterialIcons
          name="person-outline"
          size={16}
          color="#424242"
          style={styles.sharingIcon}
        />
        <Text style={styles.sharingPrimaryText}>
          Condivisa da <Text style={styles.ownerName}>{ownerDisplayName}</Text>
        </Text>
        <MaterialIcons
          name={permissionLevel === 'READ_ONLY' ? 'lock' : 'lock-open'}
          size={14}
          color={permissionLevel === 'READ_ONLY' ? '#000000' : '#424242'}
          style={styles.permissionLockIcon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sharingInfoContainer: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 12,
    marginBottom: 12,
  },
  sharingPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sharingIcon: {
    marginRight: 6,
  },
  sharingPrimaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#424242',
    lineHeight: 18,
  },
  ownerName: {
    fontWeight: '600',
    color: '#000000',
  },
  permissionLockIcon: {
    marginLeft: 6,
    marginTop: 1,
  },
});

export default SharingInfo;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryBadgeProps {
  type: 'shared' | 'readOnly' | 'canEdit';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ type }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'shared':
        return {
          icon: 'people-outline' as const,
          iconColor: '#424242',
          ariaLabel: 'Categoria condivisa con altri',
          backgroundColor: '#F5F5F5',
          borderColor: '#BDBDBD',
        };
      case 'readOnly':
        return {
          icon: 'lock-outline' as const,
          iconColor: '#000000',
          ariaLabel: 'Sola lettura - non puoi modificare',
          backgroundColor: '#F5F5F5',
          borderColor: '#757575',
        };
      case 'canEdit':
        return {
          icon: 'edit-outline' as const,
          iconColor: '#424242',
          ariaLabel: 'Puoi modificare questa categoria',
          backgroundColor: '#FFFFFF',
          borderColor: '#9E9E9E',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        }
      ]}
      accessible={true}
      accessibilityLabel={config.ariaLabel}
      accessibilityRole="text"
    >
      <Ionicons
        name={config.icon}
        size={12}
        color={config.iconColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryBadge;

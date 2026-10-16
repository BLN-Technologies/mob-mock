import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';

interface CropBadgeProps {
  cropName: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const CropBadge: React.FC<CropBadgeProps> = ({
  cropName,
  size = 'medium',
  showLabel = false,
}) => {
  const getCropMeta = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('maize') || lower.includes('corn') || lower.includes('ikigori')) {
      return {
        icon: 'nutrition-outline' as const,
        bg: '#FEF3C7',
        color: '#B45309',
        label: 'Maize',
      };
    }
    if (lower.includes('bean') || lower.includes('ibishyimbo')) {
      return {
        icon: 'radio-button-on' as const,
        bg: '#FEE2E2',
        color: '#DC2626',
        label: 'Beans',
      };
    }
    if (lower.includes('tomato') || lower.includes('inyanya')) {
      return {
        icon: 'radio-button-on' as const,
        bg: '#FEE2E2',
        color: '#E11D48',
        label: 'Tomatoes',
      };
    }
    if (lower.includes('potato') || lower.includes('ibirayi')) {
      return {
        icon: 'cube-outline' as const,
        bg: '#FFEDD5',
        color: '#C2410C',
        label: 'Potatoes',
      };
    }
    if (lower.includes('rice') || lower.includes('umuceri')) {
      return {
        icon: 'leaf-outline' as const,
        bg: '#DCFCE7',
        color: '#15803D',
        label: 'Rice',
      };
    }
    if (lower.includes('avocado') || lower.includes('avoka')) {
      return {
        icon: 'leaf' as const,
        bg: '#ECFCCB',
        color: '#3F6212',
        label: 'Avocados',
      };
    }
    if (lower.includes('banana') || lower.includes('igitoki') || lower.includes('ibitoki')) {
      return {
        icon: 'nutrition-outline' as const,
        bg: '#FEF9C3',
        color: '#A16207',
        label: 'Bananas',
      };
    }
    if (lower.includes('onion') || lower.includes('ibitunguru')) {
      return {
        icon: 'flower-outline' as const,
        bg: '#F3E8FF',
        color: '#7E22CE',
        label: 'Onions',
      };
    }
    if (lower.includes('soy') || lower.includes('soya')) {
      return {
        icon: 'ellipse-outline' as const,
        bg: '#ECFCCB',
        color: '#4D7C0F',
        label: 'Soybeans',
      };
    }
    if (lower.includes('cassava') || lower.includes('imyumbati')) {
      return {
        icon: 'cube-outline' as const,
        bg: '#CCFBF1',
        color: '#0F766E',
        label: 'Cassava',
      };
    }
    if (lower.includes('coffee') || lower.includes('ikawa')) {
      return {
        icon: 'cafe-outline' as const,
        bg: '#FEF3C7',
        color: '#78350F',
        label: 'Coffee',
      };
    }
    return {
      icon: 'leaf' as const,
      bg: '#DCFCE7',
      color: colors.primary,
      label: 'Produce',
    };
  };

  const meta = getCropMeta(cropName);

  const dimensions = size === 'small' ? 32 : size === 'large' ? 52 : 42;
  const iconSize = size === 'small' ? 16 : size === 'large' ? 28 : 22;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badge,
          {
            width: dimensions,
            height: dimensions,
            borderRadius: dimensions / 2,
            backgroundColor: meta.bg,
          },
        ]}
      >
        <Ionicons name={meta.icon} size={iconSize} color={meta.color} />
      </View>
      {showLabel && (
        <Text style={[styles.labelText, { color: meta.color }]}>
          {meta.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});

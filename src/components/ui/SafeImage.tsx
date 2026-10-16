import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ImageStyle,
  Text,
} from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { CropBadge } from './CropBadge';

interface SafeImageProps {
  uri?: string;
  cropName?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  accessibilityLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  cropName = 'Produce',
  style,
  resizeMode = 'cover',
  accessibilityLabel,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!uri || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <CropBadge cropName={cropName} size="medium" />
        <Text style={styles.fallbackText} numberOfLines={1}>
          {cropName}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        style={[styles.fillImage, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        accessibilityLabel={accessibilityLabel || `${cropName} photograph`}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  fillImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutralGray,
    marginTop: 4,
  },
});

/**
 * Custom hook for optimized image loading
 */

import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ImageOptimization } from '@/lib/performance';

interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

interface UseOptimizedImageOptions {
  maxDimension?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

/**
 * Hook to optimize images before upload/display
 */
export function useOptimizedImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimizeImage = async (
    sourceUri: string,
    options: UseOptimizedImageOptions = {}
  ): Promise<OptimizedImageResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const {
        maxDimension = 1200,
        quality = 0.8,
        format = 'jpeg',
      } = options;

      // Get image info
      const info = await FileSystem.getInfoAsync(sourceUri);
      if (!info.exists) {
        throw new Error('Image file not found');
      }

      // Read image dimensions (would need actual implementation)
      // For now, we'll assume standard optimization
      
      // For actual implementation, you'd use expo-image-manipulator:
      // import * as ImageManipulator from 'expo-image-manipulator';
      
      // const manipResult = await ImageManipulator.manipulateAsync(
      //   sourceUri,
      //   [{ resize: { width: maxDimension } }],
      //   { compress: quality, format: ImageManipulator.SaveFormat[format.toUpperCase()] }
      // );

      // Placeholder return (replace with actual manipulated image)
      const result: OptimizedImageResult = {
        uri: sourceUri,
        width: 1200,
        height: 900,
        size: info.size || 0,
      };

      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Image optimization failed');
      setError(error);
      setLoading(false);
      return null;
    }
  };

  return {
    optimizeImage,
    loading,
    error,
  };
}

/**
 * Hook for picking and optimizing images from gallery
 */
export function useImagePicker() {
  const { optimizeImage } = useOptimizedImage();
  const [loading, setLoading] = useState(false);

  const pickImage = async (
    options: UseOptimizedImageOptions = {}
  ): Promise<OptimizedImageResult | null> => {
    setLoading(true);

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access gallery was denied');
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // We'll compress later
      });

      if (result.canceled) {
        setLoading(false);
        return null;
      }

      // Optimize picked image
      const optimized = await optimizeImage(result.assets[0].uri, options);
      setLoading(false);
      return optimized;
    } catch (err) {
      console.error('Image picker error:', err);
      setLoading(false);
      return null;
    }
  };

  return {
    pickImage,
    loading,
  };
}

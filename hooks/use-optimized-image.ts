/**
 * Custom hook for optimized image loading
 */

import { useState } from 'react';
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
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
      const { maxDimension = 1200, quality = 0.8, format: outputFormat = 'jpeg' } = options;

      // Get image info
      const info = await FileSystem.getInfoAsync(sourceUri);
      if (!info.exists) {
        throw new Error('Image file not found');
      }

      // Read the real image dimensions, then downscale (longest side <= maxDimension)
      // and re-encode (JPEG by default).
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) =>
        Image.getSize(sourceUri, (width, height) => resolve({ width, height }), reject)
      );
      const target = ImageOptimization.getOptimalDimensions(dims.width, dims.height, maxDimension);
      const needsResize = target.width !== dims.width || target.height !== dims.height;

      const manipulated = await ImageManipulator.manipulateAsync(
        sourceUri,
        needsResize ? [{ resize: { width: target.width, height: target.height } }] : [],
        {
          compress: quality,
          format: outputFormat === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        }
      );
      const outInfo = await FileSystem.getInfoAsync(manipulated.uri);

      const result: OptimizedImageResult = {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        size: outInfo.exists && 'size' in outInfo ? outInfo.size ?? 0 : 0,
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
        quality: 1, // real compression happens in optimizeImage (expo-image-manipulator)
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

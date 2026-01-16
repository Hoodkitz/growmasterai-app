/**
 * Performance optimization utilities for GrowMaster AI
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounce function - delays execution until after wait milliseconds
 * Useful for search inputs, window resize, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 * Useful for scroll handlers, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): any {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
      lastResult = func(...args);
    }
    return lastResult;
  };
}

/**
 * Custom hook for debounced values
 * Usage: const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttled values
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Image optimization helpers
 */
export const ImageOptimization = {
  /**
   * Calculate optimal image dimensions to reduce memory usage
   */
  getOptimalDimensions(
    width: number,
    height: number,
    maxDimension: number = 1200
  ): { width: number; height: number } {
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height };
    }

    const aspectRatio = width / height;
    if (width > height) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio),
      };
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension,
      };
    }
  },

  /**
   * Get appropriate image quality based on device
   */
  getImageQuality(): number {
    // Lower quality on lower-end devices to save memory
    // This would need platform-specific detection in real implementation
    return 0.8; // 80% quality is usually good enough
  },
};

/**
 * List rendering optimization helpers
 */
export const ListOptimization = {
  /**
   * Calculate optimal page size for infinite scrolling
   */
  getPageSize(): number {
    // Adjust based on device performance
    return 20; // Load 20 items at a time
  },

  /**
   * Get estimated item size for FlatList optimization
   */
  getItemLayout: (itemHeight: number) => (
    data: any[] | null | undefined,
    index: number
  ) => ({ length: number; offset: number; index: number }) => {
    return (data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  },
};

/**
 * Memory management utilities
 */
export const MemoryUtils = {
  /**
   * Clear unused caches
   */
  clearCaches(): void {
    // Clear React Query cache for old data
    // This would need to be integrated with actual cache implementation
  },

  /**
   * Cleanup large objects
   */
  cleanup(obj: any): void {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        delete obj[key];
      });
    }
  },
};

/**
 * Network request optimization
 */
export const NetworkOptimization = {
  /**
   * Batch multiple requests together
   */
  batchRequests: <T>(requests: Promise<T>[]): Promise<T[]> => {
    return Promise.all(requests);
  },

  /**
   * Cancel pending requests
   */
  createAbortController(): AbortController {
    return new AbortController();
  },
};

/**
 * Performance monitoring
 */
export const PerformanceMonitor = {
  /**
   * Measure execution time
   */
  measure: <T>(name: string, fn: () => T): T => {
    const start = Date.now();
    const result = fn();
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
    
    return result;
  },

  /**
   * Measure async execution time
   */
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
    
    return result;
  },
};

// React import (needed for hooks)
import { useState } from 'react';

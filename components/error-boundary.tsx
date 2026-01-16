import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', error, { data: errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View className="flex-1 bg-background p-6 justify-center items-center">
          <View className="bg-destructive/10 rounded-xl p-6 max-w-md w-full">
            <Text className="text-2xl font-bold text-destructive mb-4">
              Oops! Etwas ist schiefgelaufen
            </Text>
            <Text className="text-base text-foreground mb-4">
              Die App hat einen unerwarteten Fehler festgestellt.
            </Text>
            
            {process.env.NODE_ENV === 'development' && (
              <ScrollView className="bg-surface border border-border rounded-lg p-3 mb-4 max-h-48">
                <Text className="text-xs text-muted font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <Text className="text-xs text-muted font-mono mt-2">
                    {this.state.error.stack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 px-6 items-center"
              onPress={this.resetError}
            >
              <Text className="text-background font-semibold text-base">
                Erneut versuchen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, resetError: () => void) => ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

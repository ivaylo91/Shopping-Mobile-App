/**
 * ErrorBoundary — catches JS errors in any child component tree.
 *
 * React error boundaries must be class components (React limitation).
 * Wrap the app root (or individual screens) to prevent full-app crashes.
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color="#e74c3c" />
          <Text style={styles.title}>Нещо се обърка</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'Възникна неочаквана грешка.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Опитай отново</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    padding: 40,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 8,
  },
  message: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2B7A5C',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#2B7A5C',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

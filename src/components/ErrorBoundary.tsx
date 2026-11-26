import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.retry);
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>{this.state.error.message}</Text>
          <Text style={styles.retry} onPress={this.retry}>
            Tap to retry
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, backgroundColor: '#0B0F19' },
  title: { color: '#F3F4F6', fontSize: 20, fontWeight: '700' },
  body: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  retry: { color: '#818CF8', fontSize: 16, fontWeight: '600', marginTop: 12 },
});

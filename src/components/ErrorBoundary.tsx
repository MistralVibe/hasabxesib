import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<Props & { fallback: (error: Error, retry: () => void) => React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.retry);
    return this.props.children;
  }
}

/** Root error boundary with localized fallback. */
export function ErrorBoundary({ children }: Props) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <ErrorBoundaryInner
      fallback={(error, retry) => (
        <View style={[styles.root, { backgroundColor: c.background }]}>
          <Text style={[styles.title, { color: c.text, fontSize: theme.type.heading }]}>{t('common.error')}</Text>
          <Text style={[styles.body, { color: c.textSecondary, fontSize: theme.type.body }]}>{error.message}</Text>
          <Text style={[styles.retry, { color: c.accent, fontSize: theme.type.body }]} onPress={retry}>
            {t('common.retry')}
          </Text>
        </View>
      )}
    >
      {children}
    </ErrorBoundaryInner>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontWeight: '700' },
  body: { textAlign: 'center' },
  retry: { fontWeight: '600', marginTop: 12 },
});

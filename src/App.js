import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import theme from './theme';

function AppContent() {
  const { account, isRestoringSession } = useAuth();

  if (isRestoringSession) {
    return <ActivityIndicator accessibilityLabel="Carregando sessão" size="large" />;
  }

  return <RootNavigator isAuthenticated={Boolean(account)} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

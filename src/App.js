import { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppPreferencesProvider, useAppPreferences } from './contexts/AppPreferencesContext';
import RootNavigator from './navigation/RootNavigator';
import { createTheme } from './theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const { account, isRestoringSession } = useAuth();
  const { isPreferencesLoading } = useAppPreferences();

  if (isRestoringSession || isPreferencesLoading) {
    return <ActivityIndicator accessibilityLabel="Carregando sessão" size="large" />;
  }

  return <RootNavigator accountId={account?.id} isAuthenticated={Boolean(account)} />;
}

function AppTheme({ children }) {
  const { fontScale } = useAppPreferences();
  const theme = useMemo(() => createTheme(fontScale), [fontScale]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator accessibilityLabel="Carregando fontes" size="large" />;
  }

  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <AppTheme>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AppTheme>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

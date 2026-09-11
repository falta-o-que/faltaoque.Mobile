import { ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
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
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

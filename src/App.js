import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';

import RootNavigator from './navigation/RootNavigator';
import theme from './theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <RootNavigator isAuthenticated={false} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

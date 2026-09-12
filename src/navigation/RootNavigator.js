import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import NfceReviewScreen from '../screens/NfceReviewScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { AUTHENTICATED_ROUTES, PUBLIC_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const publicScreenOptions = {
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: '#ffffff' },
  headerShown: false,
};

const authenticatedScreenOptions = {
  animation: 'fade',
  contentStyle: { backgroundColor: '#ffffff' },
  headerShown: false,
};

function PublicNavigator() {
  return (
    <Stack.Navigator initialRouteName={PUBLIC_ROUTES.LOGIN} screenOptions={publicScreenOptions}>
      <Stack.Screen name={PUBLIC_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={PUBLIC_ROUTES.REGISTER} component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={AUTHENTICATED_ROUTES.HOME}
      screenOptions={authenticatedScreenOptions}
    >
      <Stack.Screen name={AUTHENTICATED_ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.PANTRY} component={PantryScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.NFCE_REVIEW} component={NfceReviewScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator({ isAuthenticated }) {
  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedNavigator /> : <PublicNavigator />}
    </NavigationContainer>
  );
}

export default RootNavigator;

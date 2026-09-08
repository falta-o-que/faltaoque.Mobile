import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { AUTHENTICATED_ROUTES, PUBLIC_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const screenOptions = {
  animation: 'fade',
  contentStyle: { backgroundColor: '#ffffff' },
  headerShown: false,
};

function PublicNavigator() {
  return (
    <Stack.Navigator initialRouteName={PUBLIC_ROUTES.LOGIN} screenOptions={screenOptions}>
      <Stack.Screen name={PUBLIC_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={PUBLIC_ROUTES.REGISTER} component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedNavigator() {
  return (
    <Stack.Navigator initialRouteName={AUTHENTICATED_ROUTES.HOME} screenOptions={screenOptions}>
      <Stack.Screen name={AUTHENTICATED_ROUTES.HOME} component={HomeScreen} />
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

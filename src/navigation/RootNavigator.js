import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PantriesScreen from '../screens/PantriesScreen';
import PantryScreen from '../screens/PantryScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import GroceryPantryPickerScreen from '../screens/GroceryPantryPickerScreen';
import NfceReviewScreen from '../screens/NfceReviewScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { AUTHENTICATED_ROUTES, PUBLIC_ROUTES } from './routes';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const handledNotificationResponses = new Set();

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
      <Stack.Screen name={AUTHENTICATED_ROUTES.PANTRIES} component={PantriesScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.PANTRY} component={PantryScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.GROCERY_LIST} component={GroceryListScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER} component={GroceryPantryPickerScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.NFCE_REVIEW} component={NfceReviewScreen} />
      <Stack.Screen name={AUTHENTICATED_ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator({ accountId, isAuthenticated }) {
  const pendingResponse = useRef(null);
  const responseHandler = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      Notifications.dismissAllNotificationsAsync().catch(() => {});
      return undefined;
    }

    const handleResponse = (response) => {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const notification = response.notification;
      const data = notification.request.content.data;
      if (data?.accountId !== accountId || typeof data?.notificationId !== 'string') return;
      if (!navigationRef.isReady()) {
        pendingResponse.current = response;
        return;
      }
      const responseKey = `${notification.request.identifier}:${response.actionIdentifier}`;
      if (handledNotificationResponses.has(responseKey)) return;
      handledNotificationResponses.add(responseKey);
      navigationRef.navigate(AUTHENTICATED_ROUTES.NOTIFICATIONS, {
        notificationId: data.notificationId,
      });
      Notifications.clearLastNotificationResponse();
    };

    responseHandler.current = handleResponse;
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    return () => subscription.remove();
  }, [accountId, isAuthenticated]);

  const handleNavigationReady = useCallback(() => {
    if (!pendingResponse.current) return;
    const response = pendingResponse.current;
    pendingResponse.current = null;
    responseHandler.current?.(response);
  }, []);

  return (
    <NavigationContainer onReady={handleNavigationReady} ref={navigationRef}>
      {isAuthenticated ? <AuthenticatedNavigator /> : <PublicNavigator />}
    </NavigationContainer>
  );
}

export default RootNavigator;

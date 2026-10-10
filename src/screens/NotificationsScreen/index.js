import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import Navbar from '../../components/Navbar';
import NotificationDetailsModal from '../../components/NotificationDetailsModal';
import QuickActionButton from '../../components/QuickActionButton';
import {
  PantryIcon,
  SettingsIcon,
  SinoIcon,
  UserIcon,
} from '../../assets/icons/export';
import { useAuth } from '../../contexts/AuthContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import * as groceryListService from '../../services/groceryListService';
import {
  clearNotifications,
  listNotifications,
  markNotificationRead,
  recordNotificationAddedToList,
  syncDeviceNotifications,
} from '../../services/notificationService';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  Avatar,
  ClearAction,
  ClearButton,
  ClearText,
  Content,
  GradientBackground,
  Greeting,
  GreetingGroup,
  HeadingMarker,
  NotificationHeading,
  NotificationList,
  NotificationRow,
  NotificationSection,
  NotificationText,
  NotificationDot,
  PermissionHint,
  QuickActions,
  QuickSection,
  Question,
  RetryButton,
  RetryText,
  Screen,
  SectionTitle,
  StatusArea,
  StatusText,
  Subtitle,
} from './styles';

const QUICK_ACTIONS = [
  { key: 'pantry', label: 'Despensa', text: 'Despensa', icon: PantryIcon },
  { key: 'notifications', label: 'Notificações', text: 'Notif.', icon: SinoIcon },
  { key: 'profile', label: 'Perfil', text: 'Perfil', icon: UserIcon },
  { key: 'settings', label: 'Configurações', text: 'Config.', icon: SettingsIcon },
];

export default function NotificationsScreen({ navigation, route }) {
  const { account } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notificationsPermissionGranted, setNotificationsPermissionGranted] = useState(true);
  const notificationLoadInProgress = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    notificationLoadInProgress.current = true;
    setLoading(true);
    setError(null);
    setSelectedNotification(null);

    syncDeviceNotifications(account?.id, { requestPermission: true })
      .then(({ permissionGranted }) => {
        if (active) setNotificationsPermissionGranted(permissionGranted);
      })
      .catch(() => {
        if (active) setNotificationsPermissionGranted(false);
      });

    listNotifications(account?.id)
      .then((items) => {
        if (active) {
          notificationLoadInProgress.current = false;
          setNotifications(items);
        }
      })
      .catch(() => {
        if (active) {
          notificationLoadInProgress.current = false;
          setNotifications([]);
          setError('Não foi possível carregar as notificações.');
        }
      })
      .finally(() => {
        if (active) {
          notificationLoadInProgress.current = false;
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [account?.id, reloadKey]));

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      listNotifications(account?.id)
        .then(setNotifications)
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [account?.id]);

  const handleQuickAction = (key, label) => {
    if (key === 'pantry') {
      navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    } else if (key !== 'notifications') {
      Alert.alert('Em breve', `${label} estará disponível em breve.`);
    }
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else Alert.alert('Em breve', `${item.label} estará disponível em breve.`);
  };

  const handleOpenNotification = async (notification) => {
    const readNotification = { ...notification, isRead: true };
    setSelectedNotification(readNotification);
    setLists([]);
    setListsError(null);
    setListsLoading(notification.type === 'depleted' && !notification.handled);
    setNotifications((current) => current.map((item) => item.id === notification.id
      ? { ...item, isRead: true }
      : item));

    try {
      await markNotificationRead(account?.id, notification.id);
    } catch {
      showUserErrorAlert(null, {
        title: 'Não foi possível atualizar a notificação',
        fallback: 'Você ainda pode consultar os detalhes. Tente novamente mais tarde.',
      });
    }

    if (notification.type !== 'depleted' || notification.handled) return;
    try {
      const storedLists = await groceryListService.listGroceryLists(account?.id, notification.pantryId);
      setLists(storedLists.filter((list) => list.status === 'active'));
    } catch {
      setListsError('Não foi possível carregar as listas desta despensa.');
    } finally {
      setListsLoading(false);
    }
  };

  useEffect(() => {
    const notificationId = route?.params?.notificationId;
    if (!notificationId || loading || notificationLoadInProgress.current) return;
    const notification = notifications.find((item) => item.id === notificationId);
    if (notification) handleOpenNotification(notification);
    navigation.setParams({ notificationId: undefined });
  }, [route?.params?.notificationId, loading, notifications, navigation]);

  const handleClearNotifications = async () => {
    if (isClearing || notifications.length === 0) return;
    setIsClearing(true);
    try {
      const result = await clearNotifications(account?.id);
      setNotifications([]);
      setSelectedNotification(null);
      if (!result.deviceCleared) {
        showUserErrorAlert(null, {
          title: 'Notificações removidas da lista',
          fallback: 'O aparelho não conseguiu limpar todas as notificações da barra.',
        });
      }
    } catch (clearError) {
      showUserErrorAlert(clearError, {
        title: 'Não foi possível limpar as notificações',
        fallback: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const requestClearNotifications = () => {
    if (isClearing || notifications.length === 0) return;
    Alert.alert(
      'Limpar notificações?',
      'Os avisos atuais serão removidos desta lista e da barra do aparelho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: handleClearNotifications },
      ],
      { cancelable: true },
    );
  };

  const handleAddToList = async (list) => {
    if (!selectedNotification || isSaving) return;
    setIsSaving(true);
    const notification = selectedNotification;
    const product = notification.product;
    try {
      await groceryListService.addGroceryItem({
        accountId: account?.id,
        pantryId: notification.pantryId,
        listId: list.id,
        name: product.baseName || product.name,
        category: product.category || 'outros',
        quantity: 1,
        weight: product.weight,
        unit: product.unit,
      });

      const handledNotification = {
        ...notification,
        isRead: true,
        handled: { action: 'added-to-list', listId: list.id, listName: list.name },
      };
      setSelectedNotification(handledNotification);
      setNotifications((current) => current.map((item) => item.id === notification.id
        ? handledNotification
        : item));
      try {
        await recordNotificationAddedToList(account?.id, notification.id, list);
      } catch {
        showUserErrorAlert(null, {
          title: 'Produto adicionado à lista',
          fallback: 'A notificação não pôde ser atualizada neste dispositivo.',
        });
      }
    } catch (saveError) {
      showUserErrorAlert(saveError, {
        title: 'Não foi possível adicionar o produto',
        fallback: 'A lista não foi alterada. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPantry = () => {
    const pantryId = selectedNotification?.pantryId;
    setSelectedNotification(null);
    if (pantryId) navigation.navigate(AUTHENTICATED_ROUTES.PANTRY, { pantryId });
  };

  const handleCreateList = () => {
    const pantryId = selectedNotification?.pantryId;
    setSelectedNotification(null);
    if (pantryId) navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_LIST, { pantryId });
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GradientBackground />
      <Content>
        <GreetingGroup>
          <Avatar $color={account?.avatarColor} />
          <Greeting>Oi, {account?.name ?? 'pessoa viva'}</Greeting>
          <Subtitle>Sua casa está no ritmo.</Subtitle>
        </GreetingGroup>

        <QuickSection>
          <Question>O que você quer fazer?</Question>
          <QuickActions>
            {QUICK_ACTIONS.map(({ icon, key, label, text }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={label}
                onPress={() => handleQuickAction(key, label)}
                selected={key === 'notifications'}
                showBadge={key === 'notifications' && notifications.some((item) => !item.isRead)}
                text={text}
              />
            ))}
          </QuickActions>
        </QuickSection>

        <NotificationSection>
          <NotificationHeading>
            <HeadingMarker $color={account?.avatarColor} />
            <SectionTitle accessibilityRole="header">Notificações</SectionTitle>
          </NotificationHeading>

          {!notificationsPermissionGranted && !loading ? (
            <PermissionHint>Ative as notificações do FaltaOquê nas configurações do aparelho para receber avisos na barra.</PermissionHint>
          ) : null}

          {!loading && !error && notifications.length > 0 ? (
            <ClearAction>
              <ClearButton accessibilityRole="button" disabled={isClearing} onPress={requestClearNotifications}>
                <ClearText>{isClearing ? 'Limpando...' : 'Limpar notificações'}</ClearText>
              </ClearButton>
            </ClearAction>
          ) : null}

          {loading ? (
            <StatusArea>
              <ActivityIndicator accessibilityLabel="Carregando notificações" color="#00DD00" />
            </StatusArea>
          ) : error ? (
            <StatusArea>
              <StatusText $error accessibilityRole="alert">{error}</StatusText>
              <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
                <RetryText>Tentar novamente</RetryText>
              </RetryButton>
            </StatusArea>
          ) : notifications.length === 0 ? (
            <StatusArea>
              <StatusText>Tudo em dia. Nenhuma notificação, por enquanto.</StatusText>
            </StatusArea>
          ) : (
            <NotificationList>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  accessibilityLabel={notification.title}
                  accessibilityHint={`${notification.isRead ? 'Lida' : 'Não lida'}. Toque para ver os detalhes.`}
                  accessibilityRole="button"
                  onPress={() => handleOpenNotification(notification)}
                >
                  {!notification.isRead ? <NotificationDot /> : null}
                  <NotificationText>{notification.title}</NotificationText>
                </NotificationRow>
              ))}
            </NotificationList>
          )}
        </NotificationSection>
      </Content>

      <NotificationDetailsModal
        busy={isSaving}
        lists={lists}
        listsError={listsError}
        listsLoading={listsLoading}
        notification={selectedNotification}
        onAddToList={handleAddToList}
        onClose={() => setSelectedNotification(null)}
        onCreateList={handleCreateList}
        onOpenPantry={handleOpenPantry}
        visible={Boolean(selectedNotification)}
      />
      <Navbar activeItem="profile" onItemChange={handleNavbar} />
    </Screen>
  );
}

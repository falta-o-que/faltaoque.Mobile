import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';

import Navbar from '../../components/Navbar';
import CreatePantryModal, { PantryFormModal } from '../../components/CreatePantryModal';
import PantryCard from '../../components/PantryCard';
import PantryDestinationModal from '../../components/PantryDestinationModal';
import QuickActionButton from '../../components/QuickActionButton';
import NotificationsScreen from '../NotificationsScreen';
import ProfileScreen from '../ProfileScreen';
import SettingsScreen from '../SettingsScreen';
import {
  AddCircleIcon,
  PantryIcon,
  SettingsIcon,
  SinoIcon,
  UserIcon,
} from '../../assets/icons/export';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { showUserErrorAlert } from '../../utils/userErrors';
import * as pantryService from '../../services/pantryService';
import { listNotifications, syncDeviceNotifications } from '../../services/notificationService';
import {
  Avatar,
  Content,
  CreateAction,
  EmptyText,
  Greeting,
  LoadError,
  RetryButton,
  RetryText,
  PantryList,
  PantryTitle,
  Question,
  QuickActions,
  Screen,
  PantrySection,
  Section,
  Subtitle,
} from './styles';

export function HomeScreen({ navigation }) {
  const { account } = useAuth();
  const { t } = useAppPreferences();
  const quickActions = [
    { key: 'pantry', label: t('home.action.pantry'), text: t('home.action.pantry'), icon: PantryIcon },
    { key: 'notifications', label: t('home.action.notifications'), text: t('home.action.notificationsShort'), icon: SinoIcon },
    { key: 'profile', label: t('home.action.profile'), text: t('home.action.profile'), icon: UserIcon },
    { key: 'settings', label: t('home.action.settings'), text: t('home.action.settingsShort'), icon: SettingsIcon },
  ];
  const [selectedAction, setSelectedAction] = useState('pantry');
  const [isCreatePantryModalOpen, setIsCreatePantryModalOpen] = useState(false);
  const [selectedPantry, setSelectedPantry] = useState(null);
  const [pantryForEdit, setPantryForEdit] = useState(null);
  const [isSavingPantry, setIsSavingPantry] = useState(false);
  const [pantries, setPantries] = useState([]);
  const [pantriesError, setPantriesError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const requestedNotificationPermission = useRef(false);

  useFocusEffect(useCallback(() => {
    let isMounted = true;
    const shouldRequestNotificationPermission = !requestedNotificationPermission.current;
    requestedNotificationPermission.current = true;

    pantryService
      .listPantries(account?.id)
      .then((storedPantries) => {
        if (isMounted) {
          setPantries(storedPantries);
          setPantriesError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPantries([]);
          setPantriesError(t('home.loadPantriesError'));
        }
      });

    syncDeviceNotifications(account?.id, shouldRequestNotificationPermission
      ? { requestPermission: true }
      : undefined)
      .then(({ unreadCount }) => {
        if (isMounted) setUnreadNotificationCount(unreadCount);
      })
      .catch(() => listNotifications(account?.id)
        .then((items) => {
          if (isMounted) setUnreadNotificationCount(items.filter((item) => !item.isRead).length);
        })
        .catch(() => {}));

    return () => {
      isMounted = false;
    };
  }, [account?.id, reloadKey, t]));

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      syncDeviceNotifications(account?.id)
        .then(({ unreadCount }) => setUnreadNotificationCount(unreadCount))
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [account?.id]);

  const handleActionPress = (key) => {
    setSelectedAction(key);
  };

  const handleUnreadCountChange = useCallback((count) => {
    setUnreadNotificationCount(count);
  }, []);

  const handleNavbarItemChange = (key, item) => {
    if (key === 'shopping-list') {
      navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    } else if (key === 'pantry') {
      navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    } else if (key !== 'profile') {
      Alert.alert(t('common.comingSoon'), t('common.comingSoonMessage', { feature: item.label }), [{ text: t('common.ok') }]);
    }
  };

  const handlePantrySettingsPress = (pantry) => {
    setPantryForEdit(pantry);
  };

  const handlePantryPress = (pantry) => {
    setSelectedPantry(pantry);
  };

  const handleOpenPantry = () => {
    const pantryId = selectedPantry?.id;
    setSelectedPantry(null);

    if (pantryId) {
      navigation.navigate(AUTHENTICATED_ROUTES.PANTRY, { pantryId });
    }
  };

  const handleOpenShoppingList = () => {
    const pantryId = selectedPantry?.id;
    setSelectedPantry(null);
    if (pantryId) {
      navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_LIST, { pantryId });
    }
  };

  const handleCreatePantryPress = () => {
    setIsCreatePantryModalOpen(true);
  };

  const handleCreatePantry = async ({ color, name, location, locationName }) => {
    try {
      const pantry = await pantryService.createPantry({
        accountId: account?.id,
        color,
        location,
        locationName,
        name,
      });

      setPantries((currentPantries) => [...currentPantries, pantry]);
      setPantriesError(null);
      setIsCreatePantryModalOpen(false);
    } catch (error) {
      showUserErrorAlert(error, { title: t('home.createPantryError'), fallback: t('home.createPantryFallback'), dismissText: t('common.ok'), t });
    }
  };

  const handleSavePantry = async (changes) => {
    if (isSavingPantry) return;
    setIsSavingPantry(true);
    try {
      const updated = await pantryService.updatePantry({
        accountId: account?.id,
        pantryId: pantryForEdit?.id,
        ...changes,
      });
      setPantries((current) => current.map((pantry) => pantry.id === updated.id ? updated : pantry));
      await syncDeviceNotifications(account?.id).catch(() => {});
      setPantryForEdit(null);
    } catch (error) {
      showUserErrorAlert(error, { title: t('home.savePantryError'), fallback: t('home.savePantryFallback'), dismissText: t('common.ok'), t });
    } finally {
      setIsSavingPantry(false);
    }
  };

  const handleDeletePantry = () => {
    const pantry = pantryForEdit;
    if (!pantry || isSavingPantry) return;
    Alert.alert(t('home.deletePantryTitle'), t('home.deletePantryMessage', { name: pantry.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('home.delete'), style: 'destructive', onPress: async () => {
        setIsSavingPantry(true);
        try {
          await pantryService.deletePantry({ accountId: account?.id, pantryId: pantry.id });
          setPantries((current) => current.filter((item) => item.id !== pantry.id));
          await syncDeviceNotifications(account?.id).catch(() => {});
          setSelectedPantry((current) => current?.id === pantry.id ? null : current);
          setPantryForEdit(null);
        } catch (error) {
          showUserErrorAlert(error, { title: t('home.deletePantryError'), fallback: t('home.deletePantryFallback'), dismissText: t('common.ok'), t });
        } finally {
          setIsSavingPantry(false);
        }
      } },
    ]);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Avatar $color={account?.avatarColor} />
        <Greeting>{account?.name ? t('home.greeting', { name: account.name }) : t('home.greetingFallback')}</Greeting>
        <Subtitle>{t('home.subtitle')}</Subtitle>
        <Section>
          <Question>{t('home.question')}</Question>
          <QuickActions>
            {quickActions.map(({ icon, key, label, text }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={label}
                onPress={() => handleActionPress(key)}
                selected={selectedAction === key}
                showBadge={key === 'notifications' && unreadNotificationCount > 0}
                text={text}
              />
            ))}
          </QuickActions>
        </Section>
        {selectedAction === 'pantry' ? (
          <PantrySection>
            <PantryTitle>{t('home.pantries')}</PantryTitle>
            {pantriesError ? (
              <>
                <LoadError accessibilityLiveRegion="polite" accessibilityRole="alert">{pantriesError}</LoadError>
                <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
                  <RetryText>{t('common.retry')}</RetryText>
                </RetryButton>
              </>
            ) : null}
            {pantries.length === 0 && !pantriesError ? (
              <EmptyText>{t('home.noPantries')}</EmptyText>
            ) : null}
            {pantries.length > 0 ? (
              <PantryList>
                {pantries.map((pantry) => (
                  <PantryCard
                    key={pantry.id}
                    color={pantry.color}
                    name={pantry.name}
                    productCount={pantry.productCount}
                    shoppingListCount={pantry.shoppingListCount}
                    onPress={() => handlePantryPress(pantry)}
                    onSettingsPress={() => handlePantrySettingsPress(pantry)}
                  />
                ))}
              </PantryList>
            ) : null}
            <CreateAction>
              <QuickActionButton
                Icon={AddCircleIcon}
                accessibilityLabel={t('home.createPantry')}
                onPress={handleCreatePantryPress}
                text={t('home.create')}
              />
            </CreateAction>
          </PantrySection>
        ) : null}
        {selectedAction === 'notifications' ? (
          <NotificationsScreen
            embedded
            navigation={navigation}
            onUnreadCountChange={handleUnreadCountChange}
          />
        ) : null}
        {selectedAction === 'profile' ? (
          <ProfileScreen embedded navigation={navigation} />
        ) : null}
        {selectedAction === 'settings' ? <SettingsScreen embedded /> : null}
      </Content>
      <CreatePantryModal
        onCreate={handleCreatePantry}
        onRequestClose={() => setIsCreatePantryModalOpen(false)}
        visible={isCreatePantryModalOpen}
      />
      <PantryFormModal
        busy={isSavingPantry}
        onDelete={handleDeletePantry}
        onRequestClose={() => setPantryForEdit(null)}
        onSave={handleSavePantry}
        pantry={pantryForEdit}
        visible={Boolean(pantryForEdit)}
      />
      <PantryDestinationModal
        onOpenPantry={handleOpenPantry}
        onOpenShoppingList={handleOpenShoppingList}
        onRequestClose={() => setSelectedPantry(null)}
        pantryName={selectedPantry?.name}
        visible={Boolean(selectedPantry)}
      />
      <Navbar activeItem="profile" onItemChange={handleNavbarItemChange} />
    </Screen>
  );
}

export default HomeScreen;

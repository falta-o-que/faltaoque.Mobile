import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';

import Navbar from '../../components/Navbar';
import CreatePantryModal, { PantryFormModal } from '../../components/CreatePantryModal';
import PantryCard from '../../components/PantryCard';
import PantryDestinationModal from '../../components/PantryDestinationModal';
import QuickActionButton from '../../components/QuickActionButton';
import {
  AddCircleIcon,
  PantryIcon,
  SettingsIcon,
  SinoIcon,
  UserIcon,
} from '../../assets/icons/export';
import { useAuth } from '../../contexts/AuthContext';
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

const QUICK_ACTIONS = [
  { key: 'pantry', label: 'Despensa', text: 'Despensa', icon: PantryIcon },
  { key: 'notifications', label: 'Notificações', text: 'Notif.', icon: SinoIcon },
  { key: 'profile', label: 'Perfil', text: 'Perfil', icon: UserIcon },
  { key: 'settings', label: 'Configurações', text: 'Config.', icon: SettingsIcon },
];

const showComingSoon = (feature) => {
  Alert.alert('Em breve', `${feature} estará disponível em breve.`);
};

export function HomeScreen({ navigation }) {
  const { account } = useAuth();
  const [selectedAction, setSelectedAction] = useState('pantry');
  const [isCreatePantryModalOpen, setIsCreatePantryModalOpen] = useState(false);
  const [selectedPantry, setSelectedPantry] = useState(null);
  const [pantryForEdit, setPantryForEdit] = useState(null);
  const [isSavingPantry, setIsSavingPantry] = useState(false);
  const [pantries, setPantries] = useState([]);
  const [pantriesError, setPantriesError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let isMounted = true;

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
          setPantriesError('Não foi possível carregar suas despensas.');
        }
      });

    syncDeviceNotifications(account?.id)
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
  }, [account?.id, reloadKey]));

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      syncDeviceNotifications(account?.id)
        .then(({ unreadCount }) => setUnreadNotificationCount(unreadCount))
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [account?.id]);

  const handleActionPress = (key, label) => {
    if (key === 'pantry') {
      setSelectedAction(key);
      return;
    }

    if (key === 'notifications') {
      navigation.navigate(AUTHENTICATED_ROUTES.NOTIFICATIONS);
      return;
    }

    showComingSoon(label);
  };

  const handleNavbarItemChange = (key, item) => {
    if (key === 'shopping-list') {
      navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    } else if (key === 'pantry') {
      navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    } else if (key !== 'profile') {
      showComingSoon(item.label);
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
      showUserErrorAlert(error, { title: 'Não foi possível criar a despensa', fallback: 'Os dados preenchidos foram mantidos. Tente novamente em alguns instantes.' });
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
      showUserErrorAlert(error, { title: 'Não foi possível salvar a despensa', fallback: 'Confira os dados e tente novamente.' });
    } finally {
      setIsSavingPantry(false);
    }
  };

  const handleDeletePantry = () => {
    const pantry = pantryForEdit;
    if (!pantry || isSavingPantry) return;
    Alert.alert('Excluir despensa?', `A despensa “${pantry.name}”, seus produtos, compras e listas serão removidos deste dispositivo. Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        setIsSavingPantry(true);
        try {
          await pantryService.deletePantry({ accountId: account?.id, pantryId: pantry.id });
          setPantries((current) => current.filter((item) => item.id !== pantry.id));
          await syncDeviceNotifications(account?.id).catch(() => {});
          setSelectedPantry((current) => current?.id === pantry.id ? null : current);
          setPantryForEdit(null);
        } catch (error) {
          showUserErrorAlert(error, { title: 'Não foi possível excluir a despensa', fallback: 'Tente novamente em alguns instantes.' });
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
        <Greeting>Oi, {account?.name ?? 'pessoa viva'}</Greeting>
        <Subtitle>Sua casa está no ritmo.</Subtitle>
        <Section>
          <Question>O que você quer fazer?</Question>
          <QuickActions>
            {QUICK_ACTIONS.map(({ icon, key, label, text }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={label}
                onPress={() => handleActionPress(key, label)}
                selected={selectedAction === key}
                showBadge={key === 'notifications' && unreadNotificationCount > 0}
                text={text}
              />
            ))}
          </QuickActions>
        </Section>
        {selectedAction === 'pantry' ? (
          <PantrySection>
            <PantryTitle>Suas despensas</PantryTitle>
            {pantriesError ? (
              <>
                <LoadError accessibilityLiveRegion="polite" accessibilityRole="alert">{pantriesError}</LoadError>
                <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
                  <RetryText>Tentar novamente</RetryText>
                </RetryButton>
              </>
            ) : null}
            {pantries.length === 0 && !pantriesError ? (
              <EmptyText>Você ainda não possui despensas...</EmptyText>
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
                accessibilityLabel="Criar despensa"
                onPress={handleCreatePantryPress}
                text="Criar"
              />
            </CreateAction>
          </PantrySection>
        ) : null}
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

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';

import Navbar from '../../components/Navbar';
import CreatePantryModal from '../../components/CreatePantryModal';
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
import * as pantryService from '../../services/pantryService';
import {
  Avatar,
  Content,
  CreateAction,
  EmptyText,
  Greeting,
  LoadError,
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
  const [pantries, setPantries] = useState([]);
  const [pantriesError, setPantriesError] = useState(null);

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

    return () => {
      isMounted = false;
    };
  }, [account?.id]));

  const handleActionPress = (key, label) => {
    if (key === 'pantry') {
      setSelectedAction(key);
      return;
    }

    showComingSoon(label);
  };

  const handleNavbarItemChange = (key, item) => {
    if (key !== 'profile') {
      showComingSoon(item.label);
    }
  };

  const handlePantrySettingsPress = (pantryName) => {
    showComingSoon(`A configuração de ${pantryName}`);
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
    setSelectedPantry(null);
    showComingSoon('A lista de compras desta despensa');
  };

  const handleCreatePantryPress = () => {
    setIsCreatePantryModalOpen(true);
  };

  const handleCreatePantry = async ({ color, name }) => {
    try {
      const pantry = await pantryService.createPantry({
        accountId: account?.id,
        color,
        name,
      });

      setPantries((currentPantries) => [...currentPantries, pantry]);
      setPantriesError(null);
      setIsCreatePantryModalOpen(false);
    } catch (error) {
      Alert.alert(
        'Não foi possível criar a despensa',
        'Tente novamente em alguns instantes.',
      );
    }
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
                text={text}
              />
            ))}
          </QuickActions>
        </Section>
        {selectedAction === 'pantry' ? (
          <PantrySection>
            <PantryTitle>Suas despensas</PantryTitle>
            {pantriesError ? <LoadError>{pantriesError}</LoadError> : null}
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
                    onPress={() => handlePantryPress(pantry)}
                    onSettingsPress={() => handlePantrySettingsPress(pantry.name)}
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

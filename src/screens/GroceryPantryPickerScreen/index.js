import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ShoppingListIcon } from '../../assets/icons/export';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listPantries } from '../../services/pantryService';
import {
  Card, ColorCircle, Content, EmptyText, Header, List, PantryName,
  RetryButton, RetryText, Screen, StatusText, Subtitle, Title,
} from './styles';

export default function GroceryPantryPickerScreen({ navigation }) {
  const { account } = useAuth();
  const [pantries, setPantries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    listPantries(account?.id)
      .then((items) => { if (active) { setPantries(items); setError(null); } })
      .catch(() => { if (active) setError('Não foi possível carregar suas despensas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account?.id, reloadKey]));

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    else if (key !== 'shopping-list') Alert.alert('Em breve', `${item.label} estará disponível em breve.`);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Header><ShoppingListIcon size={28} color="#00DD00" /><Title>Lista de compras</Title></Header>
        <Subtitle>Escolha a despensa para abrir suas listas de compras.</Subtitle>
        {loading ? <ActivityIndicator accessibilityLabel="Carregando despensas" /> : error ? (
          <>
            <StatusText accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</StatusText>
            <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
              <RetryText>Tentar novamente</RetryText>
            </RetryButton>
          </>
        ) : pantries.length === 0 ? (
          <EmptyText>Você ainda não possui despensas. Crie uma na página inicial.</EmptyText>
        ) : (
          <List>
            {pantries.map((pantry) => (
              <Card key={pantry.id} accessibilityRole="button" accessibilityLabel={`Abrir listas da despensa ${pantry.name}`} onPress={() => navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_LIST, { pantryId: pantry.id })}>
                <ColorCircle $color={pantry.color} />
                <PantryName numberOfLines={1} ellipsizeMode="tail">{pantry.name}</PantryName>
              </Card>
            ))}
          </List>
        )}
      </Content>
      <Navbar activeItem="shopping-list" onItemChange={handleNavbar} />
    </Screen>
  );
}

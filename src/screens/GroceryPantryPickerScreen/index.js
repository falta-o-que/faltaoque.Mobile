import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ShoppingListIcon } from '../../assets/icons/export';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listPantries } from '../../services/pantryService';
import {
  Card, ColorCircle, Content, EmptyText, Header, List, PantryName,
  RetryButton, RetryText, Screen, StatusText, Subtitle, Title,
} from './styles';

export default function GroceryPantryPickerScreen({ navigation }) {
  const { account } = useAuth();
  const { t } = useAppPreferences();
  const [pantries, setPantries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    listPantries(account?.id)
      .then((items) => { if (active) { setPantries(items); setError(null); } })
      .catch(() => { if (active) setError(t('shopping.loadPantriesError')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account?.id, reloadKey]));

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    else if (key !== 'shopping-list') Alert.alert(t('shopping.upcoming'), t('shopping.availableSoon', { label: item.label }), [{ text: t('common.ok') }]);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Header><ShoppingListIcon size={28} color="#00DD00" /><Title>{t('shopping.title')}</Title></Header>
        <Subtitle>{t('shopping.choosePantry')}</Subtitle>
        {loading ? <ActivityIndicator accessibilityLabel={t('shopping.loadingPantries')} /> : error ? (
          <>
            <StatusText accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</StatusText>
            <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
              <RetryText>{t('shopping.retry')}</RetryText>
            </RetryButton>
          </>
        ) : pantries.length === 0 ? (
          <EmptyText>{t('shopping.noPantries')}</EmptyText>
        ) : (
          <List>
            {pantries.map((pantry) => (
              <Card key={pantry.id} accessibilityRole="button" accessibilityLabel={t('shopping.openPantryLists', { name: pantry.name })} onPress={() => navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_LIST, { pantryId: pantry.id })}>
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

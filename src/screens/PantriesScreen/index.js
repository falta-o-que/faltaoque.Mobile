import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Navbar from '../../components/Navbar';
import { PantryFormModal } from '../../components/CreatePantryModal';
import PantryCard from '../../components/PantryCard';
import PantryDestinationModal from '../../components/PantryDestinationModal';
import SearchField from '../../components/SearchField';
import { useAuth } from '../../contexts/AuthContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import * as pantryService from '../../services/pantryService';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  Avatar,
  Content,
  EmptyText,
  GradientBackground,
  Header,
  LoadError,
  PantryList,
  PantrySection,
  PantryTitle,
  RetryButton,
  RetryText,
  SearchArea,
  Screen,
  TitleRow,
} from './styles';

const normalizeSearchText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const showComingSoon = (feature) => {
  Alert.alert('Em breve', `${feature} estará disponível em breve.`);
};

export default function PantriesScreen({ navigation }) {
  const { account } = useAuth();
  const [pantries, setPantries] = useState([]);
  const [pantriesError, setPantriesError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPantry, setSelectedPantry] = useState(null);
  const [pantryForEdit, setPantryForEdit] = useState(null);
  const [isSavingPantry, setIsSavingPantry] = useState(false);

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
  }, [account?.id, reloadKey]));

  const filteredPantries = searchQuery.trim()
    ? pantries.filter((pantry) => normalizeSearchText(pantry.name).includes(normalizeSearchText(searchQuery)))
    : pantries;

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

  const handleOpenPantry = () => {
    const pantryId = selectedPantry?.id;
    setSelectedPantry(null);
    if (pantryId) navigation.navigate(AUTHENTICATED_ROUTES.PANTRY, { pantryId });
  };

  const handleOpenShoppingList = () => {
    const pantryId = selectedPantry?.id;
    setSelectedPantry(null);
    if (pantryId) navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_LIST, { pantryId });
  };

  const handleNavbarItemChange = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else if (key !== 'pantry') showComingSoon(item.label);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <GradientBackground />
      <Content>
        <Header>
          <TitleRow>
            <Avatar $color={account?.avatarColor} />
            <PantryTitle>Despensas</PantryTitle>
          </TitleRow>
          <SearchArea>
            <SearchField
              accessibilityLabel="Pesquisar despensas"
              onChangeText={setSearchQuery}
              placeholder="Pesquisa"
              value={searchQuery}
            />
          </SearchArea>
        </Header>
        <PantrySection>
          {pantriesError ? (
            <>
              <LoadError accessibilityLiveRegion="polite" accessibilityRole="alert">{pantriesError}</LoadError>
              <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
                <RetryText>Tentar novamente</RetryText>
              </RetryButton>
            </>
          ) : null}
          {filteredPantries.length === 0 && !pantriesError ? (
            <EmptyText>
              {pantries.length === 0 ? 'Você ainda não possui despensas...' : 'Nenhuma despensa encontrada.'}
            </EmptyText>
          ) : null}
          {filteredPantries.length > 0 ? (
            <PantryList>
              {filteredPantries.map((pantry) => (
                <PantryCard
                  key={pantry.id}
                  color={pantry.color}
                  name={pantry.name}
                  productCount={pantry.productCount}
                  shoppingListCount={pantry.shoppingListCount}
                  onPress={() => setSelectedPantry(pantry)}
                  onSettingsPress={() => setPantryForEdit(pantry)}
                />
              ))}
            </PantryList>
          ) : null}
        </PantrySection>
      </Content>
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
      <Navbar activeItem="pantry" onItemChange={handleNavbarItemChange} />
    </Screen>
  );
}

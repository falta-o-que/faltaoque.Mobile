import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Navbar from '../../components/Navbar';
import { PantryFormModal } from '../../components/CreatePantryModal';
import PantryCard from '../../components/PantryCard';
import PantryDestinationModal from '../../components/PantryDestinationModal';
import SearchField from '../../components/SearchField';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
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

export default function PantriesScreen({ navigation }) {
  const { account } = useAuth();
  const { t } = useAppPreferences();
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
          setPantriesError(t('pantries.loadError'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [account?.id, reloadKey, t]));

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
      showUserErrorAlert(error, { title: t('pantries.saveErrorTitle'), fallback: t('pantries.saveError'), dismissText: t('common.ok'), t });
    } finally {
      setIsSavingPantry(false);
    }
  };

  const handleDeletePantry = () => {
    const pantry = pantryForEdit;
    if (!pantry || isSavingPantry) return;
    Alert.alert(t('pantries.deleteTitle'), t('pantries.deleteMessage', { name: pantry.name }), [
      { text: t('pantries.cancel'), style: 'cancel' },
      { text: t('pantries.delete'), style: 'destructive', onPress: async () => {
        setIsSavingPantry(true);
        try {
          await pantryService.deletePantry({ accountId: account?.id, pantryId: pantry.id });
          setPantries((current) => current.filter((item) => item.id !== pantry.id));
          setSelectedPantry((current) => current?.id === pantry.id ? null : current);
          setPantryForEdit(null);
        } catch (error) {
          showUserErrorAlert(error, { title: t('pantries.deleteErrorTitle'), fallback: t('pantries.deleteError'), dismissText: t('common.ok'), t });
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
    else if (key !== 'pantry') Alert.alert(t('pantries.comingSoon'), t('pantries.comingSoonMessage', { feature: item.label }), [{ text: t('common.ok') }]);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <GradientBackground />
      <Content>
        <Header>
          <TitleRow>
            <Avatar $color={account?.avatarColor} />
            <PantryTitle>{t('pantries.title')}</PantryTitle>
          </TitleRow>
          <SearchArea>
            <SearchField
              accessibilityLabel={t('pantries.searchA11y')}
              onChangeText={setSearchQuery}
              placeholder={t('pantries.search')}
              value={searchQuery}
            />
          </SearchArea>
        </Header>
        <PantrySection>
          {pantriesError ? (
            <>
              <LoadError accessibilityLiveRegion="polite" accessibilityRole="alert">{pantriesError}</LoadError>
              <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
              <RetryText>{t('pantries.retry')}</RetryText>
              </RetryButton>
            </>
          ) : null}
          {filteredPantries.length === 0 && !pantriesError ? (
            <EmptyText>
              {pantries.length === 0 ? t('pantries.empty') : t('pantries.noneFound')}
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  AddCircleIcon, AngleIcon, CartAddIcon, CartRemoveIcon, FilterIcon, HistoryIcon, SettingsIcon,
} from '../../assets/icons/export';
import CategoryTag from '../../components/CategoryTag';
import AnimatedDropdown from '../../components/AnimatedDropdown';
import GroceryListItemCard from '../../components/GroceryListItemCard';
import GroceryListHistoryModal from '../../components/GroceryListHistoryModal';
import GroceryListModal from '../../components/GroceryListModal';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { showUserErrorAlert } from '../../utils/userErrors';
import { PRODUCT_CATEGORIES } from '../../domain/productValidation';
import { GROCERY_SUGGESTION_OPTIONS, GROCERY_SUGGESTION_TYPES } from '../../domain/grocerySuggestionOptions';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import * as groceryListService from '../../services/groceryListService';
import { getGroceryMarketSuggestions } from '../../services/groceryMarketSuggestionService';
import { finishListAndStock } from '../../services/groceryCheckoutService';
import { getCollapsedGroceryListIds, saveCollapsedGroceryListIds } from '../../services/groceryListViewPreferenceService';
import { listPantries } from '../../services/pantryService';
import {
  CategoryScroll, Chevron, ColorCircle, Content, EmptyText, Header, HeaderActions,
  EstimateBox, EstimateCopy, EstimateDetail, EstimateAmount, EstimateMissingAction, EstimateMissingText, EstimatePrice, EstimatePriceLabel, EstimateTitle,
  EstimateSuggestionOptions, EstimateSuggestionOption, EstimateSuggestionOptionTitle, EstimateSuggestionOptionDetail,
  EstimateDisclaimer, EstimateDisclaimerText,
  IconButton, ItemStack, ListActions, ListHeading, ListName, ListScroll, ListSection,
  PantryIndicator, RetryButton, RetryText, RoundButton, Screen, SelectionBar, SelectionButton,
  SelectionButtonText, SelectionHint, StatusText, Title, TitleBlock, TitleRow,
} from './styles';

function ListChevron({ expanded }) {
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const style = { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '0deg'] }) }] };
  return <Chevron style={style}><AngleIcon width={21} height={13} color="#303030" /></Chevron>;
}

function formatEstimatedPrice(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function formatMarketLocation(market) {
  if (!market) return '';
  return market.local_name || 'Mercado não identificado';
}

export default function GroceryListScreen({ navigation, route }) {
  const { account } = useAuth();
  const pantryId = route.params?.pantryId;
  const [pantry, setPantry] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [removalListId, setRemovalListId] = useState(null);
  const [removalItemIds, setRemovalItemIds] = useState([]);
  const [sortOption, setSortOption] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const collapsedIdsRef = useRef([]);
  const collapsedSaveQueueRef = useRef(Promise.resolve());
  const [busy, setBusy] = useState(false);
  const [suggestionPanelListId, setSuggestionPanelListId] = useState(null);
  const [suggestionOptionsByList, setSuggestionOptionsByList] = useState({});
  const [selectedSuggestionByList, setSelectedSuggestionByList] = useState({});
  const [loadingSuggestionListId, setLoadingSuggestionListId] = useState(null);

  const refresh = useCallback(async () => {
    const [pantries, storedLists] = await Promise.all([
      listPantries(account?.id),
      groceryListService.listGroceryLists(account?.id, pantryId),
    ]);
    const found = pantries.find((entry) => entry.id === pantryId);
    if (!found) throw new Error('Esta despensa não está disponível para sua conta.');
    setPantry(found);
    setLists(storedLists);
    setSuggestionPanelListId(null);
    setSuggestionOptionsByList({});
    setSelectedSuggestionByList({});
    setLoadingSuggestionListId(null);
  }, [account?.id, pantryId]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setPantry(null);
    setSuggestionPanelListId(null);
    setSuggestionOptionsByList({});
    setSelectedSuggestionByList({});
    setLoadingSuggestionListId(null);
    (async () => {
      return Promise.all([
        listPantries(account?.id),
        groceryListService.listGroceryLists(account?.id, pantryId),
        getCollapsedGroceryListIds(account?.id, pantryId),
      ]);
    })()
      .then(([pantries, storedLists, storedCollapsedIds]) => {
        if (!active) return;
        const found = pantries.find((entry) => entry.id === pantryId);
        const activeListIds = new Set(storedLists.filter((list) => list.status === 'active').map((list) => list.id));
        const validCollapsedIds = storedCollapsedIds.filter((id) => activeListIds.has(id));
        collapsedIdsRef.current = validCollapsedIds;
        setCollapsedIds(validCollapsedIds);
        setPantry(found ?? null);
        setLists(storedLists);
        setError(found ? null : 'Esta despensa não está disponível para sua conta.');
      })
      .catch((loadError) => {
        console.error('[GroceryListScreen] Falha ao carregar listas:', loadError);
        if (active) { setPantry(null); setError('Não foi possível carregar as listas desta despensa.'); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account?.id, pantryId]));

  const activeList = lists.find((list) => list.id === activeListId) ?? null;
  const visibleLists = useMemo(() => lists.filter((list) => {
    if (list.status !== 'active') return false;
    if (selectedCategories.length === 0) return true;
    return list.items.some((item) => selectedCategories.includes(item.category));
  }), [lists, selectedCategories]);

  const perform = async (operation) => {
    if (busy) return;
    setBusy(true);
    try {
      await operation();
      await refresh();
      setActiveModal(null);
      setError(null);
      return true;
    } catch (operationError) {
      showUserErrorAlert(operationError, { title: 'Não foi possível concluir a ação', fallback: 'Seus dados foram mantidos. Tente novamente em alguns instantes.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openModal = (mode, listId = null, item = null) => {
    setActiveListId(listId);
    setActiveItem(item);
    setActiveModal(mode);
  };

  const toggleCategory = (category) => setSelectedCategories((current) => current.includes(category)
    ? current.filter((entry) => entry !== category)
    : [...current, category]);

  const toggleCollapsed = (listId) => {
    const next = collapsedIdsRef.current.includes(listId)
      ? collapsedIdsRef.current.filter((id) => id !== listId)
      : [...collapsedIdsRef.current, listId];
    collapsedIdsRef.current = next;
    setCollapsedIds(next);
    collapsedSaveQueueRef.current = collapsedSaveQueueRef.current
      .catch(() => {})
      .then(() => saveCollapsedGroceryListIds(account?.id, pantryId, next))
      .catch((saveError) => {
        console.error('[GroceryListScreen] Falha ao salvar estado das listas:', saveError);
      });
  };

  const toggleSuggestionPanel = async (list) => {
    if (suggestionPanelListId === list.id) {
      setSuggestionPanelListId(null);
      return;
    }
    setSuggestionPanelListId(list.id);
    if (suggestionOptionsByList[list.id]) return;
    setLoadingSuggestionListId(list.id);
    try {
      const options = await getGroceryMarketSuggestions({ pantryId, pantryCep: pantry?.location, list });
      setSuggestionOptionsByList((current) => ({ ...current, [list.id]: options }));
    } catch (suggestionError) {
      console.error('[GroceryListScreen] Falha ao calcular sugestões:', suggestionError);
      showUserErrorAlert(suggestionError, { title: 'Sugestões indisponíveis', fallback: 'Não foi possível consultar os mercados agora. Tente novamente.' });
      setSuggestionPanelListId(null);
    } finally {
      setLoadingSuggestionListId((current) => current === list.id ? null : current);
    }
  };

  const selectSuggestion = (listId, type) => {
    setSelectedSuggestionByList((current) => ({ ...current, [listId]: type }));
    setSuggestionPanelListId(null);
  };

  const sortItems = (items) => {
    if (!sortOption) return items;
    return [...items].sort((first, second) => {
      if (sortOption === 'nameAsc') return first.name.localeCompare(second.name, 'pt-BR');
      if (sortOption === 'nameDesc') return second.name.localeCompare(first.name, 'pt-BR');
      if (sortOption === 'quantityDesc') return second.quantity - first.quantity;
      return 0;
    });
  };

  const startRemoval = (listId) => {
    setRemovalListId(listId);
    setRemovalItemIds([]);
    const next = collapsedIdsRef.current.filter((id) => id !== listId);
    collapsedIdsRef.current = next;
    setCollapsedIds(next);
  };

  const cancelRemoval = () => {
    setRemovalListId(null);
    setRemovalItemIds([]);
  };

  const toggleRemovalItem = (itemId) => setRemovalItemIds((current) => current.includes(itemId)
    ? current.filter((id) => id !== itemId) : [...current, itemId]);

  const confirmRemoval = (list) => {
    if (!removalItemIds.length) {
      Alert.alert('Nenhum produto selecionado', 'Selecione os produtos que deseja remover.');
      return;
    }
    const selectedIds = [...removalItemIds];
    Alert.alert('Remover produtos?', `${selectedIds.length} ${selectedIds.length === 1 ? 'produto será removido' : 'produtos serão removidos'} de ${list.name}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const succeeded = await perform(() => groceryListService.removeGroceryItems({ accountId: account?.id, pantryId, listId: list.id, itemIds: selectedIds }));
        if (succeeded) cancelRemoval();
      } },
    ]);
  };

  const handleStartCheckout = () => {
    if (!activeList?.items.some((item) => item.checked)) {
      Alert.alert('Nenhum item marcado', 'Marque os itens comprados antes de finalizar a lista.');
      return;
    }
    setActiveModal('checkout');
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRY, { pantryId });
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else if (key !== 'shopping-list') Alert.alert('Em breve', `${item.label} estará disponível em breve.`);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Header>
          <TitleRow>
            <ColorCircle $color={pantry?.color} />
            <TitleBlock>
              <Title>Lista de compras</Title>
              <PantryIndicator numberOfLines={1} ellipsizeMode="tail">Despensa: {pantry?.name ?? '...'}</PantryIndicator>
            </TitleBlock>
          </TitleRow>
          <CategoryScroll>
            {PRODUCT_CATEGORIES.map((category) => (
              <CategoryTag
                key={category}
                category={category}
                variant="product"
                selected={selectedCategories.includes(category)}
                onPress={() => toggleCategory(category)}
              />
            ))}
          </CategoryScroll>
          <HeaderActions>
            <RoundButton $disabled={!pantry || loading || busy} disabled={!pantry || loading || busy} accessibilityRole="button" accessibilityLabel="Criar lista de compras" onPress={() => openModal('create')}>
              <AddCircleIcon size={20} color="#000000" />
            </RoundButton>
            <RoundButton $disabled={!pantry || loading || busy} disabled={!pantry || loading || busy} accessibilityRole="button" accessibilityLabel="Filtrar listas" onPress={() => openModal('filter')}>
              <FilterIcon size={20} color="#000000" />
            </RoundButton>
            <RoundButton $disabled={!pantry || loading || busy} disabled={!pantry || loading || busy} accessibilityRole="button" accessibilityLabel="Abrir histórico de listas" onPress={() => setHistoryOpen(true)}>
              <HistoryIcon size={20} color="#000000" />
            </RoundButton>
          </HeaderActions>
        </Header>
        <ListScroll>
          {loading ? <ActivityIndicator accessibilityLabel="Carregando listas" /> : error ? (
            <>
              <StatusText accessibilityRole="alert">{error}</StatusText>
              <RetryButton accessibilityRole="button" onPress={() => { setLoading(true); refresh().then(() => setError(null)).catch((loadError) => { console.error('[GroceryListScreen] Falha ao recarregar listas:', loadError); setPantry(null); setError('Não foi possível carregar as listas desta despensa.'); }).finally(() => setLoading(false)); }}>
                <RetryText>Tentar novamente</RetryText>
              </RetryButton>
            </>
          ) : visibleLists.length === 0 ? (
            <EmptyText>{lists.some((list) => list.status === 'active') ? 'Nenhuma lista corresponde aos filtros.' : 'Você ainda não possui listas ativas.'}</EmptyText>
          ) : visibleLists.map((list) => {
            const expanded = !collapsedIds.includes(list.id);
            const items = sortItems(selectedCategories.length ? list.items.filter((item) => selectedCategories.includes(item.category)) : list.items);
            const showsMarketSuggestions = !list.marketId && !list.location;
            const suggestionOptions = suggestionOptionsByList[list.id] ?? [];
            const selectedSuggestionType = selectedSuggestionByList[list.id];
            const selectedSuggestion = suggestionOptions.find((option) => option.type === selectedSuggestionType);
            const selectedCandidate = selectedSuggestion?.candidate;
            const selectedEstimate = selectedCandidate?.estimate;
            const selectedSuggestionLabel = GROCERY_SUGGESTION_OPTIONS.find((option) => option.type === selectedSuggestionType)?.label;
            const selectedMarketLabel = formatMarketLocation(selectedCandidate?.market);
            return (
              <ListSection key={list.id}>
                <ListHeading>
                  <ListName numberOfLines={1} ellipsizeMode="tail">{list.name}</ListName>
                  <ListActions>
                    {list.status === 'active' ? (
                      <>
                          <IconButton accessibilityRole="button" accessibilityLabel={`Selecionar produtos para remover de ${list.name}`} onPress={() => startRemoval(list.id)}>
                          <CartRemoveIcon size={24} color="#494949" />
                        </IconButton>
                        <IconButton accessibilityRole="button" accessibilityLabel={`Adicionar item a ${list.name}`} onPress={() => openModal('item', list.id)}>
                          <CartAddIcon size={24} color="#494949" />
                        </IconButton>
                      </>
                    ) : null}
                    <IconButton accessibilityRole="button" accessibilityLabel={expanded ? `Recolher ${list.name}` : `Expandir ${list.name}`} onPress={() => toggleCollapsed(list.id)}>
                      <ListChevron expanded={expanded} />
                    </IconButton>
                    <IconButton accessibilityRole="button" accessibilityLabel={`Configurar ${list.name}`} onPress={() => openModal('settings', list.id)}>
                      <SettingsIcon size={24} color="#494949" />
                    </IconButton>
                  </ListActions>
                </ListHeading>
                {expanded && list.items.length > 0 && showsMarketSuggestions ? (
                  <>
                    <EstimateBox
                      accessibilityRole="button"
                      accessibilityLabel={selectedCandidate?.market
                        ? `${selectedSuggestionLabel}: ${selectedMarketLabel}, ${selectedEstimate?.estimatedPrice == null ? 'sem estimativa de preço' : `preço estimado ${formatEstimatedPrice(selectedEstimate.estimatedPrice)}`}. Toque para trocar a sugestão.`
                        : 'Sugestões de mercado. Toque para escolher Mais perto, Melhor custo-benefício ou Marcas mais compradas.'}
                      disabled={loadingSuggestionListId === list.id}
                      onPress={() => toggleSuggestionPanel(list)}
                    >
                      <EstimateCopy>
                      <EstimateTitle>{selectedCandidate?.market ? selectedSuggestionLabel : 'Sugestões de mercado'}</EstimateTitle>
                        {selectedCandidate?.market ? (
                          <>
                            <EstimateDetail>{selectedSuggestionType === GROCERY_SUGGESTION_TYPES.NEAREST
                              ? `${selectedMarketLabel} · aprox. ${selectedCandidate.distanceKm.toFixed(1).replace('.', ',')} km`
                              : selectedSuggestionType === GROCERY_SUGGESTION_TYPES.MOST_BOUGHT_BRANDS
                                ? `${selectedMarketLabel} · marcas favoritas em ${selectedCandidate.brandCoverage.available} de ${selectedCandidate.brandCoverage.total} produtos`
                                : `${selectedMarketLabel} · histórico para ${selectedEstimate.matchedItems} de ${selectedEstimate.totalItems} itens`}</EstimateDetail>
                            {selectedEstimate.missingItems?.length ? (
                              <EstimateMissingAction accessibilityRole="button" onPress={(event) => {
                                event.stopPropagation();
                                Alert.alert('Produtos sem histórico neste mercado', selectedEstimate.missingItems.join('\n'));
                              }}>
                                <EstimateMissingText>Ver produtos sem histórico</EstimateMissingText>
                              </EstimateMissingAction>
                            ) : null}
                          </>
                        ) : <EstimateDetail>Toque para comparar proximidade, preço e marcas.</EstimateDetail>}
                      </EstimateCopy>
                      {selectedEstimate?.estimatedPrice != null ? (
                        <EstimateAmount>
                          <EstimatePriceLabel>Preço estimado</EstimatePriceLabel>
                          <EstimatePrice>{formatEstimatedPrice(selectedEstimate.estimatedPrice)}</EstimatePrice>
                        </EstimateAmount>
                      ) : null}
                    </EstimateBox>
                    {suggestionPanelListId === list.id ? (
                      <EstimateSuggestionOptions>
                        <EstimateDisclaimer>
                          <EstimateDisclaimerText>Estimativa baseada no histórico de compras. O valor pode variar.</EstimateDisclaimerText>
                        </EstimateDisclaimer>
                        {loadingSuggestionListId === list.id ? <EstimateDetail>Consultando histórico e localização…</EstimateDetail> : null}
                        {suggestionOptions.map((option) => {
                          const candidate = option.candidate;
                          const detail = option.disabled ? option.message
                            : option.type === GROCERY_SUGGESTION_TYPES.NEAREST
                              ? `${formatMarketLocation(candidate.market)} · aprox. ${candidate.distanceKm.toFixed(1).replace('.', ',')} km`
                              : option.type === GROCERY_SUGGESTION_TYPES.MOST_BOUGHT_BRANDS
                                ? `${formatMarketLocation(candidate.market)} · marcas favoritas em ${candidate.brandCoverage.available} de ${candidate.brandCoverage.total} produtos`
                                : `${formatMarketLocation(candidate.market)} · ${candidate.estimate.estimatedPrice == null ? 'sem preço estimado' : `preço estimado: ${formatEstimatedPrice(candidate.estimate.estimatedPrice)}`}`;
                          return (
                            <EstimateSuggestionOption
                              key={option.type}
                              accessibilityRole="button"
                              accessibilityState={{ disabled: option.disabled, selected: selectedSuggestionType === option.type }}
                              disabled={option.disabled || loadingSuggestionListId === list.id}
                              onPress={() => selectSuggestion(list.id, option.type)}
                              $selected={selectedSuggestionType === option.type}
                            >
                              <EstimateSuggestionOptionTitle>{GROCERY_SUGGESTION_OPTIONS.find((entry) => entry.type === option.type)?.label}</EstimateSuggestionOptionTitle>
                              <EstimateSuggestionOptionDetail>{detail}</EstimateSuggestionOptionDetail>
                            </EstimateSuggestionOption>
                          );
                        })}
                      </EstimateSuggestionOptions>
                    ) : null}
                  </>
                ) : expanded && list.items.length > 0 ? (
                  <EstimateBox accessibilityLabel={list.estimatedPrice == null
                    ? `Histórico disponível para ${list.matchedItems} de ${list.totalItems} itens`
                    : `${list.matchedItems < list.totalItems ? 'Estimativa parcial' : 'Total estimado'}: ${formatEstimatedPrice(list.estimatedPrice)}; histórico para ${list.matchedItems} de ${list.totalItems} itens`}>
                    {list.estimatedPrice == null ? (
                      <>
                        <EstimateCopy>
                          <EstimateTitle>{list.location ? 'Sem estimativa neste mercado' : 'Estimativa parcial'}</EstimateTitle>
                          <EstimateDetail>{list.location
                            ? `${list.market?.localName || 'Mercado selecionado'} · histórico para ${list.matchedItems} de ${list.totalItems} itens.`
                            : `Histórico disponível para ${list.matchedItems} de ${list.totalItems} itens.`}</EstimateDetail>
                          {list.missingItems?.length ? (
                            <EstimateMissingAction accessibilityRole="button" onPress={() => Alert.alert(
                              'Produtos sem histórico',
                              list.missingItems.join('\n'),
                            )}>
                              <EstimateMissingText>Ver produtos sem histórico</EstimateMissingText>
                            </EstimateMissingAction>
                          ) : null}
                        </EstimateCopy>
                      </>
                    ) : (
                      <>
                        <EstimateCopy>
                          <EstimateTitle>{list.location ? 'Preço estimado neste mercado' : list.matchedItems < list.totalItems ? 'Estimativa parcial' : 'Total estimado'}</EstimateTitle>
                          <EstimateDetail>{list.matchedItems < list.totalItems
                            ? `${list.location ? `${list.market?.localName || 'Mercado selecionado'} · ` : ''}Soma de ${list.matchedItems} de ${list.totalItems} itens com histórico.`
                            : list.location ? `${list.market?.localName || 'Mercado selecionado'} · com base no histórico de compras.` : 'Com base no histórico de compras.'}</EstimateDetail>
                          {list.missingItems?.length ? (
                            <EstimateMissingAction accessibilityRole="button" onPress={() => Alert.alert(
                              'Produtos sem histórico',
                              list.missingItems.join('\n'),
                            )}>
                              <EstimateMissingText>Ver produtos sem histórico</EstimateMissingText>
                            </EstimateMissingAction>
                          ) : null}
                        </EstimateCopy>
                        <EstimateAmount>
                          <EstimatePriceLabel>Preço estimado</EstimatePriceLabel>
                          <EstimatePrice>{formatEstimatedPrice(list.estimatedPrice)}</EstimatePrice>
                        </EstimateAmount>
                      </>
                    )}
                  </EstimateBox>
                ) : expanded && list.location ? (
                  <EstimateBox accessibilityLabel={`Mercado selecionado: ${list.market?.localName || 'mercado não identificado'}; a estimativa aparecerá quando a lista tiver produtos.`}>
                    <EstimateCopy>
                      <EstimateTitle>Mercado selecionado</EstimateTitle>
                      <EstimateDetail>{list.market?.localName || 'Mercado não identificado'} · adicione produtos para estimar o preço.</EstimateDetail>
                    </EstimateCopy>
                  </EstimateBox>
                ) : null}
                {removalListId === list.id ? (
                  <SelectionBar>
                    <SelectionHint>Selecione os produtos ({removalItemIds.length})</SelectionHint>
                    <SelectionButton accessibilityRole="button" onPress={cancelRemoval}><SelectionButtonText>Cancelar</SelectionButtonText></SelectionButton>
                    <SelectionButton accessibilityRole="button" onPress={() => confirmRemoval(list)} $confirm><SelectionButtonText $confirm>Remover</SelectionButtonText></SelectionButton>
                  </SelectionBar>
                ) : null}
                <AnimatedDropdown open={expanded}>
                  <ItemStack>
                    {items.length ? items.map((item) => (
                      <GroceryListItemCard
                        key={item.id}
                        name={item.name}
                        category={item.category}
                        weight={item.weight ? `${item.weight}${item.unit ?? ''}` : ''}
                        quantity={`${item.quantity}x`}
                        checked={removalListId === list.id ? removalItemIds.includes(item.id) : item.checked}
                        disabled={list.status !== 'active' || busy}
                        onEdit={removalListId === list.id ? undefined : () => openModal('editItem', list.id, item)}
                        onToggle={removalListId === list.id ? () => toggleRemovalItem(item.id) : () => perform(() => groceryListService.setGroceryItemChecked({ accountId: account?.id, pantryId, listId: list.id, itemId: item.id, checked: !item.checked }))}
                      />
                    )) : <EmptyText>Esta lista ainda não tem itens.</EmptyText>}
                  </ItemStack>
                </AnimatedDropdown>
              </ListSection>
            );
          })}
        </ListScroll>
      </Content>
      <GroceryListModal
        visible={Boolean(activeModal)}
        mode={activeModal}
        list={activeList}
        item={activeItem}
        busy={busy}
        sortOption={sortOption}
        onRequestClose={() => setActiveModal(null)}
        onCreate={(draft) => perform(() => groceryListService.createGroceryList({ ...draft, accountId: account?.id, pantryId }))}
        onAddItem={(draft) => perform(() => groceryListService.addGroceryItem({ ...draft, accountId: account?.id, pantryId, listId: activeListId }))}
        onUpdateItem={(draft) => perform(() => groceryListService.updateGroceryItem({ ...draft, accountId: account?.id, pantryId, listId: activeListId, itemId: activeItem?.id }))}
        onUpdate={(draft) => perform(() => groceryListService.updateGroceryList({ ...draft, accountId: account?.id, pantryId, listId: activeListId }))}
        onRepeat={(draft) => perform(() => groceryListService.repeatGroceryList({ ...draft, accountId: account?.id, pantryId, listId: activeListId }))}
        onStartCheckout={handleStartCheckout}
        onCheckout={(pricesByItemId) => perform(() => finishListAndStock({ accountId: account?.id, pantryId, listId: activeListId, pricesByItemId }))}
        onDelete={() => perform(() => groceryListService.deleteGroceryList({ accountId: account?.id, pantryId, listId: activeListId }))}
        onSortChange={setSortOption}
      />
      <GroceryListHistoryModal
        visible={historyOpen}
        lists={lists.filter((list) => list.status === 'finished')}
        busy={busy}
        onClose={() => setHistoryOpen(false)}
        onRepeat={(list) => {
          setHistoryOpen(false);
          openModal('repeat', list.id);
        }}
      />
      <Navbar activeItem="shopping-list" onItemChange={handleNavbar} />
    </Screen>
  );
}

import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SectionList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AddCircleIcon, AddUserIcon, FilterIcon } from '../../assets/icons/export';
import CategoryTag from '../../components/CategoryTag';
import ModalActionButton from '../../components/ModalActionButton';
import Navbar from '../../components/Navbar';
import SearchField from '../../components/SearchField';
import ProductCard from '../../components/ProductCard';
import AddProductModal from '../../components/AddProductModal';
import ProductInfoModal from '../../components/ProductInfoModal';
import ProductFilterModal from '../../components/ProductFilterModal';
import AddProductMethodModal from '../../components/AddProductMethodModal';
import NfceScannerModal from '../../components/NfceScannerModal';
import { useAuth } from '../../contexts/AuthContext';
import { getProductPresentationKey } from '../../domain/pantryProductGrouping';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listPantries } from '../../services/pantryService';
import {
  addProduct,
  assertFiscalNoteUnused,
  deleteProduct,
  getProductViewPreferences,
  listProducts,
  listProductOccurrences,
  PANTRY_BRAND_GROUPING,
  saveProductDuplicatePromptCount,
  setProductBrandGrouping,
  updateProduct,
  updateProductQuantity,
} from '../../services/productService';
import { PRODUCT_CATEGORIES } from '../../domain/productValidation';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  Screen, Content, Header, TitleRow, ColorCircle, Title, Actions,
  Categories, CategorySection, EmptyState, EmptyText, StatusArea, ErrorText, Retry, RetryText,
} from './styles';

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const formatExpirationDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export default function PantryScreen({ route, navigation }) {
  const { account } = useAuth();
  const [pantry, setPantry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [storedProducts, setStoredProducts] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [updatingProductIds, setUpdatingProductIds] = useState([]);
  const brandGroupingRef = useRef({});
  const productOccurrencesRef = useRef(null);
  const pantryId = route.params?.pantryId;

  const refreshProducts = useCallback(async (groupings = brandGroupingRef.current) => {
    const [items, occurrences] = await Promise.all([
      listProducts(account?.id, pantryId, { brandGroupingByPresentation: groupings }),
      listProductOccurrences(account?.id, pantryId),
    ]);
    setStoredProducts(items);
    productOccurrencesRef.current = occurrences;
    return occurrences;
  }, [account?.id, pantryId]);

  const applyBrandGrouping = useCallback(async (presentationKey, mode) => {
    const nextPreferences = { ...brandGroupingRef.current, [presentationKey]: mode };
    await setProductBrandGrouping(account?.id, pantryId, presentationKey, mode);
    brandGroupingRef.current = nextPreferences;
    await refreshProducts(nextPreferences);
  }, [account?.id, pantryId, refreshProducts]);

  const promptForDuplicateProducts = useCallback(async (occurrences) => {
    const preferences = await getProductViewPreferences(account?.id, pantryId);
    const previousCounts = preferences.promptedDuplicateCounts ?? {};
    const groups = new Map();
    (occurrences ?? []).forEach((product) => {
      const key = getProductPresentationKey(product);
      const group = groups.get(key) ?? { count: 0, product };
      group.count += 1;
      groups.set(key, group);
    });

    const queue = [];
    const countsToPersist = new Map();
    const knownKeys = new Set([...Object.keys(previousCounts), ...groups.keys()]);
    knownKeys.forEach((duplicateKey) => {
      const currentCount = groups.get(duplicateKey)?.count ?? 0;
      const previousCount = Number(previousCounts[duplicateKey]) || 0;
      if (currentCount < previousCount) countsToPersist.set(duplicateKey, currentCount);
      if (currentCount >= 2 && currentCount > previousCount) {
        const product = groups.get(duplicateKey).product;
        for (let count = Math.max(2, previousCount + 1); count <= currentCount; count += 1) {
          queue.push({ duplicateKey, count, presentationKey: duplicateKey, product });
        }
      }
    });
    for (const [key, count] of countsToPersist) {
      await saveProductDuplicatePromptCount(account?.id, pantryId, key, count);
    }

    for (const prompt of queue) {
      await new Promise((resolve) => {
        let showChoice;
        const confirmChoice = (mode) => () => Alert.alert(
          'Confirmar exibição?',
          'Essa escolha não poderá ser desfeita. Uma nova ocorrência duplicada poderá gerar uma nova escolha.',
          [
            { text: 'Voltar', style: 'cancel', onPress: showChoice },
            {
              text: 'Confirmar',
              onPress: async () => {
                try {
                  await applyBrandGrouping(prompt.presentationKey, mode);
                  await saveProductDuplicatePromptCount(account?.id, pantryId, prompt.duplicateKey, prompt.count);
                } catch {
                  showUserErrorAlert(null, {
                    title: 'Não foi possível salvar a exibição',
                    fallback: 'Tente escolher novamente quando este produto aparecer na despensa.',
                  });
                } finally {
                  resolve();
                }
              },
            },
          ],
          { cancelable: false },
        );

        showChoice = () => Alert.alert(
          'Como exibir este produto?',
          `Há mais de um ${prompt.product.name} com o mesmo tamanho na despensa. Como você prefere exibir as marcas deste produto?`,
          [
            { text: 'Juntar marcas', onPress: confirmChoice(PANTRY_BRAND_GROUPING.GROUPED) },
            { text: 'Separar marcas', onPress: confirmChoice(PANTRY_BRAND_GROUPING.SEPARATE) },
          ],
          { cancelable: false },
        );

        showChoice();
      });
    }
  }, [account?.id, applyBrandGrouping, pantryId]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setPantry(null);
    setError(null);
    setStoredProducts([]);
    setIsAddOpen(false);
    setIsAddMethodOpen(false);
    setIsScannerOpen(false);
    setIsFilterOpen(false);
    setSelectedProduct(null);
    Promise.all([listPantries(account?.id), getProductViewPreferences(account?.id, pantryId)]).then(async ([pantries, preferences]) => {
      if (!active) return;
      const groupings = preferences.brandGroupingByPresentation ?? {};
      const [items, occurrences] = await Promise.all([
        listProducts(account?.id, pantryId, { brandGroupingByPresentation: groupings }),
        listProductOccurrences(account?.id, pantryId),
      ]);
      if (!active) return;
      const found = pantries.find((item) => item.id === pantryId);
      setPantry(found ?? null);
      brandGroupingRef.current = groupings;
      productOccurrencesRef.current = occurrences;
      setStoredProducts(items);
      if (!found) setError('Esta despensa não está disponível para sua conta.');
      setLoading(false);
      if (found) await promptForDuplicateProducts(occurrences);
    }).catch(() => {
      if (active) setError('Não foi possível carregar esta despensa.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [account?.id, pantryId, reloadKey, promptForDuplicateProducts]));

  const products = storedProducts
    .filter((product) => normalize(product.name).includes(normalize(query)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(product.category)))
    .sort((first, second) => {
      if (sortOption === 'nameAsc') return first.name.localeCompare(second.name, 'pt-BR');
      if (sortOption === 'nameDesc') return second.name.localeCompare(first.name, 'pt-BR');
      if (sortOption === 'priceAsc') return first.unitPrice - second.unitPrice;
      if (sortOption === 'priceDesc') return second.unitPrice - first.unitPrice;
      if (sortOption === 'quantityDesc') return second.quantity - first.quantity;
      return 0;
    });

  const toggleCategory = (key) => {
    setSelectedCategories((current) => current.includes(key)
      ? current.filter((category) => category !== key)
      : [...current, key]);
  };

  const updateQuantity = async (product, quantity) => {
    if (updatingProductIds.includes(product.id)) return;
    setUpdatingProductIds((current) => [...current, product.id]);
    try {
      await updateProductQuantity({
        accountId: account?.id,
        pantryId,
        productIds: product.occurrenceIds,
        quantity,
      });
      await refreshProducts();
    } catch {
      showUserErrorAlert(null, { title: 'Não foi possível atualizar a quantidade', fallback: 'A quantidade anterior foi mantida. Tente novamente em alguns instantes.' });
    } finally {
      setUpdatingProductIds((current) => current.filter((id) => id !== product.id));
    }
  };

  const sections = selectedCategories.length === 0 ? [] : selectedCategories.map((category) => ({
    category,
    data: products.filter((product) => product.category === category),
  })).filter((section) => section.data.length > 0);

  const renderProduct = ({ item, section }) => (
    <ProductCard
      {...item}
      category={item.category}
      expirationLabel={formatExpirationDate(item.expirationDate)}
      disabled={updatingProductIds.includes(item.id)}
      onDecrement={() => updateQuantity(item, item.quantity - 1)}
      onIncrement={() => updateQuantity(item, item.quantity + 1)}
      onInfoPress={() => {
        const openOccurrence = () => setSelectedProduct(item.primaryOccurrence);
        if (item.occurrenceCount > 1) {
          Alert.alert(
            'Produto com várias compras',
            `Este saldo reúne ${item.occurrenceCount} compras. A edição e a exclusão abaixo serão aplicadas somente à compra mais recente; os botões de quantidade continuam atualizando o saldo total pela ordem das compras.`,
            [{ text: 'Cancelar', style: 'cancel' }, { text: 'Ver compra mais recente', onPress: openOccurrence }],
          );
        } else openOccurrence();
      }}
      showCategory={!section}
    />
  );

  const handleCreate = async (draft) => {
    const previousOccurrences = productOccurrencesRef.current ?? [];
    await addProduct({ ...draft, accountId: account?.id, pantryId });
    const occurrences = await refreshProducts();
    setQuery('');
    setSelectedCategories([]);
    setIsAddOpen(false);
    if (previousOccurrences.length) {
      setTimeout(() => promptForDuplicateProducts(occurrences), 250);
    }
  };


  const handleUpdate = async (draft) => {
    if (!selectedProduct) return;
    const previousOccurrences = productOccurrencesRef.current ?? [];
    await updateProduct({
      ...draft,
      accountId: account?.id,
      pantryId,
      productId: selectedProduct.id,
    });
    const occurrences = await refreshProducts();
    setSelectedProduct(null);
    if (previousOccurrences.length) {
      setTimeout(() => promptForDuplicateProducts(occurrences), 250);
    }
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    Alert.alert(
      'Excluir produto?',
      `"${selectedProduct.name}" será removido desta despensa. O histórico da compra será preservado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct({ accountId: account?.id, pantryId, productId: selectedProduct.id });
              const occurrences = await refreshProducts();
              await promptForDuplicateProducts(occurrences);
              setSelectedProduct(null);
            } catch {
              showUserErrorAlert(null, { title: 'Não foi possível excluir o produto', fallback: 'O produto continua na despensa. Tente novamente em alguns instantes.' });
            }
          },
        },
      ],
    );
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else Alert.alert('Em breve', `${item.label} estará disponível em breve.`);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Content>
        {loading ? <StatusArea><ActivityIndicator accessibilityLabel="Carregando despensa" /></StatusArea> : error ? (
          <StatusArea>
            <ErrorText accessibilityRole="alert">{error}</ErrorText>
            <Retry accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
              <RetryText>Tentar novamente</RetryText>
            </Retry>
          </StatusArea>
        ) : (
          <>
            <Header>
              <TitleRow>
                <ColorCircle $color={pantry.color} />
                <Title accessibilityRole="header">{pantry.name}</Title>
              </TitleRow>
              <Actions>
                <ModalActionButton Icon={AddUserIcon} accessibilityLabel="Compartilhar despensa" onPress={() => Alert.alert('Compartilhamento indisponível', 'O compartilhamento de despensas estará disponível em uma próxima atualização.')} />
                <ModalActionButton Icon={AddCircleIcon} accessibilityLabel="Adicionar produto" onPress={() => setIsAddMethodOpen(true)} />
                <ModalActionButton Icon={FilterIcon} accessibilityLabel="Filtrar produtos" onPress={() => setIsFilterOpen(true)} />
              </Actions>
              <SearchField value={query} onChangeText={setQuery} />
              <Categories horizontal showsHorizontalScrollIndicator={false}>
                {PRODUCT_CATEGORIES.map((key) => (
                  <CategoryTag key={key} category={key} variant="product" selected={selectedCategories.includes(key)} onSelectionChange={() => toggleCategory(key)} />
                ))}
              </Categories>
            </Header>
            {products.length === 0 ? (
              <EmptyState>
                <EmptyText>{storedProducts.length === 0 ? 'Você ainda não possui produtos nesta despensa...' : 'Nenhum produto encontrado.'}</EmptyText>
              </EmptyState>
            ) : (
              <SectionList
                sections={selectedCategories.length === 0 ? [{ data: products }] : sections}
                keyExtractor={(item) => item.id}
                renderItem={renderProduct}
                renderSectionHeader={({ section }) => section.category ? <CategorySection><CategoryTag category={section.category} disabled variant="product" /></CategorySection> : null}
                contentContainerStyle={{ padding: 8, paddingBottom: 24, gap: 20 }}
                style={{ flex: 1, marginTop: 32, marginHorizontal: -4 }}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </>
        )}
      </Content>
      <AddProductModal visible={isAddOpen} onCreate={handleCreate} onRequestClose={() => setIsAddOpen(false)} />
      <AddProductMethodModal
        visible={isAddMethodOpen}
        onRequestClose={() => setIsAddMethodOpen(false)}
        onManual={() => { setIsAddMethodOpen(false); setIsAddOpen(true); }}
        onQrCode={() => { setIsAddMethodOpen(false); setIsScannerOpen(true); }}
      />
      <NfceScannerModal
        visible={isScannerOpen}
        onRequestClose={() => setIsScannerOpen(false)}
        onPurchaseLoaded={async (purchase) => {
          await assertFiscalNoteUnused({ accountId: account?.id, pantryId, qrCodeId: purchase.qrCodeId });
          setIsScannerOpen(false);
          setQuery('');
          setSelectedCategories([]);
          navigation.navigate(AUTHENTICATED_ROUTES.NFCE_REVIEW, { purchase, pantryId, pantryName: pantry?.name, pantryColor: pantry?.color });
        }}
      />
      <ProductInfoModal
        visible={Boolean(selectedProduct)}
        product={selectedProduct}
        onDelete={handleDelete}
        onRequestClose={() => setSelectedProduct(null)}
        onSave={handleUpdate}
      />
      <ProductFilterModal
        visible={isFilterOpen}
        selectedSort={sortOption}
        onApply={setSortOption}
        onRequestClose={() => setIsFilterOpen(false)}
      />
      <Navbar activeItem="profile" onItemChange={handleNavbar} />
    </Screen>
  );
}

import { useCallback, useState } from 'react';
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
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listPantries } from '../../services/pantryService';
import { addProduct, deleteProduct, listProducts, updateProduct, updateProductQuantity } from '../../services/productService';
import { PRODUCT_CATEGORIES } from '../../domain/productValidation';
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
  const pantryId = route.params?.pantryId;

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
    Promise.all([listPantries(account?.id), listProducts(account?.id, pantryId)]).then(([pantries, items]) => {
      if (!active) return;
      const found = pantries.find((item) => item.id === pantryId);
      setPantry(found ?? null);
      setStoredProducts(items);
      if (!found) setError('Esta despensa não está disponível para sua conta.');
    }).catch(() => {
      if (active) setError('Não foi possível carregar esta despensa.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [account?.id, pantryId, reloadKey]));

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
      const updated = await updateProductQuantity({ accountId: account?.id, pantryId, productId: product.id, quantity });
      setStoredProducts((current) => current.map((item) => item.id === product.id ? updated : item));
    } catch {
      Alert.alert('Não foi possível atualizar a quantidade', 'Tente novamente em alguns instantes.');
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
      onInfoPress={() => setSelectedProduct(item)}
      showCategory={!section}
    />
  );

  const handleCreate = async (draft) => {
    const product = await addProduct({ ...draft, accountId: account?.id, pantryId });
    setStoredProducts((current) => [...current, product]);
    setQuery('');
    setSelectedCategories([]);
    setIsAddOpen(false);
  };


  const handleUpdate = async (draft) => {
    if (!selectedProduct) return;
    const updated = await updateProduct({
      ...draft,
      accountId: account?.id,
      pantryId,
      productId: selectedProduct.id,
    });
    setStoredProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelectedProduct(null);
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
              setStoredProducts((current) => current.filter((item) => item.id !== selectedProduct.id));
              setSelectedProduct(null);
            } catch {
              Alert.alert('Não foi possível excluir o produto', 'Tente novamente em alguns instantes.');
            }
          },
        },
      ],
    );
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
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
        onPurchaseLoaded={(purchase) => {
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

import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AddCircleIcon, AddUserIcon, FilterIcon } from '../../assets/icons/export';
import CategoryTag from '../../components/CategoryTag';
import ModalActionButton from '../../components/ModalActionButton';
import Navbar from '../../components/Navbar';
import SearchField from '../../components/SearchField';
import ProductCard from '../../components/ProductCard';
import AddProductModal from '../../components/AddProductModal';
import { useAuth } from '../../contexts/AuthContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listPantries } from '../../services/pantryService';
import { addProduct, listProducts } from '../../services/productService';
import {
  Screen, Content, Header, TitleRow, ColorCircle, Title, Actions,
  Categories, ProductList, EmptyText, StatusArea, ErrorText, Retry, RetryText,
} from './styles';

const CATEGORIES = ['bebidas', 'organicos', 'limpezaHigiene', 'integraisCereais', 'frescos', 'carnes'];
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function PantryScreen({ route, navigation }) {
  const { account } = useAuth();
  const [pantry, setPantry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [storedProducts, setStoredProducts] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const pantryId = route.params?.pantryId;

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setPantry(null);
    setError(null);
    setStoredProducts([]);
    setIsAddOpen(false);
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

  const products = storedProducts.filter((product) =>
    normalize(product.name).includes(normalize(query)) &&
    (selectedCategories.length === 0 || selectedCategories.includes(product.category)));

  const toggleCategory = (key) => {
    setSelectedCategories((current) => current.includes(key)
      ? current.filter((category) => category !== key)
      : [...current, key]);
  };

  const handleCreate = async (draft) => {
    const product = await addProduct({ ...draft, accountId: account?.id, pantryId });
    setStoredProducts((current) => [...current, product]);
    setQuery('');
    setSelectedCategories([]);
    setIsAddOpen(false);
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
                <ModalActionButton Icon={AddCircleIcon} accessibilityLabel="Adicionar produto" onPress={() => setIsAddOpen(true)} />
                <ModalActionButton Icon={FilterIcon} accessibilityLabel="Filtrar produtos" onPress={() => Alert.alert('Em breve', 'O modal de filtros estará disponível em breve.')} />
              </Actions>
              <SearchField value={query} onChangeText={setQuery} />
              <Categories horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((key) => (
                  <CategoryTag key={key} category={key} variant="product" selected={selectedCategories.includes(key)} onSelectionChange={() => toggleCategory(key)} />
                ))}
              </Categories>
            </Header>
            <ProductList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard {...item} />}
              ListEmptyComponent={<EmptyText>{storedProducts.length === 0 ? 'Você ainda não possui produtos nesta despensa...' : 'Nenhum produto encontrado.'}</EmptyText>}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </Content>
      <AddProductModal visible={isAddOpen} onCreate={handleCreate} onRequestClose={() => setIsAddOpen(false)} />
      <Navbar activeItem="profile" onItemChange={handleNavbar} />
    </Screen>
  );
}

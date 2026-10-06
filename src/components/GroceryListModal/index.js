import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, Platform } from 'react-native';

import {
  AngleIcon,
  BoxIcon,
  CalendarIcon,
  CancelCircleIcon,
  CheckIcon,
  DeliveryIcon,
  FilterIcon,
  PenIcon,
  ShoppingListIcon,
} from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { ProductCartIcon } from '../AddProductModal/icons';
import CategoryTag from '../CategoryTag';
import AnimatedDropdown from '../AnimatedDropdown';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
import {
  Accordion, AccordionHeader, AccordionLabel, Actions, Body, Card, CategoryOptions,
  CheckoutItem, CheckoutItemMeta, CheckoutItemName, CheckoutList, Chevron,
  CompactAction, CompactActionLabel, Content, ErrorText, Fields, FilterSection, FilterSectionLabel,
  FilterSectionTitle, Header, Heading, HelpText, KeyboardFrame, Overlay,
  SortOption, SortOptionLabel, SortOptions, UnitLabel, UnitOption, UnitOptions, WeightGroup,
} from './styles';

function CategoryChevron({ expanded }) {
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
  return <Chevron style={style}><AngleIcon /></Chevron>;
}

const SORT_OPTIONS = [
  { key: 'nameAsc', label: 'A - Z' },
  { key: 'nameDesc', label: 'Z - A' },
  { key: 'priceAsc', label: 'Menor Preço', disabled: true },
  { key: 'priceDesc', label: 'Maior Preço', disabled: true },
  { key: 'quantityDesc', label: 'Maior quantidade' },
];

const isDateValid = (value) => {
  if (!value) return true;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
};

const dateToIso = (value) => value ? value.split('/').reverse().join('-') : null;
const dateToBr = (value) => value ? value.split('-').reverse().join('/') : '';

const parseBrl = (value) => {
  const text = String(value ?? '').trim();
  const normalized = /^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Number(normalized);
};

export default function GroceryListModal({
  visible, mode, list, item, busy, sortOption, onRequestClose,
  onCreate, onAddItem, onUpdate, onUpdateItem, onRepeat, onDelete,
  onSortChange, onStartCheckout, onCheckout,
}) {
  const [name, setName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [selectedSort, setSelectedSort] = useState(null);
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(mode === 'settings' ? list?.name ?? '' : mode === 'editItem' ? item?.name ?? '' : '');
    setPlannedDate(mode === 'settings' ? dateToBr(list?.plannedDate) : '');
    setQuantity(mode === 'editItem' ? String(item?.quantity ?? 1) : '1');
    setWeight(mode === 'editItem' && item?.weight != null ? String(item.weight).replace('.', ',') : '');
    setUnit(mode === 'editItem' ? item?.unit ?? '' : '');
    setCategory(mode === 'editItem' ? item?.category ?? 'outros' : null);
    setIsCategoryOpen(true);
    setSelectedSort(sortOption ?? null);
    setPrices({});
    setError('');
  }, [visible, mode, list?.id, item?.id, sortOption]);

  if (!mode) return null;

  const checkedItems = list?.items?.filter((item) => item.checked) ?? [];
  const isListForm = mode === 'create' || mode === 'settings';
  const isItemForm = mode === 'item' || mode === 'editItem';
  const isCheckout = mode === 'checkout';
  const isFinished = mode === 'settings' && list?.status === 'finished';
  const title = mode === 'create' ? 'Criar Lista de Compras'
    : mode === 'item' ? 'Adicionar produtos'
      : mode === 'editItem' ? 'Editar produto'
      : mode === 'settings' ? 'Editar Lista de Compras'
        : isCheckout ? 'Finalizar compra' : 'Filtros';
  const HeaderIcon = mode === 'item' || mode === 'editItem' || isCheckout ? ProductCartIcon
    : mode === 'filter' ? FilterIcon : ShoppingListIcon;

  const clearError = () => setError('');
  const toggleCategoryOptions = () => setIsCategoryOpen((open) => !open);
  const handleDateChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4
      ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
      : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setPlannedDate(formatted);
    clearError();
  };

  const submit = () => {
    const cleanName = name.trim();
    if (isListForm) {
      if (!cleanName) return setError('Informe o nome da lista.');
      if (!isDateValid(plannedDate)) return setError('Informe uma data válida no formato DD/MM/AAAA.');
      const draft = { name: cleanName, plannedDate: dateToIso(plannedDate) };
      return mode === 'create' ? onCreate(draft) : onUpdate(draft);
    }
    if (isItemForm) {
      if (!cleanName) return setError('Informe o nome do produto.');
      if (!/^\d+$/.test(quantity) || Number(quantity) < 1) return setError('Informe uma quantidade inteira maior que zero.');
      const hasWeight = weight.trim() !== '';
      const normalizedWeight = Number(weight.replace(',', '.'));
      if (hasWeight && (!(normalizedWeight > 0) || !Number.isFinite(normalizedWeight))) return setError('Informe um peso ou volume maior que zero.');
      if (hasWeight && !PRODUCT_UNITS.includes(unit)) return setError('Escolha a unidade de medida.');
      if (!PRODUCT_CATEGORIES.includes(category)) return setError('Escolha uma categoria.');
      const draft = {
        name: cleanName,
        quantity: Number(quantity),
        weight: hasWeight ? normalizedWeight : null,
        unit: hasWeight ? unit : null,
        category,
      };
      return mode === 'editItem' ? onUpdateItem(draft) : onAddItem(draft);
    }
    if (isCheckout) {
      if (!checkedItems.length) return setError('Marque ao menos um produto para finalizar a compra.');
      const parsedPrices = {};
      for (const item of checkedItems) {
        const price = parseBrl(prices[item.id]);
        if (!(price > 0) || !Number.isSafeInteger(Math.round(price * 100))) {
          return setError(`Informe um preço unitário válido para ${item.name}.`);
        }
        parsedPrices[item.id] = price;
      }
      return onCheckout(parsedPrices);
    }
    onSortChange(selectedSort);
    onRequestClose();
    return undefined;
  };

  const confirmDelete = () => Alert.alert(
    'Excluir lista de compras?',
    'Esta ação removerá a lista ativa e seus itens.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onDelete },
    ],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <KeyboardFrame behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Overlay accessibilityViewIsModal>
          <Card>
            <Body bounces={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Content>
                <Header><HeaderIcon size={24} color="#00DD00" /><Heading>{title}</Heading></Header>

                {isListForm ? (
                  <Fields>
                    <FormField
                      accessibilityLabel="Nome da lista"
                      autoCapitalize="sentences"
                      editable={!busy && !isFinished}
                      error={error.toLowerCase().includes('nome') ? error : undefined}
                      Icon={PenIcon}
                      maxLength={100}
                      onChangeText={(value) => { setName(value); clearError(); }}
                      placeholder="Nome"
                      value={name}
                    />
                    <FormField
                      accessibilityLabel="Data planejada para a compra"
                      editable={!busy && !isFinished}
                      error={error.toLowerCase().includes('data') ? error : undefined}
                      Icon={CalendarIcon}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      maxLength={10}
                      onChangeText={handleDateChange}
                      placeholder="Data da compra (DD/MM/AAAA)"
                      value={plannedDate}
                    />
                  </Fields>
                ) : null}

                {isItemForm ? (
                  <Fields>
                    <FormField accessibilityLabel="Nome do produto, obrigatório" autoCapitalize="sentences" editable={!busy} Icon={PenIcon} maxLength={120} onChangeText={(value) => { setName(value); clearError(); }} placeholder="Nome *" value={name} />
                    <FormField accessibilityLabel="Quantidade do produto, obrigatória" editable={!busy} Icon={DeliveryIcon} inputMode="numeric" keyboardType="number-pad" maxLength={5} onChangeText={(value) => { setQuantity(value.replace(/\D/g, '')); clearError(); }} placeholder="Quantidade *" value={quantity} />
                    <WeightGroup>
                      <FormField
                        accessibilityLabel="Peso ou volume do produto"
                        editable={!busy}
                        Icon={BoxIcon}
                        inputMode="decimal"
                        keyboardType="decimal-pad"
                        maxLength={16}
                        onChangeText={(value) => { setWeight(value); if (!value.trim()) setUnit(''); clearError(); }}
                        placeholder="Peso"
                        value={weight}
                      />
                      {weight.trim() ? (
                        <UnitOptions accessibilityRole="radiogroup">
                          {PRODUCT_UNITS.map((option) => (
                            <UnitOption key={option} accessibilityLabel={`Unidade ${option}`} accessibilityRole="radio" accessibilityState={{ checked: unit === option }} disabled={busy} onPress={() => { setUnit(option); clearError(); }} $selected={unit === option}>
                              <UnitLabel $selected={unit === option}>{option}</UnitLabel>
                            </UnitOption>
                          ))}
                        </UnitOptions>
                      ) : null}
                    </WeightGroup>
                    <Accordion>
                      <AccordionHeader accessibilityRole="button" accessibilityState={{ expanded: isCategoryOpen }} disabled={busy} onPress={toggleCategoryOptions}>
                        <AccordionLabel>Categoria</AccordionLabel><CategoryChevron expanded={isCategoryOpen} />
                      </AccordionHeader>
                      <AnimatedDropdown open={isCategoryOpen}>
                        <CategoryOptions>
                          {PRODUCT_CATEGORIES.map((option) => (
                            <CategoryTag key={option} category={option} disabled={busy} onSelectionChange={(selected) => { setCategory(selected ? option : null); clearError(); }} selected={category === option} variant="product" />
                          ))}
                        </CategoryOptions>
                      </AnimatedDropdown>
                    </Accordion>
                  </Fields>
                ) : null}

                {isCheckout ? (
                  <CheckoutList>
                    <HelpText>Informe o preço por unidade de cada produto marcado. Eles serão adicionados à despensa ao finalizar.</HelpText>
                    {checkedItems.map((item) => (
                      <CheckoutItem key={item.id}>
                        <CheckoutItemName numberOfLines={1}>{item.name}</CheckoutItemName>
                        <CheckoutItemMeta>{item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}</CheckoutItemMeta>
                        <FormField
                          accessibilityLabel={`Preço unitário de ${item.name}`}
                          editable={!busy}
                          Icon={DeliveryIcon}
                          inputMode="decimal"
                          keyboardType="decimal-pad"
                          maxLength={16}
                          onChangeText={(value) => { setPrices((current) => ({ ...current, [item.id]: value })); clearError(); }}
                          placeholder="Preço por unidade (R$) *"
                          value={prices[item.id] ?? ''}
                        />
                      </CheckoutItem>
                    ))}
                  </CheckoutList>
                ) : null}

                {mode === 'filter' ? (
                  <FilterSection>
                    <FilterSectionTitle><FilterSectionLabel>Ordenar por:</FilterSectionLabel></FilterSectionTitle>
                    <SortOptions accessibilityRole="radiogroup">
                      {SORT_OPTIONS.map((option) => (
                        <SortOption
                          key={option.key}
                          accessibilityLabel={option.disabled ? `${option.label}, indisponível` : option.label}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selectedSort === option.key, disabled: option.disabled || busy }}
                          disabled={option.disabled || busy}
                          onPress={() => { if (!option.disabled) setSelectedSort(option.key); }}
                          $selected={selectedSort === option.key}
                        >
                          <SortOptionLabel>{option.label}</SortOptionLabel>
                        </SortOption>
                      ))}
                    </SortOptions>
                    <HelpText>Ordenação por preço ficará disponível quando os valores dos itens forem integrados.</HelpText>
                  </FilterSection>
                ) : null}

                {error && !isListForm ? <ErrorText accessibilityRole="alert">{error}</ErrorText> : null}

                {mode === 'settings' && list?.status === 'active' ? (
                  <Fields>
                    <CompactAction accessibilityRole="button" disabled={busy} onPress={onStartCheckout} $tone="complete">
                      <CompactActionLabel $tone="complete">Finalizar lista e adicionar à despensa</CompactActionLabel>
                    </CompactAction>
                    <CompactAction accessibilityRole="button" disabled={busy} onPress={confirmDelete} $tone="danger">
                      <CompactActionLabel $tone="danger">Excluir Lista de Compras</CompactActionLabel>
                    </CompactAction>
                  </Fields>
                ) : null}
                {isFinished ? (
                  <CompactAction accessibilityRole="button" disabled={busy} onPress={onRepeat} $tone="complete">
                    <CompactActionLabel $tone="complete">Repetir como nova lista</CompactActionLabel>
                  </CompactAction>
                ) : null}

                <Actions>
                  <ModalActionButton accessibilityLabel="Fechar" disabled={busy} Icon={CancelCircleIcon} onPress={onRequestClose} variant="cancel" />
                  {!isFinished ? <ModalActionButton accessibilityLabel="Confirmar" disabled={busy} Icon={CheckIcon} onPress={submit} variant="confirm" /> : null}
                </Actions>
              </Content>
            </Body>
          </Card>
        </Overlay>
      </KeyboardFrame>
    </Modal>
  );
}

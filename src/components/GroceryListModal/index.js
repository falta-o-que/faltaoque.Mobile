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
  LocationIcon,
  PenIcon,
  ShoppingListIcon,
} from '../../assets/icons/export';
import { isTodayOrFutureDate, normalizeDateOnly } from '../../domain/dateValidation';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { ProductCartIcon } from '../AddProductModal/icons';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import CategoryTag from '../CategoryTag';
import AnimatedDropdown from '../AnimatedDropdown';
import DangerActionButton from '../DangerActionButton';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
import PlaceSearchField from '../PlaceSearchField';
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
  { key: 'nameAsc', labelKey: 'shopping.sortNameAsc' },
  { key: 'nameDesc', labelKey: 'shopping.sortNameDesc' },
  { key: 'priceAsc', labelKey: 'shopping.sortPriceAsc', disabled: true },
  { key: 'priceDesc', labelKey: 'shopping.sortPriceDesc', disabled: true },
  { key: 'quantityDesc', labelKey: 'shopping.sortQuantityDesc' },
];

const dateToIso = (value) => value ? normalizeDateOnly(value) : null;
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
  const [marketQuery, setMarketQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [selectedSort, setSelectedSort] = useState(null);
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');
  const { t } = useAppPreferences();

  useEffect(() => {
    if (!visible) return;
    setName(mode === 'settings' || mode === 'repeat' ? list?.name ?? '' : mode === 'editItem' ? item?.name ?? '' : '');
    setPlannedDate(mode === 'settings' ? dateToBr(list?.plannedDate) : '');
    const existingMarket = mode === 'settings' || mode === 'repeat' ? list?.market ?? null : null;
    setSelectedMarket(existingMarket);
    setMarketQuery(existingMarket?.localName ?? '');
    setQuantity(mode === 'editItem' ? String(item?.quantity ?? 1) : '1');
    setWeight(mode === 'editItem' && item?.weight != null ? String(item.weight).replace('.', ',') : '');
    setUnit(mode === 'editItem' ? item?.unit ?? '' : '');
    setCategory(mode === 'editItem' ? item?.category ?? null : null);
    setIsCategoryOpen(true);
    setSelectedSort(sortOption ?? null);
    setPrices({});
    setError('');
  }, [visible, mode, list?.id, item?.id, sortOption]);

  if (!mode) return null;

  const checkedItems = list?.items?.filter((item) => item.checked) ?? [];
  const isListForm = mode === 'create' || mode === 'settings' || mode === 'repeat';
  const isItemForm = mode === 'item' || mode === 'editItem';
  const isCheckout = mode === 'checkout';
  const isFinished = mode === 'settings' && list?.status === 'finished';
  const title = mode === 'create' ? t('shopping.createList')
    : mode === 'repeat' ? t('shopping.repeatListTitle')
    : mode === 'item' ? t('shopping.addProducts')
      : mode === 'editItem' ? t('shopping.editProduct')
      : mode === 'settings' ? t('shopping.editList')
        : isCheckout ? t('shopping.finishPurchase') : t('shopping.filters');
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
      if (!cleanName) return setError(t('shoppingModal.listNameError'));
      if (plannedDate && !isTodayOrFutureDate(plannedDate)) {
        return setError(t('shoppingModal.dateError'));
      }
      if (marketQuery.trim() && !selectedMarket) return setError(t('shoppingModal.marketError'));
      const draft = { name: cleanName, plannedDate: dateToIso(plannedDate), location: selectedMarket?.cep ?? null, market: selectedMarket };
      if (mode === 'repeat') return onRepeat(draft);
      return mode === 'create' ? onCreate(draft) : onUpdate(draft);
    }
    if (isItemForm) {
      if (!cleanName) return setError(t('shoppingModal.productNameError'));
      if (!/^\d+$/.test(quantity) || Number(quantity) < 1) return setError(t('shoppingModal.quantityError'));
      const hasWeight = weight.trim() !== '';
      const normalizedWeight = Number(weight.replace(',', '.'));
      if (hasWeight && (!(normalizedWeight > 0) || !Number.isFinite(normalizedWeight))) return setError(t('shoppingModal.weightError'));
      if (hasWeight && !PRODUCT_UNITS.includes(unit)) return setError(t('shoppingModal.unitError'));
      if (!category) return setError(t('shoppingModal.categoryRequired'));
      if (!PRODUCT_CATEGORIES.includes(category)) return setError(t('shoppingModal.categoryError'));
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
      if (!checkedItems.length) return setError(t('shoppingModal.checkoutEmpty'));
      const parsedPrices = {};
      for (const item of checkedItems) {
        const price = parseBrl(prices[item.id]);
        if (!(price > 0) || !Number.isSafeInteger(Math.round(price * 100))) {
          return setError(t('shoppingModal.priceError', { name: item.name }));
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
    t('shoppingModal.deleteTitle'),
    t('shoppingModal.deleteMessage'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('shopping.remove'), style: 'destructive', onPress: onDelete },
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
                      accessibilityLabel={t('shopping.listNameRequired')}
                      autoCapitalize="sentences"
                      editable={!busy && !isFinished}
                      error={error.toLowerCase().includes('nome') ? error : undefined}
                      Icon={PenIcon}
                      maxLength={100}
                      onChangeText={(value) => { setName(value); clearError(); }}
                      placeholder={t('shopping.nameRequired')}
                      value={name}
                    />
                    <FormField
                      accessibilityLabel={t('shopping.plannedDate')}
                      editable={!busy && !isFinished}
                      error={error.toLowerCase().includes('data') ? error : undefined}
                      Icon={CalendarIcon}
                      inputMode="numeric"
                      keyboardType="number-pad"
                      maxLength={10}
                      onChangeText={handleDateChange}
                      placeholder={t('shopping.plannedDateFormat')}
                      value={plannedDate}
                    />
                    <PlaceSearchField
                      value={marketQuery}
                      selected={Boolean(selectedMarket)}
                      selectedPlace={selectedMarket}
                      disabled={busy || isFinished}
                      error={error.includes('mercado') ? error : undefined}
                      Icon={LocationIcon}
                      placeholder={t('shopping.purchaseMarketOptional')}
                      onChangeText={(value) => { setMarketQuery(value); setSelectedMarket(null); clearError(); }}
                      onSelect={(market) => { setSelectedMarket(market); setMarketQuery(market.displayName); clearError(); }}
                    />
                    {mode === 'settings' && selectedMarket && !isFinished ? (
                      <CompactAction accessibilityRole="button" disabled={busy} onPress={() => { setSelectedMarket(null); setMarketQuery(''); clearError(); }} $tone="danger">
                        <CompactActionLabel $tone="danger">{t('shopping.removeMarket')}</CompactActionLabel>
                      </CompactAction>
                    ) : null}
                  </Fields>
                ) : null}

                {isItemForm ? (
                  <Fields>
                    <FormField accessibilityLabel={t('shopping.productNameRequired')} autoCapitalize="sentences" editable={!busy} Icon={PenIcon} maxLength={120} onChangeText={(value) => { setName(value); clearError(); }} placeholder={t('shopping.nameRequired')} value={name} />
                    <FormField accessibilityLabel={t('shopping.quantityRequiredLabel')} editable={!busy} Icon={DeliveryIcon} inputMode="numeric" keyboardType="number-pad" maxLength={5} onChangeText={(value) => { setQuantity(value.replace(/\D/g, '')); clearError(); }} placeholder={t('shopping.quantityRequired', { unit: '' })} value={quantity} />
                    <WeightGroup>
                      <FormField
                        accessibilityLabel={t('shoppingModal.weightA11y')}
                        editable={!busy}
                        Icon={BoxIcon}
                        inputMode="decimal"
                        keyboardType="decimal-pad"
                        maxLength={16}
                        onChangeText={(value) => { setWeight(value); if (!value.trim()) setUnit(''); clearError(); }}
                        placeholder={t('shopping.weightOptional')}
                        value={weight}
                      />
                      {weight.trim() ? (
                        <WeightGroup>
                          <AccordionLabel>{t('shopping.requiredUnit')}</AccordionLabel>
                          <UnitOptions accessibilityRole="radiogroup">
                          {PRODUCT_UNITS.map((option) => (
                            <UnitOption key={option} accessibilityLabel={t('shopping.unitRequired', { unit: option })} accessibilityRole="radio" accessibilityState={{ checked: unit === option }} disabled={busy} onPress={() => { setUnit(option); clearError(); }} $selected={unit === option}>
                              <UnitLabel $selected={unit === option}>{option}</UnitLabel>
                            </UnitOption>
                          ))}
                          </UnitOptions>
                        </WeightGroup>
                      ) : null}
                    </WeightGroup>
                    <Accordion>
                      <AccordionHeader accessibilityRole="button" accessibilityState={{ expanded: isCategoryOpen }} disabled={busy} onPress={toggleCategoryOptions}>
                      <AccordionLabel>{t('shopping.requiredCategory')}</AccordionLabel><CategoryChevron expanded={isCategoryOpen} />
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
                    <HelpText>{t('shopping.checkoutPriceHelp')}</HelpText>
                    {checkedItems.map((item) => (
                      <CheckoutItem key={item.id}>
                        <CheckoutItemName numberOfLines={1}>{item.name}</CheckoutItemName>
                        <CheckoutItemMeta>{t(item.quantity === 1 ? 'shopping.unitOne' : 'shopping.unitMany', { count: item.quantity })}</CheckoutItemMeta>
                        <FormField
                          accessibilityLabel={t('shoppingModal.unitPriceA11y', { name: item.name })}
                          editable={!busy}
                          Icon={DeliveryIcon}
                          inputMode="decimal"
                          keyboardType="decimal-pad"
                          maxLength={16}
                          onChangeText={(value) => { setPrices((current) => ({ ...current, [item.id]: value })); clearError(); }}
                          placeholder={t('shopping.unitPrice', { unit: t('shopping.unitLabel') })}
                          value={prices[item.id] ?? ''}
                        />
                      </CheckoutItem>
                    ))}
                  </CheckoutList>
                ) : null}

                {mode === 'filter' ? (
                  <FilterSection>
                    <FilterSectionTitle><FilterSectionLabel>{t('shopping.sortBy')}</FilterSectionLabel></FilterSectionTitle>
                    <SortOptions accessibilityRole="radiogroup">
                      {SORT_OPTIONS.map((option) => {
                        const optionLabel = t(option.labelKey);
                        return (
                        <SortOption
                          key={option.key}
                          accessibilityLabel={option.disabled ? `${optionLabel}, ${t('shopping.unavailable')}` : optionLabel}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selectedSort === option.key, disabled: option.disabled || busy }}
                          disabled={option.disabled || busy}
                          onPress={() => { if (!option.disabled) setSelectedSort(option.key); }}
                          $selected={selectedSort === option.key}
                        >
                          <SortOptionLabel>{optionLabel}</SortOptionLabel>
                        </SortOption>
                        );
                      })}
                    </SortOptions>
                  </FilterSection>
                ) : null}

                {error && !isListForm ? <ErrorText accessibilityRole="alert">{error}</ErrorText> : null}

                {mode === 'settings' && list?.status === 'active' ? (
                  <Fields>
                    <CompactAction accessibilityRole="button" disabled={busy} onPress={onStartCheckout} $tone="complete">
                      <CompactActionLabel $tone="complete">{t('shoppingModal.finishAndAdd')}</CompactActionLabel>
                    </CompactAction>
                    <DangerActionButton disabled={busy} onPress={confirmDelete} text={t('shoppingModal.deleteList')} />
                  </Fields>
                ) : null}
                {isFinished ? (
                  <CompactAction accessibilityRole="button" disabled={busy} onPress={onRepeat} $tone="complete">
                    <CompactActionLabel $tone="complete">{t('shopping.repeatAsNew')}</CompactActionLabel>
                  </CompactAction>
                ) : null}

                <Actions>
                  <ModalActionButton accessibilityLabel={t('common.close')} disabled={busy} Icon={CancelCircleIcon} onPress={onRequestClose} variant="cancel" />
                  {!isFinished ? <ModalActionButton accessibilityLabel={t('common.confirm')} disabled={busy} Icon={CheckIcon} onPress={submit} variant="confirm" /> : null}
                </Actions>
              </Content>
            </Body>
          </Card>
        </Overlay>
      </KeyboardFrame>
    </Modal>
  );
}

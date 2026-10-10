import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform } from 'react-native';

import {
  AngleIcon,
  BoxIcon,
  CalendarIcon,
  CancelCircleIcon,
  CheckIcon,
  DeliveryIcon,
  LocationIcon,
  PenIcon,
} from '../../assets/icons/export';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_PRICE_TYPES,
  PRODUCT_UNITS,
  validateProduct,
} from '../../domain/productValidation';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import CategoryTag from '../CategoryTag';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
import PlaceSearchField from '../PlaceSearchField';
import { ProductCartIcon } from './icons';
import {
  Accordion,
  AccordionHeader,
  AccordionLabel,
  Actions,
  BusyIndicator,
  BusyStatus,
  BusyText,
  Card,
  CategoryOptions,
  Chevron,
  Content,
  Fields,
  FormContent,
  Header,
  Heading,
  InlineError,
  Overlay,
  ProductName,
  PriceTypeLabel,
  PriceTypeOption,
  PriceTypeOptions,
  Scroller,
  SubmitError,
  TitleGroup,
  UnitLabel,
  UnitOption,
  UnitOptions,
  WeightGroup,
} from './styles';

const EMPTY_DRAFT = {
  name: '',
  brand: '',
  price: '',
  priceType: 'unit',
  quantity: '',
  expirationDate: '',
  weight: '',
  unit: '',
  category: null,
  location: '',
};

const PRODUCT_ERROR_KEYS = {
  'Informe o nome do produto.': 'product.add.validationName',
  'O nome do produto deve ter até 100 caracteres.': 'product.add.validationNameLength',
  'A marca deve ter até 100 caracteres.': 'product.add.validationBrand',
  'Informe um preço positivo com até duas casas decimais.': 'product.add.validationPrice',
  'Escolha como o preço foi informado.': 'product.add.validationPriceType',
  'Informe uma quantidade inteira maior que zero.': 'product.add.validationQuantity',
  'O valor total é muito alto.': 'product.add.validationTotal',
  'Informe um peso ou volume maior que zero.': 'product.add.validationWeight',
  'Escolha a unidade de medida.': 'product.add.validationUnit',
  'Escolha uma categoria.': 'product.add.validationCategory',
  'Informe uma data válida no formato DD/MM/AAAA.': 'product.add.validationExpiration',
  'A validade deve ser hoje ou uma data futura.': 'product.add.validationExpirationFuture',
  'Selecione um mercado válido nas sugestões do Google ou limpe o campo.': 'product.add.validationMarket',
};

export function AddProductModal({ onCreate, onRequestClose, visible }) {
  const { t } = useAppPreferences();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [shouldRenderCategoryOptions, setShouldRenderCategoryOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const categoryMenuProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setDraft(EMPTY_DRAFT);
      setSelectedMarket(null);
      setErrors({});
      setIsCategoryOpen(false);
      setShouldRenderCategoryOptions(false);
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (isCategoryOpen) {
      setShouldRenderCategoryOptions(true);
    }
  }, [isCategoryOpen]);

  useEffect(() => {
    if (!shouldRenderCategoryOptions) {
      return undefined;
    }

    const animation = Animated.timing(categoryMenuProgress, {
      toValue: isCategoryOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !isCategoryOpen) {
        setShouldRenderCategoryOptions(false);
      }
    });

    return () => animation.stop();
  }, [categoryMenuProgress, isCategoryOpen, shouldRenderCategoryOptions]);

  function updateField(field, value) {
    if (field === 'location') setSelectedMarket(null);
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      submit: undefined,
    }));
  }

  function handleWeightChange(value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      weight: value,
      unit: value.trim() ? currentDraft.unit : '',
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      weight: undefined,
      unit: value.trim() ? currentErrors.unit : undefined,
      submit: undefined,
    }));
  }

  function handleExpirationDateChange(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4
      ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
      : digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    updateField('expirationDate', formatted);
  }

  function handleClose() {
    if (!submittingRef.current) {
      onRequestClose();
    }
  }

  async function handleConfirm() {
    if (submittingRef.current) {
      return;
    }

    const nextErrors = validateProduct(draft);
    if (draft.location.trim() && !selectedMarket) nextErrors.location = 'Selecione um mercado válido nas sugestões do Google ou limpe o campo.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onCreate({ ...draft, location: selectedMarket?.cep ?? null, market: selectedMarket });
    } catch (error) {
      const fieldErrors = error?.fields && typeof error.fields === 'object'
        ? error.fields
        : {};
      setErrors((currentErrors) => ({
        ...currentErrors,
        ...fieldErrors,
        submit: t('product.add.submitError'),
      }));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const hasWeight = draft.weight.trim() !== '';
  const displayErrors = Object.fromEntries(Object.entries(errors).map(([field, message]) => [field, PRODUCT_ERROR_KEYS[message] ? t(PRODUCT_ERROR_KEYS[message]) : message]));
  const categoryPanelStyle = {
    opacity: categoryMenuProgress,
    transform: [
      {
        scaleY: categoryMenuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
      {
        translateY: categoryMenuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
  };
  const categoryChevronStyle = {
    transform: [{
      rotate: categoryMenuProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <Overlay
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Card>
          <Scroller
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Content>
              <TitleGroup>
                <Header>
                  <ProductCartIcon size={24} />
                  <Heading>{t('product.add.heading')}</Heading>
                </Header>
              <ProductName>{draft.name.trim() || t('product.add.title')}</ProductName>
              </TitleGroup>

              <FormContent>
                <Fields>
                  <FormField
                  accessibilityLabel={t('product.add.nameA11y')}
                  autoCapitalize="sentences"
                  editable={!isSubmitting}
                  error={displayErrors.name}
                  Icon={PenIcon}
                  maxLength={120}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder={t('product.add.namePlaceholder')}
                  returnKeyType="next"
                  value={draft.name}
                />
                  <FormField
                    accessibilityLabel={t('product.add.brandA11y')}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                    error={displayErrors.brand}
                    Icon={PenIcon}
                    maxLength={100}
                    onChangeText={(value) => updateField('brand', value)}
                    placeholder={t('product.add.brandPlaceholder')}
                    value={draft.brand}
                  />
                  <PriceTypeOptions accessibilityRole="radiogroup">
                    {PRODUCT_PRICE_TYPES.map((priceType) => (
                      <PriceTypeOption
                        key={priceType}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: draft.priceType === priceType }}
                        disabled={isSubmitting}
                        onPress={() => updateField('priceType', priceType)}
                        $selected={draft.priceType === priceType}
                      >
                        <PriceTypeLabel $selected={draft.priceType === priceType}>
                          {t(priceType === 'unit' ? 'product.add.priceUnit' : 'product.add.priceTotal')}
                        </PriceTypeLabel>
                      </PriceTypeOption>
                    ))}
                  </PriceTypeOptions>
                  <FormField
                  accessibilityLabel={t(draft.priceType === 'total' ? 'product.add.priceTotalA11y' : 'product.add.priceUnitA11y')}
                  editable={!isSubmitting}
                  error={displayErrors.price}
                  Icon={DeliveryIcon}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  maxLength={16}
                  onChangeText={(value) => updateField('price', value)}
                  placeholder={t(draft.priceType === 'total' ? 'product.add.priceTotalPlaceholder' : 'product.add.priceUnitPlaceholder')}
                  value={draft.price}
                />
                  <FormField
                  accessibilityLabel={t('product.add.quantityA11y')}
                  editable={!isSubmitting}
                  error={displayErrors.quantity}
                  Icon={DeliveryIcon}
                  inputMode="numeric"
                  keyboardType="number-pad"
                  maxLength={9}
                  onChangeText={(value) => updateField('quantity', value)}
                  placeholder={t('product.add.quantityPlaceholder')}
                  value={draft.quantity}
                  />
                  <PlaceSearchField
                    value={draft.location}
                    selected={Boolean(selectedMarket)}
                    selectedPlace={selectedMarket}
                    disabled={isSubmitting}
                    error={displayErrors.location}
                    Icon={LocationIcon}
                    placeholder={t('product.add.marketPlaceholder')}
                    onChangeText={(value) => updateField('location', value)}
                    onSelect={(market) => {
                      setSelectedMarket(market);
                      setDraft((current) => ({ ...current, location: market.displayName }));
                      setErrors((current) => ({ ...current, location: undefined, submit: undefined }));
                    }}
                  />
                  <FormField
                    accessibilityLabel={t('product.add.expirationA11y')}
                    editable={!isSubmitting}
                    error={displayErrors.expirationDate}
                    Icon={CalendarIcon}
                    inputMode="numeric"
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    onChangeText={handleExpirationDateChange}
                    placeholder={t('product.add.expirationPlaceholder')}
                    value={draft.expirationDate}
                  />
                  <WeightGroup>
                    <FormField
                    accessibilityLabel={t('product.add.weightA11y')}
                    editable={!isSubmitting}
                    error={displayErrors.weight}
                    Icon={BoxIcon}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    maxLength={16}
                    onChangeText={handleWeightChange}
                    placeholder={t('product.add.weightPlaceholder')}
                    value={draft.weight}
                  />
                  {hasWeight ? (
                    <WeightGroup>
                      <AccordionLabel>{t('product.add.unitRequired')}</AccordionLabel>
                      <UnitOptions accessibilityRole="radiogroup">
                        {PRODUCT_UNITS.map((unit) => (
                          <UnitOption
                            key={unit}
                            accessibilityLabel={t('product.add.unitA11y', { unit })}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: draft.unit === unit }}
                            disabled={isSubmitting}
                            onPress={() => updateField('unit', unit)}
                            $selected={draft.unit === unit}
                          >
                            <UnitLabel $selected={draft.unit === unit}>{unit}</UnitLabel>
                          </UnitOption>
                        ))}
                      </UnitOptions>
                      {displayErrors.unit ? (
                        <InlineError accessibilityLiveRegion="polite">{displayErrors.unit}</InlineError>
                      ) : null}
                    </WeightGroup>
                  ) : null}
                  </WeightGroup>
                </Fields>

                <Accordion>
                  <AccordionHeader
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSubmitting, expanded: isCategoryOpen }}
                  disabled={isSubmitting}
                  onPress={() => setIsCategoryOpen((currentValue) => !currentValue)}
                  $hasError={Boolean(errors.category)}
                >
                  <AccordionLabel>{t('product.add.categoryRequired')}</AccordionLabel>
                  <Chevron style={categoryChevronStyle}>
                    <AngleIcon />
                  </Chevron>
                </AccordionHeader>
                {shouldRenderCategoryOptions ? (
                  <CategoryOptions $disabled={isSubmitting} style={categoryPanelStyle}>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <CategoryTag
                        key={category}
                        category={category}
                        disabled={isSubmitting}
                        onSelectionChange={(selected) =>
                          updateField('category', selected ? category : null)
                        }
                        selected={draft.category === category}
                        variant="product"
                      />
                    ))}
                  </CategoryOptions>
                ) : null}
                {displayErrors.category ? (
                  <InlineError accessibilityLiveRegion="polite">{displayErrors.category}</InlineError>
                ) : null}
                </Accordion>
              </FormContent>

                {displayErrors.submit ? (
                  <SubmitError accessibilityLiveRegion="polite" accessibilityRole="alert">{displayErrors.submit}</SubmitError>
              ) : null}

              {isSubmitting ? (
                <BusyStatus accessibilityLiveRegion="polite">
                  <BusyIndicator />
                  <BusyText>{t('product.add.saving')}</BusyText>
                </BusyStatus>
              ) : null}

              <Actions>
                <ModalActionButton
                  accessibilityLabel={t('product.add.cancelA11y')}
                  disabled={isSubmitting}
                  Icon={CancelCircleIcon}
                  onPress={handleClose}
                  variant="cancel"
                />
                <ModalActionButton
                  accessibilityLabel={t('product.add.submitA11y')}
                  disabled={isSubmitting}
                  Icon={CheckIcon}
                  onPress={handleConfirm}
                  variant="confirm"
                />
              </Actions>
            </Content>
          </Scroller>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default AddProductModal;

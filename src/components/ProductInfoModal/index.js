import { useEffect, useRef, useState } from 'react';
import { Easing, Animated, Modal, Platform } from 'react-native';

import { AngleIcon, BoxIcon, CalendarIcon, CancelCircleIcon, CheckIcon, DeliveryIcon, InfoIcon, PenIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_PRICE_TYPES, PRODUCT_UNITS, validateProduct } from '../../domain/productValidation';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import CategoryTag, { CATEGORY_LABELS } from '../CategoryTag';
import DangerActionButton from '../DangerActionButton';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
import {
  Accordion, AccordionHeader, AccordionLabel, Actions, BusyIndicator, BusyStatus, BusyText,
  Card, CategoryOptions, Chevron, Content, DetailLabel, DetailRow, DetailValue, Fields,
  FormContent, Header, Heading, InlineError, Overlay, PriceTypeLabel, PriceTypeOption, PriceTypeOptions, ProductName, ReadonlyPanel, Scroller,
  SubmitError, TitleGroup, UnitLabel, UnitOption, UnitOptions, WeightGroup,
} from './styles';

const EMPTY_DRAFT = { name: '', brand: '', price: '', priceType: 'unit', quantity: '', expirationDate: '', weight: '', unit: '', category: null };

const formatPrice = (value, language) => Number.isFinite(Number(value)) ? new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }).format(Number(value)) : '—';

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
};

function toDraft(product = {}) {
  const expirationDate = product.expirationDate ?? '';
  const formattedExpiration = /^\d{4}-\d{2}-\d{2}$/.test(expirationDate)
    ? `${expirationDate.slice(8)}/${expirationDate.slice(5, 7)}/${expirationDate.slice(0, 4)}`
    : expirationDate;
  return {
    name: String(product.name ?? ''),
    brand: String(product.brand ?? ''),
    priceType: product.priceType === 'total' ? 'total' : 'unit',
    price: String(product.priceType === 'total' ? product.totalPrice ?? '' : product.unitPrice ?? ''),
    quantity: String(product.quantity ?? ''),
    expirationDate: formattedExpiration,
    weight: product.weight == null ? '' : String(product.weight),
    unit: product.unit ?? '',
    category: product.category ?? null,
  };
}

export function ProductInfoModal({ visible, product, onDelete, onRequestClose, onSave }) {
  const { language, t } = useAppPreferences();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [originalDraft, setOriginalDraft] = useState(EMPTY_DRAFT);
  const [isEditing, setIsEditing] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const categoryProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const next = toDraft(product);
      setDraft(next); setOriginalDraft(next); setIsEditing(false); setErrors({}); setIsCategoryOpen(false);
    } else {
      setIsEditing(false); setIsCategoryOpen(false); setErrors({}); setIsSubmitting(false); submittingRef.current = false;
    }
  }, [visible, product]);

  useEffect(() => {
    Animated.timing(categoryProgress, { toValue: isCategoryOpen ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [categoryProgress, isCategoryOpen]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  }

  function handleExpiration(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    updateField('expirationDate', formatted);
  }

  function handleCancel() {
    if (submittingRef.current) return;
    if (isEditing) { setDraft(originalDraft); setErrors({}); setIsEditing(false); setIsCategoryOpen(false); return; }
    onRequestClose?.();
  }

  async function handleSave() {
    if (submittingRef.current) return;
    const nextErrors = validateProduct(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submittingRef.current = true; setIsSubmitting(true);
    try { await onSave?.({ ...draft }); setOriginalDraft({ ...draft }); setIsEditing(false); setIsCategoryOpen(false); }
    catch (error) { setErrors({ ...(error?.fields ?? {}), submit: t('product.add.submitError') }); }
    finally { submittingRef.current = false; setIsSubmitting(false); }
  }

  const categoryKey = CATEGORY_LABELS[draft.category] ? draft.category : 'organicos';
  const displayErrors = Object.fromEntries(Object.entries(errors).map(([field, message]) => [field, PRODUCT_ERROR_KEYS[message] ? t(PRODUCT_ERROR_KEYS[message]) : message]));
  const categoryPanelStyle = { opacity: categoryProgress, transform: [{ scaleY: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateY: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] };
  const categoryChevronStyle = { transform: [{ rotate: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] };
  const details = [
    ['product.info.unitPrice', formatPrice(product?.unitPrice, language)],
    ['product.info.totalPrice', formatPrice(product?.totalPrice, language)],
    ['product.info.brand', draft.brand || t('product.info.noBrand')],
    ['product.info.quantity', draft.quantity || '—'],
    ['product.info.expiration', draft.expirationDate || t('product.info.noExpiration')],
    ['product.info.weight', [draft.weight, draft.unit].filter(Boolean).join(' ') || '—'],
    ['product.info.category', draft.category ? t(`product.category.${categoryKey}`) : '—'],
  ];

  return (
    <Modal animationType="fade" onRequestClose={handleCancel} transparent visible={visible}>
      <Overlay behavior={Platform.OS === 'ios' ? 'padding' : 'height'} accessibilityViewIsModal>
        <Card><Scroller bounces={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Content>
          <TitleGroup><Header><InfoIcon size={24} /><Heading>{isEditing ? t('product.info.edit') : t('product.info.title')}</Heading></Header><ProductName>{draft.name.trim() || t('product.info.fallback')}</ProductName></TitleGroup>
            {!isEditing ? <ReadonlyPanel>{details.map(([labelKey, value]) => <DetailRow key={labelKey}><DetailLabel>{t(labelKey)}</DetailLabel><DetailValue>{value}</DetailValue></DetailRow>)}</ReadonlyPanel> : (
              <FormContent><Fields>
                <FormField accessibilityLabel={t('product.add.nameA11y')} autoCapitalize="sentences" editable={!isSubmitting} error={displayErrors.name} Icon={PenIcon} maxLength={120} onChangeText={(value) => updateField('name', value)} placeholder={t('product.add.namePlaceholder')} value={draft.name} />
                <FormField accessibilityLabel={t('product.add.brandA11y')} autoCapitalize="words" editable={!isSubmitting} error={displayErrors.brand} Icon={PenIcon} maxLength={100} onChangeText={(value) => updateField('brand', value)} placeholder={t('product.add.brandPlaceholder')} value={draft.brand} />
                <PriceTypeOptions accessibilityRole="radiogroup">{PRODUCT_PRICE_TYPES.map((priceType) => <PriceTypeOption key={priceType} accessibilityRole="radio" accessibilityState={{ checked: draft.priceType === priceType }} disabled={isSubmitting} onPress={() => updateField('priceType', priceType)} $selected={draft.priceType === priceType}><PriceTypeLabel $selected={draft.priceType === priceType}>{t(priceType === 'unit' ? 'product.add.priceUnit' : 'product.add.priceTotal')}</PriceTypeLabel></PriceTypeOption>)}</PriceTypeOptions>
                <FormField accessibilityLabel={t(draft.priceType === 'total' ? 'product.info.priceTotalA11y' : 'product.info.priceUnitA11y')} editable={!isSubmitting} error={displayErrors.price} Icon={DeliveryIcon} keyboardType="decimal-pad" onChangeText={(value) => updateField('price', value)} placeholder={t(draft.priceType === 'total' ? 'product.add.priceTotalPlaceholder' : 'product.add.priceUnitPlaceholder')} value={draft.price} />
                <FormField accessibilityLabel={t('product.add.quantityA11y')} editable={!isSubmitting} error={displayErrors.quantity} Icon={DeliveryIcon} keyboardType="number-pad" onChangeText={(value) => updateField('quantity', value)} placeholder={t('product.add.quantityPlaceholder')} value={draft.quantity} />
                <FormField accessibilityLabel={t('product.add.expirationA11y')} editable={!isSubmitting} error={displayErrors.expirationDate} Icon={CalendarIcon} keyboardType="numbers-and-punctuation" maxLength={10} onChangeText={handleExpiration} placeholder={t('product.add.expirationPlaceholder')} value={draft.expirationDate} />
                <WeightGroup><FormField accessibilityLabel={t('product.add.weightA11y')} editable={!isSubmitting} error={displayErrors.weight} Icon={BoxIcon} keyboardType="decimal-pad" onChangeText={(value) => updateField('weight', value)} placeholder={t('product.add.weightPlaceholder')} value={draft.weight} />{draft.weight.trim() ? <><AccordionLabel>{t('product.add.unitRequired')}</AccordionLabel><UnitOptions accessibilityRole="radiogroup">{PRODUCT_UNITS.map((unit) => <UnitOption key={unit} accessibilityLabel={t('product.add.unitA11y', { unit })} accessibilityRole="radio" accessibilityState={{ checked: draft.unit === unit }} disabled={isSubmitting} onPress={() => updateField('unit', unit)} $selected={draft.unit === unit}><UnitLabel $selected={draft.unit === unit}>{unit}</UnitLabel></UnitOption>)}</UnitOptions>{displayErrors.unit ? <InlineError>{displayErrors.unit}</InlineError> : null}</> : null}</WeightGroup>
              </Fields><Accordion><AccordionHeader disabled={isSubmitting} onPress={() => setIsCategoryOpen((open) => !open)} $hasError={Boolean(errors.category)}><AccordionLabel>{t('product.add.categoryRequired')}</AccordionLabel><Chevron style={categoryChevronStyle}><AngleIcon /></Chevron></AccordionHeader>{isCategoryOpen ? <CategoryOptions style={categoryPanelStyle}>{PRODUCT_CATEGORIES.map((category) => <CategoryTag key={category} category={category} disabled={isSubmitting} onSelectionChange={(selected) => updateField('category', selected ? category : null)} selected={draft.category === category} variant="product" />)}</CategoryOptions> : null}{displayErrors.category ? <InlineError>{displayErrors.category}</InlineError> : null}</Accordion></FormContent>
            )}
            {displayErrors.submit ? <SubmitError accessibilityLiveRegion="polite" accessibilityRole="alert">{displayErrors.submit}</SubmitError> : null}{isSubmitting ? <BusyStatus><BusyIndicator /><BusyText>{t('product.add.saving')}</BusyText></BusyStatus> : null}
            {!isEditing ? <DangerActionButton accessibilityLabel={t('product.info.delete')} disabled={isSubmitting} onPress={onDelete} text={t('product.info.delete')} /> : null}
            <Actions><ModalActionButton accessibilityLabel={isEditing ? t('product.info.cancelEdit') : t('product.info.close')} disabled={isSubmitting} Icon={CancelCircleIcon} onPress={handleCancel} variant="cancel" /><ModalActionButton accessibilityLabel={isEditing ? t('product.info.save') : t('product.info.editAction')} disabled={isSubmitting} Icon={isEditing ? CheckIcon : PenIcon} onPress={isEditing ? handleSave : () => setIsEditing(true)} variant="confirm" /></Actions>
          </Content>
        </Scroller></Card>
      </Overlay>
    </Modal>
  );
}

export default ProductInfoModal;

import { useEffect, useRef, useState } from 'react';
import { Easing, Animated, Modal, Platform } from 'react-native';

import { AngleIcon, BoxIcon, CancelCircleIcon, CheckIcon, DeliveryIcon, InfoIcon, PenIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_PRICE_TYPES, PRODUCT_UNITS, validateProduct } from '../../domain/productValidation';
import CategoryTag, { CATEGORY_LABELS } from '../CategoryTag';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
import {
  Accordion, AccordionHeader, AccordionLabel, Actions, BusyIndicator, BusyStatus, BusyText,
  Card, CategoryOptions, Chevron, Content, DeleteButton, DeleteLabel, DetailLabel, DetailRow, DetailValue, Fields,
  FormContent, Header, Heading, InlineError, Overlay, PriceTypeLabel, PriceTypeOption, PriceTypeOptions, ProductName, ReadonlyPanel, Scroller,
  SubmitError, TitleGroup, UnitLabel, UnitOption, UnitOptions, WeightGroup,
} from './styles';

const EMPTY_DRAFT = { name: '', price: '', priceType: 'unit', quantity: '', expirationDate: '', weight: '', unit: '', category: null };

const formatPrice = (value) => Number.isFinite(Number(value)) ? `R$ ${Number(value).toFixed(2).replace('.', ',')}` : '—';

function toDraft(product = {}) {
  const expirationDate = product.expirationDate ?? '';
  const formattedExpiration = /^\d{4}-\d{2}-\d{2}$/.test(expirationDate)
    ? `${expirationDate.slice(8)}/${expirationDate.slice(5, 7)}/${expirationDate.slice(0, 4)}`
    : expirationDate;
  return {
    name: String(product.name ?? ''),
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
    catch (error) { setErrors({ ...(error?.fields ?? {}), submit: 'Não foi possível salvar o produto. Tente novamente.' }); }
    finally { submittingRef.current = false; setIsSubmitting(false); }
  }

  const categoryKey = CATEGORY_LABELS[draft.category] ? draft.category : 'organicos';
  const categoryPanelStyle = { opacity: categoryProgress, transform: [{ scaleY: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateY: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] };
  const categoryChevronStyle = { transform: [{ rotate: categoryProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] };
  const details = [
    ['Preço unitário', formatPrice(product?.unitPrice)],
    ['Preço total', formatPrice(product?.totalPrice)],
    ['Quantidade', draft.quantity || '—'],
    ['Validade', draft.expirationDate || 'Sem validade'],
    ['Peso/volume', [draft.weight, draft.unit].filter(Boolean).join(' ') || '—'],
    ['Categoria', draft.category ? CATEGORY_LABELS[categoryKey] : '—'],
  ];

  return (
    <Modal animationType="fade" onRequestClose={handleCancel} transparent visible={visible}>
      <Overlay behavior={Platform.OS === 'ios' ? 'padding' : 'height'} accessibilityViewIsModal>
        <Card><Scroller bounces={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Content>
            <TitleGroup><Header><InfoIcon size={24} /><Heading>{isEditing ? 'Editar produto' : 'Informações do produto'}</Heading></Header><ProductName>{draft.name.trim() || 'Produto'}</ProductName></TitleGroup>
            {!isEditing ? <ReadonlyPanel>{details.map(([label, value]) => <DetailRow key={label}><DetailLabel>{label}</DetailLabel><DetailValue>{value}</DetailValue></DetailRow>)}</ReadonlyPanel> : (
              <FormContent><Fields>
                <FormField accessibilityLabel="Nome do produto, obrigatório" autoCapitalize="sentences" editable={!isSubmitting} error={errors.name} Icon={PenIcon} maxLength={120} onChangeText={(value) => updateField('name', value)} placeholder="Nome *" value={draft.name} />
                <PriceTypeOptions accessibilityRole="radiogroup">{PRODUCT_PRICE_TYPES.map((priceType) => <PriceTypeOption key={priceType} accessibilityRole="radio" accessibilityState={{ checked: draft.priceType === priceType }} disabled={isSubmitting} onPress={() => updateField('priceType', priceType)} $selected={draft.priceType === priceType}><PriceTypeLabel $selected={draft.priceType === priceType}>{priceType === 'unit' ? 'Por unidade' : 'Total do lote'}</PriceTypeLabel></PriceTypeOption>)}</PriceTypeOptions>
                <FormField accessibilityLabel={draft.priceType === 'total' ? 'Preço total do lote, obrigatório' : 'Preço unitário, obrigatório'} editable={!isSubmitting} error={errors.price} Icon={DeliveryIcon} keyboardType="decimal-pad" onChangeText={(value) => updateField('price', value)} placeholder={draft.priceType === 'total' ? 'Total do lote *' : 'Preço por unidade *'} value={draft.price} />
                <FormField accessibilityLabel="Quantidade, obrigatória" editable={!isSubmitting} error={errors.quantity} Icon={DeliveryIcon} keyboardType="number-pad" onChangeText={(value) => updateField('quantity', value)} placeholder="Quantidade *" value={draft.quantity} />
                <FormField accessibilityLabel="Data de validade" editable={!isSubmitting} error={errors.expirationDate} keyboardType="numbers-and-punctuation" maxLength={10} onChangeText={handleExpiration} placeholder="Validade (DD/MM/AAAA)" value={draft.expirationDate} />
                <WeightGroup><FormField accessibilityLabel="Peso ou volume" editable={!isSubmitting} error={errors.weight} Icon={BoxIcon} keyboardType="decimal-pad" onChangeText={(value) => updateField('weight', value)} placeholder="Peso" value={draft.weight} />{draft.weight.trim() ? <><UnitOptions accessibilityRole="radiogroup">{PRODUCT_UNITS.map((unit) => <UnitOption key={unit} accessibilityRole="radio" accessibilityState={{ checked: draft.unit === unit }} disabled={isSubmitting} onPress={() => updateField('unit', unit)} $selected={draft.unit === unit}><UnitLabel $selected={draft.unit === unit}>{unit}</UnitLabel></UnitOption>)}</UnitOptions>{errors.unit ? <InlineError>{errors.unit}</InlineError> : null}</> : null}</WeightGroup>
              </Fields><Accordion><AccordionHeader disabled={isSubmitting} onPress={() => setIsCategoryOpen((open) => !open)} $hasError={Boolean(errors.category)}><AccordionLabel>Categoria *</AccordionLabel><Chevron style={categoryChevronStyle}><AngleIcon /></Chevron></AccordionHeader>{isCategoryOpen ? <CategoryOptions style={categoryPanelStyle}>{PRODUCT_CATEGORIES.map((category) => <CategoryTag key={category} category={category} disabled={isSubmitting} onSelectionChange={(selected) => updateField('category', selected ? category : null)} selected={draft.category === category} variant="product" />)}</CategoryOptions> : null}{errors.category ? <InlineError>{errors.category}</InlineError> : null}</Accordion></FormContent>
            )}
            {errors.submit ? <SubmitError>{errors.submit}</SubmitError> : null}{isSubmitting ? <BusyStatus><BusyIndicator /><BusyText>Salvando...</BusyText></BusyStatus> : null}
            {!isEditing ? <DeleteButton accessibilityLabel="Excluir produto" disabled={isSubmitting} onPress={onDelete}><DeleteLabel>Excluir produto</DeleteLabel></DeleteButton> : null}
            <Actions><ModalActionButton accessibilityLabel={isEditing ? 'Cancelar edição' : 'Fechar informações'} disabled={isSubmitting} Icon={CancelCircleIcon} onPress={handleCancel} variant="cancel" /><ModalActionButton accessibilityLabel={isEditing ? 'Salvar produto' : 'Editar produto'} disabled={isSubmitting} Icon={isEditing ? CheckIcon : PenIcon} onPress={isEditing ? handleSave : () => setIsEditing(true)} variant="confirm" /></Actions>
          </Content>
        </Scroller></Card>
      </Overlay>
    </Modal>
  );
}

export default ProductInfoModal;

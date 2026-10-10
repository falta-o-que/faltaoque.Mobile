import CategoryTag from '../CategoryTag';
import ModalActionButton from '../ModalActionButton';
import FormField from '../FormField';
import { useTheme } from 'styled-components/native';
import { CheckIcon, CancelCircleIcon, PenIcon, DeliveryIcon, InfoIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { UnitOptions, UnitOption, UnitLabel } from '../AddProductModal/styles';
import {
  Card, CardActions, CategoryButton, CategoryButtonText, Editor, EditorTitle, Group, Label,
  Muted, Name, Price, ProductBody, ProductImage, ProductRow, ReceiptLabel,
  EditorError, FieldGroup, Selection, SelectionStatus, SelectionText,
} from './styles';

const currency = (value, pendingLabel = 'Preço pendente') => {
  if (String(value ?? '').trim() === '') return pendingLabel;
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? `R$ ${parsed.toFixed(2).replace('.', ',')}` : 'Preço pendente';
};

const displayUnitLabel = (value) => {
  const label = String(value ?? '').trim().toLowerCase();
  return /^und\d+$/.test(label) ? 'un.' : label || 'un.';
};

export default function PurchaseProductReviewCard({
  item, title, included = true, expanded = false, busy = false,
  selectionPending = false, selectionLabel,
  readOnly = false,
  categoryOpen = false, onToggleIncluded, onToggleEdit, onToggleCategory,
  onSelectCategory, categoryOptions = PRODUCT_CATEGORIES, editorValues, editorErrors = {},
  editorNotice, priceHint = 'Os preços da nota são independentes e podem incluir descontos.',
  onEditorChange, children,
}) {
  const theme = useTheme();
  const { t } = useAppPreferences();
  const name = title ?? item.name ?? 'Produto sem nome';
  const packageLabel = item.weight
    ? `${item.weight} ${item.unit || ''}`.trim()
    : item.contentValue && item.unit ? `${item.contentValue} ${item.unit}` : '';
  const quantity = item.quantity || '—';
  const unitLabel = displayUnitLabel(item.unitLabel);
  const total = editorValues?.totalPrice ?? item.totalPrice ?? itemTotal(item);
  const perUnit = editorValues?.unitPrice ?? item.unitPrice ?? itemUnitPrice(item);
  const values = editorValues ?? {
    name: item.name ?? '', brand: item.brand ?? '', quantity: item.quantity ?? '',
    unitPrice: item.unitPrice ?? '', totalPrice: item.totalPrice ?? '',
    weight: item.weight ?? item.contentValue ?? '', unit: item.unit ?? '', category: item.category ?? 'outros',
  };

  const change = (field, value) => onEditorChange?.(field, value);

  function field(fieldName, label, options = {}) {
    return <FieldGroup key={fieldName}>
      <Label>{label}</Label>
      <FormField
        Icon={options.Icon}
        accessibilityLabel={options.accessibilityLabel || label}
        value={String(values[fieldName] ?? '')}
        maxLength={options.maxLength}
        keyboardType={options.keyboardType}
        editable={!busy}
        error={editorErrors[fieldName]}
        placeholder={options.placeholder}
        onChangeText={(value) => change(fieldName, value)}
      />
    </FieldGroup>;
  }

  return (
    <Card $selected={included || selectionPending}>
      <SelectionStatus $selected={included || selectionPending} accessibilityLiveRegion="polite">
        {selectionPending ? <InfoIcon size={18} color={theme.colors.primary[700]} />
          : included ? <CheckIcon size={18} color={theme.colors.primary[700]} />
            : <CancelCircleIcon size={18} color={theme.colors.black[400]} />}
        <SelectionText>{selectionLabel || (selectionPending ? t('shopping.waitingDecision') : included ? t('shopping.addedToPantry') : t('shopping.notAdded'))}</SelectionText>
      </SelectionStatus>
      <ProductRow>
        <ProductImage source={require('../../assets/grocery/legumesGrocery.png')} accessible={false} />
        <ProductBody>
          <Name>{name}</Name>
          {item.sourceDescription ? <Muted>{t('shopping.receipt', { description: item.sourceDescription })}</Muted> : null}
          {item.brand ? <Muted>{t('shopping.brand', { brand: item.brand })}</Muted> : null}
          {packageLabel ? <Muted>{t('shopping.package', { package: packageLabel })}</Muted> : null}
          <Muted>{quantity} {unitLabel}{perUnit ? ` · ${currency(perUnit, t('shopping.pendingPrice'))}/${unitLabel}` : ''}</Muted>
          {total != null ? <Price>{currency(total, t('shopping.pendingPrice'))} <ReceiptLabel>{t('shopping.total')}</ReceiptLabel></Price> : null}
        </ProductBody>
      </ProductRow>
      {item.sourceItems?.length > 1 ? <Muted>
        {t('shopping.receiptDuplicates', { count: item.sourceItems.length })}{item.hasDifferentPrices ? ` · ${t('shopping.averageUnitPrice')}` : ''}
      </Muted> : null}
      {!readOnly ? <CardActions>
        {item.category ? <CategoryTag category={item.category} variant="product" selected={false} disabled={busy}
          onPress={onToggleCategory} /> : <CategoryButton accessibilityRole="button" disabled={busy}
          onPress={onToggleCategory}><CategoryButtonText>{t('shopping.chooseCategory')}</CategoryButtonText></CategoryButton>}
        <Group>
          <ReceiptLabel>{expanded ? t('shopping.finishEdit') : t('shopping.editAction')}</ReceiptLabel>
          <ModalActionButton Icon={expanded ? CheckIcon : PenIcon}
            accessibilityLabel={expanded ? t('shopping.finishEditing') : t('shopping.edit', { name: item.sourceDescription || name })}
            disabled={busy} variant="confirm" onPress={onToggleEdit} />
        </Group>
      </CardActions> : null}
      {!readOnly && categoryOpen && !expanded ? <Editor>
        <Label>{t('shopping.categoryQuestion')}</Label>
        <Group>
          {categoryOptions.map((category) => <CategoryTag key={category} category={category}
            variant="product" selected={item.category === category} disabled={busy}
            onSelectionChange={() => onSelectCategory?.(category)} />)}
        </Group>
      </Editor> : null}
      {!readOnly && onToggleIncluded ? <Selection accessibilityRole="button"
        accessibilityLabel={`${included ? t('shopping.doNotAdd') : t('shopping.addProduct')} ${item.sourceDescription || name}`}
        accessibilityState={{ disabled: busy }} disabled={busy} onPress={onToggleIncluded}>
        <SelectionText>{included ? t('shopping.doNotAdd') : t('shopping.addProduct')}</SelectionText>
      </Selection> : null}
      {!readOnly && expanded ? <Editor>
        <EditorTitle>{t('shopping.editProduct')}</EditorTitle>
        {field('name', t('shopping.pantryName'), { Icon: PenIcon, maxLength: 120 })}
        {field('brand', t('shopping.optionalBrand'), { Icon: PenIcon, maxLength: 100 })}
        {editorNotice ? <Muted>{editorNotice}</Muted> : null}
        {field('quantity', t('shopping.quantityRequired', { unit: item.unitLabel ? ` (${item.unitLabel})` : '' }), { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        {field('unitPrice', t('shopping.unitPrice', { unit: item.unitLabel || t('shopping.unitLabel') }), { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        {field('totalPrice', t('shopping.itemTotal'), { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        <Muted>{priceHint}</Muted>
        {field('weight', t('shopping.packageMeasure'), { keyboardType: 'decimal-pad', maxLength: 16, placeholder: t('shopping.exampleWeight') })}
        {String(values.weight ?? '').trim() ? <FieldGroup>
          <Label>{t('shopping.requiredUnit')}</Label>
          <UnitOptions accessibilityRole="radiogroup">{PRODUCT_UNITS.map((unit) => <UnitOption key={unit}
            accessibilityRole="radio" accessibilityLabel={t('shopping.unitRequired', { unit })}
            accessibilityState={{ checked: values.unit === unit, disabled: busy }} $selected={values.unit === unit}
            disabled={busy} onPress={() => change('unit', unit)}>
            <UnitLabel $selected={values.unit === unit}>{unit}</UnitLabel>
          </UnitOption>)}</UnitOptions>
          {editorErrors.unit ? <EditorError accessibilityLiveRegion="polite">{editorErrors.unit}</EditorError> : null}
        </FieldGroup> : null}
        <Muted>{t('shopping.packageMeasureHelp')}</Muted>
        <FieldGroup>
          <Label>{t('shopping.requiredCategory')}</Label>
          <Group>{categoryOptions.map((category) => <CategoryTag key={category} category={category}
            variant="product" selected={values.category === category} disabled={busy}
            onSelectionChange={() => { if (onSelectCategory) onSelectCategory(category); else change('category', category); }} />)}</Group>
          {editorErrors.category ? <EditorError accessibilityLiveRegion="polite">{editorErrors.category}</EditorError> : null}
        </FieldGroup>
      </Editor> : null}
      {!expanded ? children : null}
    </Card>
  );
}

function itemTotal(item) {
  if (String(item.priceInput ?? '').trim() === '') return null;
  const price = Number(String(item.priceInput ?? '').replace(',', '.'));
  const quantity = Number(String(item.quantity ?? '').replace(',', '.')) || 0;
  if (!Number.isFinite(price)) return null;
  return item.priceMode === 'total' ? price : price * quantity;
}

function itemUnitPrice(item) {
  if (String(item.priceInput ?? '').trim() === '') return null;
  const price = Number(String(item.priceInput).replace(',', '.'));
  const quantity = Number(String(item.quantity ?? '').replace(',', '.')) || 0;
  if (!Number.isFinite(price)) return null;
  return item.priceMode === 'total' ? (quantity ? price / quantity : null) : price;
}

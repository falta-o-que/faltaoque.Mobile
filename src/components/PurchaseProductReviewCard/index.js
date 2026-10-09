import CategoryTag from '../CategoryTag';
import ModalActionButton from '../ModalActionButton';
import FormField from '../FormField';
import { useTheme } from 'styled-components/native';
import { CheckIcon, CancelCircleIcon, PenIcon, DeliveryIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { UnitOptions, UnitOption, UnitLabel } from '../AddProductModal/styles';
import {
  Card, CardActions, CategoryButton, CategoryButtonText, Editor, EditorTitle, Group, Label,
  Muted, Name, Price, ProductBody, ProductImage, ProductRow, ReceiptLabel,
  EditorError, FieldGroup, Selection, SelectionStatus, SelectionText,
} from './styles';

const currency = (value) => {
  if (String(value ?? '').trim() === '') return 'Preço pendente';
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? `R$ ${parsed.toFixed(2).replace('.', ',')}` : 'Preço pendente';
};

const displayUnitLabel = (value) => {
  const label = String(value ?? '').trim().toLowerCase();
  return /^und\d+$/.test(label) ? 'un.' : label || 'un.';
};

export default function PurchaseProductReviewCard({
  item, title, included = true, expanded = false, busy = false,
  readOnly = false,
  categoryOpen = false, onToggleIncluded, onToggleEdit, onToggleCategory,
  onSelectCategory, categoryOptions = PRODUCT_CATEGORIES, editorValues, editorErrors = {},
  editorNotice, priceHint = 'Os preços da nota são independentes e podem incluir descontos.',
  onEditorChange, children,
}) {
  const theme = useTheme();
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
    <Card $selected={included}>
      <SelectionStatus $selected={included} accessibilityLiveRegion="polite">
        {included ? <CheckIcon size={18} color={theme.colors.primary[700]} /> : <CancelCircleIcon size={18} color={theme.colors.black[400]} />}
        <SelectionText>{included ? 'Será adicionado à despensa' : 'Não será adicionado'}</SelectionText>
      </SelectionStatus>
      <ProductRow>
        <ProductImage source={require('../../assets/grocery/legumesGrocery.png')} accessible={false} />
        <ProductBody>
          <Name>{name}</Name>
          {item.sourceDescription ? <Muted>Na nota: {item.sourceDescription}</Muted> : null}
          {item.brand ? <Muted>Marca: {item.brand}</Muted> : null}
          {packageLabel ? <Muted>Embalagem: {packageLabel}</Muted> : null}
          <Muted>{quantity} {unitLabel}{perUnit ? ` · ${currency(perUnit)}/${unitLabel}` : ''}</Muted>
          {total != null ? <Price>{currency(total)} <ReceiptLabel>no total</ReceiptLabel></Price> : null}
        </ProductBody>
      </ProductRow>
      {item.sourceItems?.length > 1 ? <Muted>
        {item.sourceItems.length} registros iguais na nota · quantidade somada{item.hasDifferentPrices ? ' · preço unitário médio' : ''}
      </Muted> : null}
      {!readOnly ? <CardActions>
        {item.category ? <CategoryTag category={item.category} variant="product" selected={false} disabled={busy}
          onPress={onToggleCategory} /> : <CategoryButton accessibilityRole="button" disabled={busy}
          onPress={onToggleCategory}><CategoryButtonText>+ Escolher categoria</CategoryButtonText></CategoryButton>}
        <Group>
          <ReceiptLabel>{expanded ? 'Concluir' : 'Editar'}</ReceiptLabel>
          <ModalActionButton Icon={expanded ? CheckIcon : PenIcon}
            accessibilityLabel={expanded ? 'Concluir edição' : `Editar ${item.sourceDescription || name}`}
            disabled={busy} variant="confirm" onPress={onToggleEdit} />
        </Group>
      </CardActions> : null}
      {!readOnly && categoryOpen && !expanded ? <Editor>
        <Label>Qual é a categoria?</Label>
        <Group>
          {categoryOptions.map((category) => <CategoryTag key={category} category={category}
            variant="product" selected={item.category === category} disabled={busy}
            onSelectionChange={() => onSelectCategory?.(category)} />)}
        </Group>
      </Editor> : null}
      {!readOnly && onToggleIncluded ? <Selection accessibilityRole="button"
        accessibilityLabel={`${included ? 'Não adicionar' : 'Adicionar'} ${item.sourceDescription || name}`}
        accessibilityState={{ disabled: busy }} disabled={busy} onPress={onToggleIncluded}>
        <SelectionText>{included ? 'Não adicionar este produto' : 'Adicionar este produto'}</SelectionText>
      </Selection> : null}
      {!readOnly && expanded ? <Editor>
        <EditorTitle>Editar produto</EditorTitle>
        {field('name', 'Nome na despensa *', { Icon: PenIcon, maxLength: 120 })}
        {field('brand', 'Marca (opcional)', { Icon: PenIcon, maxLength: 100 })}
        {editorNotice ? <Muted>{editorNotice}</Muted> : null}
        {field('quantity', `Quantidade${item.unitLabel ? ` (${item.unitLabel})` : ''} *`, { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        {field('unitPrice', `Preço por ${item.unitLabel || 'unidade'} (R$) *`, { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        {field('totalPrice', 'Total do item (R$) *', { Icon: DeliveryIcon, keyboardType: 'decimal-pad', maxLength: 16 })}
        <Muted>{priceHint}</Muted>
        {field('weight', 'Peso/volume da embalagem', { keyboardType: 'decimal-pad', maxLength: 16, placeholder: 'Ex.: 500' })}
        {String(values.weight ?? '').trim() ? <FieldGroup>
          <Label>Unidade *</Label>
          <UnitOptions accessibilityRole="radiogroup">{PRODUCT_UNITS.map((unit) => <UnitOption key={unit}
            accessibilityRole="radio" accessibilityLabel={`Unidade ${unit}, obrigatória`}
            accessibilityState={{ checked: values.unit === unit, disabled: busy }} $selected={values.unit === unit}
            disabled={busy} onPress={() => change('unit', unit)}>
            <UnitLabel $selected={values.unit === unit}>{unit}</UnitLabel>
          </UnitOption>)}</UnitOptions>
          {editorErrors.unit ? <EditorError accessibilityLiveRegion="polite">{editorErrors.unit}</EditorError> : null}
        </FieldGroup> : null}
        <Muted>Medida de cada embalagem, sem multiplicar pela quantidade comprada.</Muted>
        <FieldGroup>
          <Label>Categoria *</Label>
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

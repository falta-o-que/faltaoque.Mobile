import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import CategoryTag from '../../components/CategoryTag';
import FormField from '../../components/FormField';
import ButtonClick from '../../components/ButtonClick';
import ModalActionButton from '../../components/ModalActionButton';
import { PenIcon, DeliveryIcon, CheckIcon, CancelCircleIcon, PantryIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { UnitOptions, UnitOption, UnitLabel } from '../../components/AddProductModal/styles';
import { useAuth } from '../../contexts/AuthContext';
import { confirmFiscalPurchase } from '../../services/nfceImportService';
import { Screen, KeyboardArea, Header, Title, Muted, Label, Name, Card, Summary, Row, Group, Tags, Footer, ErrorText,
  Destination, Dot, ProductImage, ProductBody, ProductRow, Price, Selection, SelectionText, SelectionStatus, CardActions, CategoryButton, CategoryButtonText, Editor, SectionTitle, Progress, ReceiptLabel,
} from './styles';

const decimal = (value) => Number(String(value).trim().replace(',', '.'));
const currency = (value) => Number.isFinite(decimal(value)) ? `R$ ${decimal(value).toFixed(2).replace('.', ',')}` : '—';
const inputValue = (value) => String(value ?? '').replace('.', ',');

export default function NfceReviewScreen({ route, navigation }) {
  const { purchase, pantryId, pantryName, pantryColor } = route.params ?? {};
  const { account } = useAuth();
  const theme = useTheme();
  const [items, setItems] = useState(() => (purchase?.items ?? []).map((item) => ({ ...item,
    category: item.category ?? 'outros',
    weight: inputValue(item.weight), unit: item.unit ?? '',
    quantity: inputValue(item.quantity), unitPrice: inputValue(item.unitPrice), totalPrice: inputValue(item.totalPrice),
  })));
  const [expanded, setExpanded] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const list = useRef(null);
  usePreventRemove(saving, () => {});
  const selected = items.filter((item) => item.selected);
  const total = selected.reduce((sum, item) => sum + (decimal(item.totalPrice) || 0), 0);
  const pending = selected.filter((item) => !PRODUCT_CATEGORIES.includes(item.category)).length;

  function update(index, patch) {
    if (busy.current) return;
    setItems((current) => current.map((item, position) => position === index ? { ...item, ...patch } : item));
    setErrors((current) => ({ ...current, [index]: undefined }));
    setSubmitError(null);
  }

  async function confirm() {
    if (busy.current || !selected.length) return;
    const nextErrors = {};
    items.forEach((item, index) => {
      if (!item.selected) return;
      const fields = {};
      if (!item.sourceDescription.trim()) fields.sourceDescription = 'Informe o nome do produto.';
      for (const field of ['quantity', 'unitPrice', 'totalPrice']) {
        if (!/^\d+(?:[,.]\d+)?$/.test(String(item[field]).trim()) || !Number.isFinite(decimal(item[field])) || decimal(item[field]) <= 0) fields[field] = 'Informe um valor maior que zero.';
      }
      if (!PRODUCT_CATEGORIES.includes(item.category)) fields.category = 'Escolha uma categoria para este produto.';
      if (item.weight.trim()) {
        if (!/^\d+(?:[,.]\d+)?$/.test(item.weight.trim()) || !Number.isFinite(decimal(item.weight)) || decimal(item.weight) <= 0) fields.weight = 'Informe um peso ou volume maior que zero.';
        if (!PRODUCT_UNITS.includes(item.unit)) fields.unit = 'Escolha a unidade de medida.';
      }
      if (Object.keys(fields).length) nextErrors[index] = fields;
    });
    setErrors(nextErrors);
    const invalid = Object.keys(nextErrors)[0];
    if (invalid !== undefined) {
      setExpanded(Number(invalid));
      setSubmitError('Revise os campos destacados antes de adicionar.');
      list.current?.scrollToIndex({ index: Number(invalid), animated: true });
      return;
    }
    busy.current = true;
    setSaving(true);
    try {
      await confirmFiscalPurchase({ accountId: account?.id, pantryId, purchase, items: items.map((item) => ({ ...item,
        quantity: decimal(item.quantity), unitPrice: decimal(item.unitPrice), totalPrice: decimal(item.totalPrice),
        weight: item.weight.trim() ? decimal(item.weight) : null, unit: item.weight.trim() ? item.unit : null,
      })) });
      setSaving(false);
      // Leave after the navigation guard has rendered its unlocked state.
      setCompleted(true);
    } catch (error) {
      setSubmitError(error.message === 'DUPLICATE_FISCAL_NOTE' ? 'Esta nota já foi adicionada à sua conta.' : 'Não foi possível adicionar os produtos. Suas alterações foram mantidas; tente novamente.');
      busy.current = false;
      setSaving(false);
    }
  }

  const [completed, setCompleted] = useState(false);
  useEffect(() => { if (completed) navigation.goBack(); }, [completed, navigation]);

  function renderItem({ item, index }) {
    const open = expanded === index;
    const fields = errors[index] ?? {};
    return (
      <Card $selected={item.selected}>
        <SelectionStatus $selected={item.selected} accessibilityLiveRegion="polite">
          {item.selected ? <CheckIcon size={18} color={theme.colors.primary[700]} /> : <CancelCircleIcon size={18} color={theme.colors.black[400]} />}
          <SelectionText>{item.selected ? 'Será adicionado à despensa' : 'Não será adicionado'}</SelectionText>
        </SelectionStatus>
        <ProductRow>
          <ProductImage source={require('../../assets/grocery/legumesGrocery.png')} accessible={false} />
          <ProductBody>
            <Name>{item.sourceDescription || 'Produto sem nome'}</Name>
            {item.weight ? <Muted>Embalagem: {item.weight} {item.unit}</Muted> : null}
            <Muted>{item.quantity} {item.unitLabel || 'un.'} · {currency(item.unitPrice)}/{item.unitLabel || 'un.'}</Muted>
            <Price>{currency(item.totalPrice)} <ReceiptLabel>no total</ReceiptLabel></Price>
          </ProductBody>
        </ProductRow>
        {item.sourceItems?.length > 1 ? <Muted>{item.sourceItems.length} registros iguais na nota · quantidade somada{item.hasDifferentPrices ? ' · preço unitário médio' : ''}</Muted> : null}
        <CardActions>
          {item.category ? <CategoryTag category={item.category} variant="product" disabled={saving} onPress={() => setCategoryOpen(categoryOpen === index ? null : index)} /> : <CategoryButton accessibilityRole="button" disabled={saving} onPress={() => setCategoryOpen(categoryOpen === index ? null : index)}><CategoryButtonText>+ Escolher categoria</CategoryButtonText></CategoryButton>}
          <Row><ReceiptLabel>{open ? 'Concluir' : 'Editar'}</ReceiptLabel><ModalActionButton Icon={open ? CheckIcon : PenIcon} accessibilityLabel={open ? 'Concluir edição' : `Editar ${item.sourceDescription}`} disabled={saving} variant="confirm" onPress={() => setExpanded(open ? null : index)} /></Row>
        </CardActions>
        <Selection accessibilityRole="button" accessibilityLabel={`${item.selected ? 'Não adicionar' : 'Adicionar'} ${item.sourceDescription}`} accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => { update(index, { selected: !item.selected }); setExpanded(null); setCategoryOpen(null); }}>
          <SelectionText>{item.selected ? 'Não adicionar este produto' : 'Adicionar este produto'}</SelectionText>
        </Selection>
        {categoryOpen === index && !open ? <Group><Label>Qual é a categoria?</Label><Tags>{PRODUCT_CATEGORIES.map((category) => <CategoryTag key={category} category={category} variant="product" selected={item.category === category} disabled={saving} onSelectionChange={() => { update(index, { category }); setCategoryOpen(null); }} />)}</Tags></Group> : null}
        {open ? <Editor>
          <SectionTitle>Editar produto</SectionTitle>
          <Label>Nome *</Label>
          <FormField Icon={PenIcon} accessibilityLabel="Nome do produto" value={item.sourceDescription} maxLength={120} editable={!saving} error={fields.sourceDescription} onChangeText={(value) => update(index, { sourceDescription: value })} />
          {[
            ['quantity', `Quantidade${item.unitLabel ? ` (${item.unitLabel})` : ''} *`],
            ['unitPrice', `Preço por ${item.unitLabel || 'unidade'} (R$) *`],
            ['totalPrice', 'Total do item (R$) *'],
          ].map(([field, label]) => <Group key={field}><Label>{label}</Label><FormField Icon={DeliveryIcon} accessibilityLabel={label} value={item[field]} keyboardType="decimal-pad" maxLength={16} editable={!saving} error={fields[field]} onChangeText={(value) => update(index, { [field]: value })} /></Group>)}
          <Muted>Os preços da nota são independentes e podem incluir descontos.</Muted>
          <Label>Peso/volume da embalagem</Label>
          <FormField accessibilityLabel="Peso ou volume da embalagem" value={item.weight} keyboardType="decimal-pad" maxLength={16} editable={!saving} error={fields.weight} placeholder="Ex.: 500" onChangeText={(weight) => update(index, { weight, unit: weight.trim() ? item.unit : '' })} />
          {item.weight.trim() ? <UnitOptions accessibilityRole="radiogroup">{PRODUCT_UNITS.map((unit) => <UnitOption key={unit} accessibilityRole="radio" accessibilityLabel={unit} accessibilityState={{ checked: item.unit === unit }} $selected={item.unit === unit} disabled={saving} onPress={() => update(index, { unit })}><UnitLabel $selected={item.unit === unit}>{unit}</UnitLabel></UnitOption>)}</UnitOptions> : null}
          {fields.unit ? <ErrorText>{fields.unit}</ErrorText> : null}
          <Muted>Medida de cada embalagem, sem multiplicar pela quantidade comprada.</Muted>
          <Label>Categoria *</Label>
          <Tags>{PRODUCT_CATEGORIES.map((category) => <CategoryTag key={category} category={category} variant="product" selected={item.category === category} disabled={saving} onSelectionChange={() => update(index, { category })} />)}</Tags>
          {fields.category ? <ErrorText>{fields.category}</ErrorText> : null}
        </Editor> : null}
      </Card>
    );
  }

  return <Screen>
    <KeyboardArea behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header>
        <Row><Title>Guardar compras</Title><ModalActionButton Icon={CancelCircleIcon} accessibilityLabel="Cancelar importação" variant="cancel" disabled={saving || completed} onPress={() => navigation.goBack()} /></Row>
        <Destination><Dot $color={pantryColor || theme.colors.primary.Green} /><Label>{pantryName || 'Sua despensa'}</Label></Destination>
      </Header>
      <FlatList ref={list} data={items} keyExtractor={(_, index) => String(index)} renderItem={renderItem} extraData={{ expanded, errors, saving }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16 }} onScrollToIndexFailed={({ index, averageItemLength }) => list.current?.scrollToOffset({ offset: index * averageItemLength, animated: true })}
        ListHeaderComponent={<Group>
          <Summary><ReceiptLabel>NOTA LIDA</ReceiptLabel><Label>{purchase?.merchantName || 'Nota fiscal'}</Label><Muted>{items.length} {items.length === 1 ? 'produto encontrado' : 'produtos encontrados'} · {currency(purchase?.totalAmount)}</Muted></Summary>
          <SectionTitle>O que vai para a despensa?</SectionTitle>
          <Muted>Os produtos começam selecionados. Use “Não adicionar este produto” para retirar algum da seleção.</Muted>
        </Group>}
        ListEmptyComponent={<Muted>Nenhum produto disponível nesta nota. Volte e tente escanear novamente.</Muted>}
      />
      <Footer>
        <Row><Group><Label>{selected.length} {selected.length === 1 ? 'produto selecionado' : 'produtos selecionados'}</Label><Price>{currency(total)}</Price></Group><PantryIcon size={30} color={theme.colors.primary.Green} /></Row>
        {pending ? <Progress accessibilityRole="button" disabled={saving} onPress={() => { const index = items.findIndex((item) => item.selected && !PRODUCT_CATEGORIES.includes(item.category)); setCategoryOpen(index); setExpanded(null); list.current?.scrollToIndex({ index, animated: true }); }}><CategoryButtonText>{pending === 1 ? 'Falta escolher 1 categoria' : `Faltam escolher ${pending} categorias`} · Resolver</CategoryButtonText></Progress> : null}
        {submitError ? <ErrorText accessibilityRole="alert">{submitError}</ErrorText> : null}
        {saving ? <ActivityIndicator color={theme.colors.primary.Green} accessibilityLabel="Adicionando produtos" /> : null}
        <ButtonClick disabled={saving || completed || !selected.length} onPress={confirm} title={saving ? 'Guardando compras...' : 'Guardar na despensa'} />
      </Footer>
    </KeyboardArea>
  </Screen>;
}

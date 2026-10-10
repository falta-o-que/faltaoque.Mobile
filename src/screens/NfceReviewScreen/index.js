import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import PlaceSearchField from '../../components/PlaceSearchField';
import ButtonClick from '../../components/ButtonClick';
import ModalActionButton from '../../components/ModalActionButton';
import PurchaseProductReviewCard from '../../components/PurchaseProductReviewCard';
import { CancelCircleIcon, LocationIcon, PantryIcon } from '../../assets/icons/export';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/productValidation';
import { normalizeFiscalProduct } from '../../domain/groceryCheckoutReconciliation';
import { useAuth } from '../../contexts/AuthContext';
import { confirmFiscalPurchase } from '../../services/nfceImportService';
import { getUserErrorMessage } from '../../utils/userErrors';
import { Screen, KeyboardArea, Header, Title, Muted, Label, Summary, Row, Group, Footer, ErrorText,
  Destination, Dot, Price, CategoryButtonText, SectionTitle, Progress, ReceiptLabel,
} from './styles';

const decimal = (value) => Number(String(value).trim().replace(',', '.'));
const currency = (value) => Number.isFinite(decimal(value)) ? `R$ ${decimal(value).toFixed(2).replace('.', ',')}` : '—';
const inputValue = (value) => String(value ?? '').replace('.', ',');

export default function NfceReviewScreen({ route, navigation }) {
  const { purchase, pantryId, pantryName, pantryColor } = route.params ?? {};
  const { account } = useAuth();
  const theme = useTheme();
  const [items, setItems] = useState(() => (purchase?.items ?? []).map((item) => ({ ...item,
    ...(() => { const proposal = normalizeFiscalProduct(item.sourceDescription); return {
      name: proposal.name, brand: proposal.brand ?? '', requiresReview: proposal.requiresReview,
    }; })(),
    category: item.category ?? 'outros',
    weight: inputValue(item.weight), unit: item.unit ?? '',
    quantity: inputValue(item.quantity), unitPrice: inputValue(item.unitPrice), totalPrice: inputValue(item.totalPrice),
  })));
  const [expanded, setExpanded] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [location, setLocation] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [locationError, setLocationError] = useState('');
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
    if (location.trim() && !selectedMarket) {
      setLocationError('Selecione um mercado válido nas sugestões do Google ou limpe o campo.');
      return;
    }
    const normalizedLocation = selectedMarket?.cep ?? null;
    setLocationError('');
    const nextErrors = {};
    items.forEach((item, index) => {
      if (!item.selected) return;
      const fields = {};
      if (!item.name.trim()) fields.name = 'Informe o nome que aparecerá na despensa.';
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
      await confirmFiscalPurchase({ accountId: account?.id, pantryId, purchase, location: normalizedLocation, market: selectedMarket, items: items.map((item) => ({ ...item,
        quantity: decimal(item.quantity), unitPrice: decimal(item.unitPrice), totalPrice: decimal(item.totalPrice),
        weight: item.weight.trim() ? decimal(item.weight) : null, unit: item.weight.trim() ? item.unit : null,
      })) });
      setSaving(false);
      // Leave after the navigation guard has rendered its unlocked state.
      setCompleted(true);
    } catch (error) {
      setSubmitError(getUserErrorMessage(error, 'Não foi possível adicionar os produtos. Suas alterações foram mantidas; tente novamente.'));
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
      <PurchaseProductReviewCard item={item} included={Boolean(item.selected)} expanded={open} busy={saving}
        editorValues={{ name: item.name, brand: item.brand, quantity: item.quantity, unitPrice: item.unitPrice,
          totalPrice: item.totalPrice, weight: item.weight, unit: item.unit, category: item.category }}
        editorErrors={fields}
        editorNotice={item.requiresReview ? 'A descrição da nota pode conter informações ambíguas. Confira nome, marca e tamanho.' : null}
        onEditorChange={(field, value) => update(index, field === 'weight'
          ? { weight: value, unit: value.trim() ? item.unit : '' } : { [field]: value })}
        categoryOpen={categoryOpen === index} categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpen(categoryOpen === index ? null : index)}
        onSelectCategory={(category) => { update(index, { category }); setCategoryOpen(null); }}
        onToggleEdit={() => { setExpanded(open ? null : index); setCategoryOpen(null); }}
        onToggleIncluded={() => { update(index, { selected: !item.selected }); setExpanded(null); setCategoryOpen(null); }} />
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
          <Summary><ReceiptLabel>NOTA LIDA</ReceiptLabel><Label>{purchase?.merchantName || 'Nota fiscal'}</Label><Muted>{items.length} {items.length === 1 ? 'produto encontrado' : 'produtos encontrados'} · {currency(purchase?.totalAmount)}</Muted><Muted>Data da nota: {purchase?.purchasedAt ? purchase.purchasedAt.slice(8, 10) + '/' + purchase.purchasedAt.slice(5, 7) + '/' + purchase.purchasedAt.slice(0, 4) : 'não identificada'} (não editável)</Muted></Summary>
          <PlaceSearchField
            value={location}
            selected={Boolean(selectedMarket)}
            selectedPlace={selectedMarket}
            disabled={saving}
            error={locationError}
            Icon={LocationIcon}
            placeholder="Mercado da compra (opcional)"
            onChangeText={(value) => { setLocation(value); setSelectedMarket(null); setLocationError(''); }}
            onSelect={(market) => { setSelectedMarket(market); setLocation(market.displayName); setLocationError(''); }}
          />
          <SectionTitle>O que vai para a despensa?</SectionTitle>
          <Muted>Os produtos começam selecionados. Use “Não adicionar este produto” para retirar algum da seleção.</Muted>
        </Group>}
        ListEmptyComponent={<Muted>Nenhum produto disponível nesta nota. Volte e tente escanear novamente.</Muted>}
      />
      <Footer>
        <Row><Group><Label>{selected.length} {selected.length === 1 ? 'produto selecionado' : 'produtos selecionados'}</Label><Price>{currency(total)}</Price></Group><PantryIcon size={30} color={theme.colors.primary.Green} /></Row>
        {pending ? <Progress accessibilityRole="button" disabled={saving} onPress={() => { const index = items.findIndex((item) => item.selected && !PRODUCT_CATEGORIES.includes(item.category)); setCategoryOpen(index); setExpanded(null); list.current?.scrollToIndex({ index, animated: true }); }}><CategoryButtonText>{pending === 1 ? 'Falta escolher 1 categoria' : `Faltam escolher ${pending} categorias`} · Resolver</CategoryButtonText></Progress> : null}
        {submitError ? <ErrorText accessibilityLiveRegion="polite" accessibilityRole="alert">{submitError}</ErrorText> : null}
        {saving ? <ActivityIndicator color={theme.colors.primary.Green} accessibilityLabel="Adicionando produtos" /> : null}
        <ButtonClick disabled={saving || completed || !selected.length} onPress={confirm} title={saving ? 'Guardando compras...' : 'Guardar na despensa'} />
      </Footer>
    </KeyboardArea>
  </Screen>;
}

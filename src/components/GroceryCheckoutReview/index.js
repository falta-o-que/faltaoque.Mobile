import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import FormField from '../FormField';
import PlaceSearchField from '../PlaceSearchField';
import ButtonClick from '../ButtonClick';
import PurchaseProductReviewCard from '../PurchaseProductReviewCard';
import { CancelCircleIcon, LocationIcon } from '../../assets/icons/export';
import ModalActionButton from '../ModalActionButton';
import { PRODUCT_CATEGORIES } from '../../domain/productValidation';
import { arePresentationsCompatible } from '../../domain/groceryCheckoutReconciliation';
import {
  Choice, ChoiceRow, ChoiceText, Content, ContentInner, DateSummary,
  DateValue, DecisionHint, DecisionList, DecisionOption, DecisionTitle,
  ErrorText, Footer, Header, HeaderRow, Label, LinkRoute, LinkRouteLabel,
  LinkRouteValue, ModalRoot, Muted, PurchaseContext, ContextEyebrow,
  ContextHeader, ContextLabel, ContextRow, ContextValue, ProgressChip,
  ProgressChipText, ProgressTrack, Section, SectionTitle, StepCounter,
  StepHeader, StepTitle, SummaryBanner, SummaryBannerTitle, SummaryBannerText,
  SummaryRow, SummaryValue, Title,
} from './styles';

const categoryLabels = {
  bebidas: 'Bebidas', organicos: 'Orgânicos', limpezaHigiene: 'Limpeza e higiene',
  integraisCereais: 'Integrais e cereais', frescos: 'Frescos', carnes: 'Carnes', outros: 'Outros',
};
const stageOrder = ['matches', 'relate', 'missing', 'unlinked', 'summary'];
const stageLabels = {
  matches: 'Encontrados', relate: 'Relacionar', missing: 'Faltaram', unlinked: 'Sem vínculo', summary: 'Resumo',
};
const numberValue = (value) => Number(String(value ?? '').replace(',', '.'));
const formatMoney = (value) => `R$ ${Number(value ?? 0).toFixed(2).replace('.', ',')}`;
const itemTotal = (item) => {
  const price = numberValue(item.priceInput);
  const quantity = numberValue(item.quantity) || 0;
  return Number.isFinite(price) ? (item.priceMode === 'total' ? price : price * quantity) : 0;
};
const checkoutItemErrors = (item) => {
  const errors = {};
  const name = String(item.name ?? '').trim();
  const brand = String(item.brand ?? '').trim();
  const quantity = numberValue(item.quantity);
  const contentText = String(item.contentValue ?? '').trim();
  const contentValue = contentText ? numberValue(contentText) : null;
  const enteredPrice = numberValue(item.priceInput);
  const totalPrice = item.priceMode === 'unit' ? enteredPrice * quantity : enteredPrice;

  if (!name || name.length > 120) errors.name = 'Informe um nome válido para o produto.';
  if (brand.length > 100) errors.brand = 'A marca deve ter até 100 caracteres.';
  if (!Number.isSafeInteger(quantity) || quantity < 1) errors.quantity = 'Informe uma quantidade inteira maior que zero.';
  if (contentText && (!Number.isFinite(contentValue) || contentValue <= 0)) errors.contentValue = 'Informe um tamanho maior que zero.';
  if (contentText && !['g', 'kg', 'ml', 'L'].includes(item.unit)) errors.unit = 'Escolha a unidade do tamanho.';
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) errors.price = 'Informe um preço maior que zero.';
  if (!PRODUCT_CATEGORIES.includes(item.category)) errors.category = 'Escolha uma categoria.';
  if (item.categoryConflict && (!item.categoryResolved ||
    ![item.categoryConflict.listCategory, item.categoryConflict.pantryCategory].includes(item.category))) {
    errors.category = 'Resolva o conflito de categoria.';
  }
  return errors;
};
const checkoutEditorErrors = (item, errors = checkoutItemErrors(item)) => ({
  name: errors.name, brand: errors.brand, quantity: errors.quantity,
  unitPrice: item.priceMode === 'unit' ? errors.price : undefined,
  totalPrice: item.priceMode === 'total' ? errors.price : undefined,
  weight: errors.contentValue, unit: errors.unit, category: errors.category,
});

export default function GroceryCheckoutReview({
  visible, mode = 'manual', list = {}, purchase, dateValue = '', dateReadOnly = false,
  marketQuery = '', selectedMarket, items = [], busy = false, error,
  onChangeDate, onChangeMarketQuery, onSelectMarket, onChangeItem, onResetItems, onConfirm, onClose,
}) {
  const [stepKey, setStepKey] = useState('summary');
  const [openId, setOpenId] = useState(null);
  const [categoryOpenId, setCategoryOpenId] = useState(null);
  const initialReviewRef = useRef({ items: [], stepKey: 'summary' });
  const isFiscal = mode === 'nfce';
  const listItems = Array.isArray(list.items) ? list.items : [];
  const receiptItems = items.filter((item) => Boolean(item.sourceDescription));
  const linkedItems = receiptItems.filter((item) => Boolean(item.listItemId));
  const autoMatchedItems = linkedItems.filter((item) => item.matchStatus === 'automatic');
  const manuallyLinkedItems = linkedItems.filter((item) => item.matchStatus === 'manual');
  const linkedListIds = new Set(linkedItems.map((item) => item.listItemId));
  const unmatchedReceiptItems = receiptItems.filter((item) => !item.listItemId);
  const pendingUnlinkedReceiptItems = unmatchedReceiptItems.filter((item) => !item.reviewed ||
    (item.included && Object.keys(checkoutItemErrors(item)).length > 0));
  const unmatchedListItems = listItems.filter((item) => !linkedListIds.has(item.id));
  const pendingListItems = unmatchedListItems.filter((item) => {
    const draft = items.find((entry) => entry.id === `missing-${item.id}`);
    return draft && (!draft.reviewed || (draft.included && Object.keys(checkoutItemErrors(draft)).length > 0));
  });
  const includedItems = items.filter((item) => item.included);
  const incompleteIncludedItems = includedItems.filter((item) => Object.keys(checkoutItemErrors(item)).length > 0);
  const total = includedItems.reduce((sum, item) => sum + itemTotal(item), 0);
  const reviewCount = items.filter((item) => !item.reviewed && (
    item.needsReview || (item.sourceDescription && !item.listItemId) || String(item.id).startsWith('missing-')
  )).length;
  const steps = [
    { key: 'matches', title: 'Confira os produtos reconhecidos', description: 'Comparamos os nomes da lista com a nota. Confira o vínculo e o nome que vai aparecer na despensa.', hasItems: autoMatchedItems.length > 0 || stepKey === 'matches' },
    { key: 'relate', title: 'Relacione os produtos da nota', description: 'Escolha o item correspondente da lista. Se não encontrar, continue: você poderá adicionar como novo ou ignorar.', hasItems: pendingUnlinkedReceiptItems.length > 0 || manuallyLinkedItems.length > 0 || stepKey === 'relate' },
    { key: 'missing', title: 'Decida sobre os itens que faltaram', description: 'Estes produtos estavam na lista, mas não apareceram na nota. Escolha adicionar manualmente ou deixar fora da despensa.', hasItems: pendingListItems.length > 0 || stepKey === 'missing' },
    { key: 'unlinked', title: 'Escolha o destino dos itens sem vínculo', description: 'Para cada linha da nota sem correspondência, escolha adicionar como produto novo ou ignorar.', hasItems: pendingUnlinkedReceiptItems.length > 0 || stepKey === 'unlinked' },
  ].filter((entry) => entry.hasItems);
  const activeSteps = [...steps, {
    key: 'summary', title: 'Confira o resultado',
    description: 'Veja exatamente como os produtos ficarão na despensa antes de finalizar.', hasItems: true,
  }];
  const currentStepIndex = activeSteps.findIndex((entry) => entry.key === stepKey);
  const nextStepIndex = activeSteps.findIndex((entry) => stageOrder.indexOf(entry.key) > stageOrder.indexOf(stepKey));
  const stepIndex = currentStepIndex >= 0 ? currentStepIndex : nextStepIndex >= 0 ? nextStepIndex : activeSteps.length - 1;
  const currentStepKey = activeSteps[stepIndex].key;
  const currentStep = activeSteps[stepIndex];
  const initialStepKey = autoMatchedItems.length ? 'matches'
    : unmatchedReceiptItems.length ? 'relate'
      : unmatchedListItems.length ? 'missing'
        : pendingUnlinkedReceiptItems.length ? 'unlinked' : 'summary';

  useEffect(() => {
    if (visible) {
      initialReviewRef.current = {
        items: items.map((item) => ({ ...item })),
        stepKey: initialStepKey,
      };
      setStepKey(initialStepKey);
      setOpenId(null);
      setCategoryOpenId(null);
    }
  }, [visible, mode]);

  useEffect(() => {
    if (!activeSteps.some((entry) => entry.key === stepKey)) {
      const nextStep = activeSteps.find((entry) => stageOrder.indexOf(entry.key) > stageOrder.indexOf(stepKey)) || activeSteps[activeSteps.length - 1];
      setStepKey(nextStep?.key || 'matches');
    }
  }, [activeSteps.map((entry) => entry.key).join('|'), stepKey]);

  const patch = (item, values) => onChangeItem?.(item.id, values);
  const editorValues = (item) => {
    const quantity = numberValue(item.quantity);
    const hasPrice = String(item.priceInput ?? '').trim() !== '';
    const price = hasPrice ? numberValue(item.priceInput) : null;
    const unitPrice = price == null ? '' : item.priceMode === 'total'
      ? quantity > 0 ? (price / quantity).toFixed(2).replace('.', ',') : ''
      : String(item.priceInput);
    const totalPrice = price == null ? '' : item.priceMode === 'unit'
      ? (price * quantity).toFixed(2).replace('.', ',')
      : String(item.priceInput);
    return {
      name: item.name ?? '', brand: item.brand ?? '', quantity: item.quantity ?? '',
      unitPrice, totalPrice, weight: item.contentValue ?? '', unit: item.unit ?? '', category: item.category ?? 'outros',
    };
  };

  const onEditorChange = (item, key, value) => {
    if (key === 'unitPrice') patch(item, { priceInput: value, priceMode: 'unit' });
    else if (key === 'totalPrice') patch(item, { priceInput: value, priceMode: 'total' });
    else if (key === 'weight') patch(item, { contentValue: value, unit: value.trim() ? item.unit : '' });
    else patch(item, { [key]: value });
  };

  function renderReceiptItem(item, { allowLink = false, showMatch = false, standalone = false } = {}) {
    const linked = listItems.find((listItem) => listItem.id === item.listItemId);
    const isOpen = openId === item.id;
    const compatibleChoices = listItems.filter((listItem) => arePresentationsCompatible(listItem, item));
    return <Section key={item.id}>
      <PurchaseProductReviewCard item={{ ...item, sourceDescription: item.sourceDescription, unitLabel: item.unitLabel || 'un.' }} title={item.name || 'Produto sem nome'}
        included={Boolean(item.included)} selectionPending={Boolean(allowLink && !item.listItemId && !item.reviewed) || Boolean(standalone && !item.reviewed)}
        selectionLabel={standalone
          ? item.reviewed ? item.included ? 'Confirmado como produto novo' : 'Confirmado para ignorar'
            : item.included ? 'Revise e confirme a inclusão' : 'Escolha como tratar esta linha'
          : allowLink && !item.listItemId ? item.reviewed
            ? item.included ? 'Confirmado como produto novo; vínculo opcional' : 'Confirmado para ignorar; vínculo ainda pode ser alterado'
            : 'Aguardando vínculo com a lista' : undefined}
        expanded={isOpen} busy={busy}
        editorValues={editorValues(item)} editorErrors={checkoutEditorErrors(item)}
        onEditorChange={(key, value) => onEditorChange(item, key, value)}
        priceHint={isFiscal ? 'Os preços da nota são independentes e podem incluir descontos.' : 'Você pode informar o preço por unidade ou o total do item.'}
        editorNotice={item.requiresReview ? 'A descrição da nota pode conter informações ambíguas. Confira nome, marca e tamanho.' : null}
        categoryOpen={categoryOpenId === item.id}
        categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpenId(categoryOpenId === item.id ? null : item.id)}
        onSelectCategory={(category) => { patch(item, { category }); setCategoryOpenId(null); }}
        onToggleEdit={() => { setOpenId(isOpen ? null : item.id); setCategoryOpenId(null); }}
        onToggleIncluded={!standalone && (!allowLink || item.listItemId) ? () => {
          patch(item, { included: !item.included });
          setOpenId(null);
          setCategoryOpenId(null);
        } : undefined}>
      {showMatch && linked ? <LinkRoute>
        <ContextEyebrow>{item.matchStatus === 'automatic' ? 'VÍNCULO AUTOMÁTICO' : 'VÍNCULO MANUAL'}</ContextEyebrow>
        <LinkRouteLabel>ITEM CORRESPONDENTE NA LISTA</LinkRouteLabel>
        <LinkRouteValue>{linked.name}</LinkRouteValue>
      </LinkRoute> : null}
      {item.categoryConflict && item.included ? <Section>
        <Label>Categoria diferente da despensa</Label>
        <Muted>Lista: {categoryLabels[item.categoryConflict.listCategory] || item.categoryConflict.listCategory} · Despensa: {categoryLabels[item.categoryConflict.pantryCategory] || item.categoryConflict.pantryCategory}</Muted>
        <ChoiceRow>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: item.category === item.categoryConflict.listCategory, disabled: busy }}
            $selected={item.category === item.categoryConflict.listCategory} disabled={busy}
            onPress={() => patch(item, { category: item.categoryConflict.listCategory })}>
            <ChoiceText $selected={item.category === item.categoryConflict.listCategory}>Manter categoria da lista</ChoiceText>
          </Choice>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: item.category === item.categoryConflict.pantryCategory, disabled: busy }}
            $selected={item.category === item.categoryConflict.pantryCategory} disabled={busy}
            onPress={() => patch(item, { category: item.categoryConflict.pantryCategory })}>
            <ChoiceText $selected={item.category === item.categoryConflict.pantryCategory}>Usar categoria da despensa</ChoiceText>
          </Choice>
        </ChoiceRow>
      </Section> : null}
      {standalone ? <Section>
        <Label>O que fazer com este produto da nota?</Label>
        <DecisionList accessibilityRole="radiogroup" accessibilityLabel="Decisão para o produto da nota">
          <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: Boolean(item.included), disabled: busy }}
            $selected={Boolean(item.included)} disabled={busy}
            onPress={() => patch(item, { included: true, reviewed: false })}>
            <DecisionTitle $selected={Boolean(item.included)}>Adicionar como produto novo</DecisionTitle>
            <DecisionHint>Vai entrar na despensa sem vínculo com um item da lista.</DecisionHint>
          </DecisionOption>
          <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: !item.included && item.reviewed, disabled: busy }}
            $selected={!item.included && item.reviewed} disabled={busy}
            onPress={() => patch(item, { included: false, reviewed: true })}>
            <DecisionTitle $selected={!item.included && item.reviewed}>Ignorar esta linha</DecisionTitle>
            <DecisionHint>Não será adicionada à despensa.</DecisionHint>
          </DecisionOption>
        </DecisionList>
      </Section> : null}
      {item.included && Object.keys(checkoutItemErrors(item)).length ? <ErrorText accessibilityLiveRegion="polite">
        Complete os dados obrigatórios para incluir este produto: {Object.values(checkoutItemErrors(item)).join(' ')}
      </ErrorText> : null}
      {(item.needsReview || standalone) && !item.reviewed && item.included ? <ButtonClick
        disabled={busy || Object.keys(checkoutItemErrors(item)).length > 0}
        onPress={() => patch(item, { reviewed: true })}
        title="Confirmar este produto para a despensa" /> : null}
      {allowLink ? <Section>
        <Label>Qual produto da lista corresponde a esta linha?</Label>
        <Muted>Use cada produto da lista uma única vez. Se nenhum corresponder, siga adiante para decidir se este produto será novo ou ignorado.</Muted>
        <DecisionList accessibilityRole="radiogroup" accessibilityLabel="Produtos disponíveis na lista">
          {listItems.map((listItem) => {
            const alreadyUsed = linkedItems.some((other) => other.id !== item.id && other.listItemId === listItem.id);
            const compatible = arePresentationsCompatible(listItem, item);
            const unavailable = alreadyUsed || !compatible;
            const presentation = listItem.weight != null && listItem.unit
              ? `${listItem.weight} ${listItem.unit}` : 'Tamanho não informado na lista';
            return <DecisionOption key={listItem.id} accessibilityRole="radio"
              accessibilityLabel={`Relacionar com ${listItem.name}`}
              accessibilityState={{ checked: item.listItemId === listItem.id, disabled: busy || unavailable }}
              $selected={item.listItemId === listItem.id} disabled={busy || unavailable}
              onPress={() => patch(item, { listItemId: listItem.id, included: true, reviewed: true })}>
              <DecisionTitle $selected={item.listItemId === listItem.id}>{listItem.name}</DecisionTitle>
              <DecisionHint>{alreadyUsed ? 'Já relacionado a outra linha da nota'
                : !compatible ? 'Tamanho diferente; não pode ser vinculado'
                  : presentation}</DecisionHint>
            </DecisionOption>;
          })}
        </DecisionList>
        {listItems.length === 0 ? <Muted>Esta lista não tem itens para relacionar.</Muted>
          : compatibleChoices.filter((listItem) => !linkedItems.some((other) => other.id !== item.id && other.listItemId === listItem.id)).length === 0
            ? <Muted>Não há produtos da lista disponíveis com apresentação compatível. Você poderá adicionar esta linha como produto novo ou ignorá-la.</Muted>
            : null}
      </Section> : null}
      {showMatch && item.listItemId ? <Choice accessibilityRole="button" disabled={busy}
        onPress={() => patch(item, { listItemId: null, included: false, needsReview: true, reviewed: false })}>
        <ChoiceText>Desfazer vínculo e revisar</ChoiceText>
      </Choice> : null}
      </PurchaseProductReviewCard>
    </Section>;
  }

  function renderPlannedItem(item) {
    const draft = items.find((entry) => entry.id === `missing-${item.id}`);
    if (!draft) return null;
    const isOpen = openId === draft.id;
    return <Section key={item.id}>
      <PurchaseProductReviewCard item={draft} title={draft.name || item.name}
        included={Boolean(draft.included)} selectionPending={!draft.reviewed}
        selectionLabel={draft.reviewed
          ? draft.included ? 'Confirmado para adicionar manualmente' : 'Confirmado para deixar fora da despensa'
          : draft.included ? 'Revise os dados e confirme a inclusão' : 'Aguardando sua decisão'}
        expanded={isOpen} busy={busy}
        editorValues={editorValues(draft)} editorErrors={checkoutEditorErrors(draft)}
        onEditorChange={(key, value) => onEditorChange(draft, key, value)}
        priceHint="Você pode informar o preço por unidade ou o total do item."
        categoryOpen={categoryOpenId === draft.id} categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpenId(categoryOpenId === draft.id ? null : draft.id)}
        onSelectCategory={(category) => { patch(draft, { category }); setCategoryOpenId(null); }}
        onToggleEdit={() => { setOpenId(isOpen ? null : draft.id); setCategoryOpenId(null); }}
        >
      <Muted>Este produto estava na lista, mas não foi encontrado na nota. Escolha se ainda quer registrá-lo.</Muted>
      <DecisionList accessibilityRole="radiogroup" accessibilityLabel="Decisão para o produto ausente da nota">
        <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: Boolean(draft.included), disabled: busy }}
          $selected={Boolean(draft.included)} disabled={busy}
          onPress={() => patch(draft, { included: true, reviewed: false })}>
          <DecisionTitle $selected={Boolean(draft.included)}>Adicionar manualmente</DecisionTitle>
          <DecisionHint>Informe quantidade e preço para registrar na despensa.</DecisionHint>
        </DecisionOption>
        <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: !draft.included && draft.reviewed, disabled: busy }}
          $selected={!draft.included && draft.reviewed} disabled={busy}
          onPress={() => patch(draft, { included: false, reviewed: true })}>
          <DecisionTitle $selected={!draft.included && draft.reviewed}>Não adicionar</DecisionTitle>
          <DecisionHint>O produto ficará fora desta compra e da despensa.</DecisionHint>
        </DecisionOption>
      </DecisionList>
      {draft.categoryConflict && draft.included ? <Section>
        <Label>Categoria diferente da despensa</Label>
        <Muted>Lista: {categoryLabels[draft.categoryConflict.listCategory] || draft.categoryConflict.listCategory} · Despensa: {categoryLabels[draft.categoryConflict.pantryCategory] || draft.categoryConflict.pantryCategory}</Muted>
        <ChoiceRow>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: draft.category === draft.categoryConflict.listCategory, disabled: busy }}
            $selected={draft.category === draft.categoryConflict.listCategory} disabled={busy}
            onPress={() => patch(draft, { category: draft.categoryConflict.listCategory })}>
            <ChoiceText $selected={draft.category === draft.categoryConflict.listCategory}>Manter categoria da lista</ChoiceText>
          </Choice>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: draft.category === draft.categoryConflict.pantryCategory, disabled: busy }}
            $selected={draft.category === draft.categoryConflict.pantryCategory} disabled={busy}
            onPress={() => patch(draft, { category: draft.categoryConflict.pantryCategory })}>
            <ChoiceText $selected={draft.category === draft.categoryConflict.pantryCategory}>Usar categoria da despensa</ChoiceText>
          </Choice>
        </ChoiceRow>
      </Section> : null}
      {draft.included && Object.keys(checkoutItemErrors(draft)).length ? <ErrorText accessibilityLiveRegion="polite">
        Complete os dados obrigatórios para incluir este produto: {Object.values(checkoutItemErrors(draft)).join(' ')}
      </ErrorText> : null}
      {!draft.reviewed && draft.included ? <ButtonClick disabled={busy || Object.keys(checkoutItemErrors(draft)).length > 0}
        onPress={() => patch(draft, { reviewed: true })}
        title="Confirmar produto para a despensa" /> : null}
      </PurchaseProductReviewCard>
    </Section>;
  }

  function renderFinalSummary() {
    const excludedItems = items.filter((item) => !item.included &&
      !(String(item.id).startsWith('missing-') && linkedListIds.has(item.listItemId)));
    const contextMarket = selectedMarket?.localName || selectedMarket?.displayName || marketQuery?.trim() || 'Não informado';
    const editItem = (item, stepOverride) => {
      const nextStep = stepOverride || (String(item.id).startsWith('missing-') ? 'missing'
        : item.listItemId ? item.matchStatus === 'automatic' ? 'matches' : 'relate'
          : 'relate');
      if (nextStep === 'missing' || nextStep === 'unlinked') patch(item, { reviewed: false });
      setStepKey(nextStep);
      setOpenId(item.id);
      setCategoryOpenId(null);
    };
    const renderSummaryItem = (item) => {
      const linked = listItems.find((listItem) => listItem.id === item.listItemId);
      return <PurchaseProductReviewCard key={item.id}
        item={{ ...item, unitLabel: item.unitLabel || 'un.' }} title={item.name || 'Produto sem nome'}
        included={Boolean(item.included)} readOnly editorValues={editorValues(item)}>
        {linked ? <LinkRoute>
          <LinkRouteLabel>VINCULADO AO ITEM DA LISTA</LinkRouteLabel>
          <LinkRouteValue>{linked.name}</LinkRouteValue>
        </LinkRoute> : item.sourceDescription ? <LinkRoute>
          <LinkRouteLabel>ORIGEM</LinkRouteLabel>
          <LinkRouteValue>Produto novo, sem vínculo com a lista</LinkRouteValue>
        </LinkRoute> : null}
        <Muted>Categoria: {categoryLabels[item.category] || item.category || 'Não definida'}</Muted>
        {item.sourceDescription && !linked ? <ChoiceRow>
          <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item, 'relate')}>
            <ChoiceText>Rever vínculo</ChoiceText>
          </Choice>
          <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item, 'unlinked')}>
            <ChoiceText>Rever inclusão</ChoiceText>
          </Choice>
        </ChoiceRow> : <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item)}>
          <ChoiceText>{String(item.id).startsWith('missing-') ? 'Rever decisão e dados' : 'Editar dados e vínculo'}</ChoiceText>
        </Choice>}
      </PurchaseProductReviewCard>;
    };
    return <>
      <PurchaseContext>
        <ContextEyebrow>RESUMO DA COMPRA</ContextEyebrow>
        <ContextRow><ContextLabel>Lista</ContextLabel><ContextValue>{list.name || 'Lista de compras'}</ContextValue></ContextRow>
        {purchase?.merchantName ? <ContextRow><ContextLabel>Na nota</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
        <ContextRow><ContextLabel>Mercado</ContextLabel><ContextValue>{contextMarket}</ContextValue></ContextRow>
        <ContextRow><ContextLabel>Data da compra</ContextLabel><ContextValue>{dateValue || 'Não identificada'}</ContextValue></ContextRow>
        {purchase?.totalAmount != null ? <ContextRow><ContextLabel>Total da nota</ContextLabel><ContextValue>{formatMoney(purchase.totalAmount)}</ContextValue></ContextRow> : null}
      </PurchaseContext>
      <SummaryBanner>
        <SummaryBannerTitle>{includedItems.length
          ? `${includedItems.length} ${includedItems.length === 1 ? 'produto vai' : 'produtos vão'} para a despensa`
          : 'Nenhum produto vai para a despensa'}</SummaryBannerTitle>
        <SummaryBannerText>{includedItems.length
          ? `Revise os nomes, marcas, tamanhos, quantidades e valores abaixo. Subtotal selecionado: ${formatMoney(total)}.`
          : 'A lista será concluída e ficará no histórico, sem adicionar produtos ao estoque.'}</SummaryBannerText>
      </SummaryBanner>
      <Section>
        <SectionTitle>Como os produtos vão aparecer</SectionTitle>
        {includedItems.length ? includedItems.map(renderSummaryItem) : <Muted>Nenhum produto selecionado para a despensa.</Muted>}
      </Section>
      {excludedItems.length ? <Section>
        <SectionTitle>Fora da despensa</SectionTitle>
        <Muted>Estes itens foram ignorados ou não serão comprados nesta lista.</Muted>
        {excludedItems.map(renderSummaryItem)}
      </Section> : null}
      {includedItems.length ? <SummaryBanner>
        <SummaryBannerTitle>Soma e exibição na despensa</SummaryBannerTitle>
        <SummaryBannerText>Produtos com o mesmo nome normalizado e tamanho compatível somam no saldo; tamanhos diferentes ficam separados. Se houver marcas distintas compatíveis, você poderá escolher se aparecem juntas ou separadas. Essa escolha não une as compras.</SummaryBannerText>
      </SummaryBanner> : null}
    </>;
  }

  function renderPurchaseDetails() {
    return <>
      <PurchaseContext>
        <ContextEyebrow>{isFiscal ? 'DADOS LIDOS DA NOTA' : 'DADOS DA COMPRA'}</ContextEyebrow>
        <ContextRow><ContextLabel>Lista</ContextLabel><ContextValue>{list.name || 'Lista de compras'}</ContextValue></ContextRow>
        {isFiscal && purchase?.merchantName ? <ContextRow><ContextLabel>Na nota</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
        {isFiscal && purchase?.totalAmount != null ? <ContextRow><ContextLabel>Total da nota</ContextLabel><ContextValue>{formatMoney(purchase.totalAmount)}</ContextValue></ContextRow> : null}
        <Section>
          <Label>{isFiscal ? 'Data registrada na nota' : 'Data da compra'}</Label>
          {dateReadOnly ? <DateSummary accessible accessibilityLabel={`Data da compra extraída da nota fiscal: ${dateValue || 'indisponível'}`}>
            <DateValue>{dateValue || 'Data não identificada'}</DateValue>
          </DateSummary> : <FormField accessibilityLabel="Data da compra, formato dia, mês e ano" value={dateValue}
            editable={!busy} placeholder="DD/MM/AAAA" onChangeText={onChangeDate} />}
        </Section>
        <Section>
          <Label>Mercado da compra (opcional)</Label>
          <PlaceSearchField value={marketQuery} selected={Boolean(selectedMarket)} selectedPlace={selectedMarket}
            disabled={busy} Icon={LocationIcon} accessibilityLabel="Mercado da compra, opcional"
            placeholder="Mercado da compra (opcional)" onChangeText={onChangeMarketQuery} onSelect={onSelectMarket} />
          {selectedMarket ? <Muted>Mercado escolhido na lista de compras. Você pode alterá-lo aqui.</Muted> : null}
        </Section>
      </PurchaseContext>
    </>;
  }

  function renderCompactPurchaseContext() {
    const contextMarket = selectedMarket?.localName || selectedMarket?.displayName || marketQuery?.trim() || 'Não informado';
    return <PurchaseContext>
      <ContextHeader><ContextEyebrow>COMPRA EM REVISÃO</ContextEyebrow></ContextHeader>
      <ContextRow><ContextLabel>Lista</ContextLabel><ContextValue>{list.name || 'Lista de compras'}</ContextValue></ContextRow>
      {purchase?.merchantName ? <ContextRow><ContextLabel>Na nota</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
      <ContextRow><ContextLabel>Mercado</ContextLabel><ContextValue>{contextMarket}</ContextValue></ContextRow>
      <ContextRow><ContextLabel>Data</ContextLabel><ContextValue>{dateValue || 'Não identificada'}</ContextValue></ContextRow>
      <Choice accessibilityRole="button" disabled={busy} onPress={() => setStepKey(activeSteps[0]?.key || 'summary')}>
        <ChoiceText>Editar os dados da compra</ChoiceText>
      </Choice>
    </PurchaseContext>;
  }

  const renderFiscalStep = () => {
    if (currentStepKey === 'matches') return autoMatchedItems.length
      ? autoMatchedItems.map((item) => renderReceiptItem(item, { showMatch: true }))
      : <Muted>Os vínculos automáticos foram desfeitos. Continue para relacionar os produtos manualmente.</Muted>;
    if (currentStepKey === 'relate') return <>
      {unmatchedReceiptItems.map((item) => renderReceiptItem(item, { allowLink: true }))}
      {manuallyLinkedItems.map((item) => renderReceiptItem(item, { showMatch: true }))}
      {!unmatchedReceiptItems.length ? <SummaryBanner>
        <SummaryBannerTitle>Todos os produtos restantes estão relacionados ou tratados</SummaryBannerTitle>
        <SummaryBannerText>Continue para conferir os itens da lista que não apareceram na nota.</SummaryBannerText>
      </SummaryBanner> : null}
    </>;
    if (currentStepKey === 'missing') return unmatchedListItems.length
      ? unmatchedListItems.map(renderPlannedItem)
      : <SummaryBanner>
        <SummaryBannerTitle>Todos os itens da lista foram tratados</SummaryBannerTitle>
        <SummaryBannerText>Continue para decidir sobre as linhas da nota que ainda não têm vínculo.</SummaryBannerText>
      </SummaryBanner>;
    if (currentStepKey === 'unlinked') return unmatchedReceiptItems.length
      ? unmatchedReceiptItems.map((item) => renderReceiptItem(item, { standalone: true }))
      : <SummaryBanner>
        <SummaryBannerTitle>Não há linhas da nota sem vínculo</SummaryBannerTitle>
        <SummaryBannerText>Continue para conferir o resultado final da compra.</SummaryBannerText>
      </SummaryBanner>;
    return renderFinalSummary();
  };

  const canGoNext = stepIndex < activeSteps.length - 1;
  const stepReviewCount = !isFiscal ? reviewCount
    : currentStepKey === 'matches' ? autoMatchedItems.filter((item) => item.needsReview && !item.reviewed).length
      : currentStepKey === 'missing' ? pendingListItems.filter((item) => {
        const draft = items.find((entry) => entry.id === `missing-${item.id}`);
        return draft && !draft.reviewed;
      }).length
        : currentStepKey === 'unlinked' ? pendingUnlinkedReceiptItems.filter((item) => !item.reviewed).length
          : currentStepKey === 'summary' ? reviewCount : 0;
  const canContinue = canGoNext && !busy && incompleteIncludedItems.length === 0 &&
    !(currentStepKey === 'matches' && stepReviewCount > 0) &&
    !(currentStepKey === 'missing' && pendingListItems.length > 0) &&
    !(currentStepKey === 'unlinked' && pendingUnlinkedReceiptItems.length > 0);
  const canConfirm = !busy && reviewCount === 0 && incompleteIncludedItems.length === 0;
  const nextStep = () => setStepKey(activeSteps[Math.min(stepIndex + 1, activeSteps.length - 1)].key);
  const previousStep = () => {
    setStepKey(activeSteps[Math.max(stepIndex - 1, 0)].key);
    setOpenId(null);
    setCategoryOpenId(null);
  };
  const restartReview = () => {
    onResetItems?.(initialReviewRef.current.items.map((item) => ({ ...item })));
    setStepKey(initialReviewRef.current.stepKey);
    setOpenId(null);
    setCategoryOpenId(null);
  };
  const nextStepTitle = activeSteps[stepIndex + 1]?.title;
  const confirmationTitle = includedItems.length
    ? `Adicionar ${includedItems.length} ${includedItems.length === 1 ? 'produto' : 'produtos'} à despensa`
    : 'Concluir compra sem produtos';

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <ModalRoot edges={['top', 'right', 'bottom', 'left']}>
      <Header>
        <HeaderRow>
          <Title>Finalizar compra</Title>
          <ModalActionButton Icon={CancelCircleIcon} accessibilityLabel="Fechar revisão da compra"
            disabled={busy} onPress={onClose} variant="cancel" />
        </HeaderRow>
        <Muted>{isFiscal
          ? 'A nota já foi lida. Siga as etapas para conferir vínculos e decidir o que vai para a despensa.'
          : 'Confira os dados e os produtos antes de concluir a compra.'}</Muted>
      </Header>
      <Content>
        <ContentInner>
          {isFiscal ? <StepHeader>
            <StepCounter>PASSO {stepIndex + 1} DE {activeSteps.length}</StepCounter>
            <StepTitle>{currentStep.title}</StepTitle>
            <Muted>{currentStep.description}</Muted>
            <ProgressTrack accessibilityRole="progressbar" accessibilityLabel={currentStep.title}
              accessibilityValue={{ min: 1, max: activeSteps.length, now: stepIndex + 1 }}>
              {activeSteps.map((entry, index) => <ProgressChip key={entry.key}
                $active={index === stepIndex} $complete={index < stepIndex}>
                <ProgressChipText $active={index === stepIndex} $complete={index < stepIndex}>
                  {stageLabels[entry.key]}
                </ProgressChipText>
              </ProgressChip>)}
            </ProgressTrack>
          </StepHeader> : null}

          {!isFiscal ? renderPurchaseDetails()
            : currentStepKey === 'summary' ? null
              : stepIndex === 0 ? renderPurchaseDetails() : renderCompactPurchaseContext()}

          {isFiscal ? renderFiscalStep() : <>
            <Section><SectionTitle>Produtos da compra</SectionTitle>
              <Muted>Confira os dados que serão salvos em cada ocorrência da despensa.</Muted>
            </Section>
            {items.map((item) => renderReceiptItem(item))}
          </>}
          {error ? <ErrorText accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</ErrorText> : null}
        </ContentInner>
      </Content>
      <Footer>
        <Muted>Resumo desta revisão</Muted>
        <SummaryRow>
          <Label>{includedItems.length
            ? `${includedItems.length} ${includedItems.length === 1 ? 'produto selecionado' : 'produtos selecionados'}`
            : 'Nenhum produto selecionado'}</Label>
        </SummaryRow>
        <SummaryRow><Label>Subtotal selecionado</Label><SummaryValue>{formatMoney(total)}</SummaryValue></SummaryRow>
        {stepReviewCount ? <ErrorText accessibilityLiveRegion="polite">
          {currentStepKey === 'missing'
            ? `Confirme o que fazer com ${stepReviewCount === 1 ? 'este produto' : 'estes produtos'} usando as opções em cada card.`
            : currentStepKey === 'unlinked'
              ? `Confirme se vai adicionar ou ignorar ${stepReviewCount === 1 ? 'esta linha' : 'estas linhas'} da nota.`
              : currentStepKey === 'summary'
                ? `${stepReviewCount} ${stepReviewCount === 1 ? 'decisão ainda precisa' : 'decisões ainda precisam'} ser resolvidas antes de finalizar.`
                : `${stepReviewCount} ${stepReviewCount === 1 ? 'produto precisa' : 'produtos precisam'} de revisão nesta etapa.`}
        </ErrorText> : null}
        {incompleteIncludedItems.length ? <ErrorText accessibilityLiveRegion="polite">
          Complete os campos obrigatórios de {incompleteIncludedItems.length === 1 ? '1 produto' : `${incompleteIncludedItems.length} produtos`} para continuar.
        </ErrorText> : null}
        {busy ? <ActivityIndicator accessibilityLabel="Confirmando compra" color="#228B22" /> : null}
        {isFiscal && canGoNext ? <>
          {nextStepTitle ? <Muted>Próximo: {nextStepTitle}.</Muted> : null}
          <ButtonClick disabled={!canContinue} onPress={nextStep} title="Continuar" />
        </> : <ButtonClick accessibilityLabel={confirmationTitle} disabled={!canConfirm}
          onPress={onConfirm} title={busy ? 'Finalizando compra...' : confirmationTitle} />}
        {isFiscal && stepIndex > 0 ? <Choice accessibilityRole="button" disabled={busy} onPress={previousStep}>
          <ChoiceText>Voltar uma etapa</ChoiceText>
        </Choice> : null}
        {isFiscal && currentStepKey === 'summary' && stepIndex > 0 ? <Choice accessibilityRole="button" disabled={busy} onPress={restartReview}>
          <ChoiceText>Descartar decisões e recomeçar</ChoiceText>
        </Choice> : null}
      </Footer>
    </ModalRoot>
  </Modal>;
}

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
  DateValue, ErrorText, Footer, Header, HeaderRow, Label, ModalRoot, Muted,
  Section, SectionTitle, StepCounter, StepDot, StepHeader, StepTitle, SummaryRow,
  SummaryValue, Title,
} from './styles';

const categoryLabels = {
  bebidas: 'Bebidas', organicos: 'Orgânicos', limpezaHigiene: 'Limpeza e higiene',
  integraisCereais: 'Integrais e cereais', frescos: 'Frescos', carnes: 'Carnes', outros: 'Outros',
};
const stageOrder = ['matches', 'relate', 'missing', 'unlinked', 'summary'];
const numberValue = (value) => Number(String(value ?? '').replace(',', '.'));
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
  const [stepKey, setStepKey] = useState('matches');
  const [openId, setOpenId] = useState(null);
  const [categoryOpenId, setCategoryOpenId] = useState(null);
  const initialReviewRef = useRef({ items: [], stepKey: 'summary' });
  const isFiscal = mode === 'nfce';
  const listItems = Array.isArray(list.items) ? list.items : [];
  const receiptItems = items.filter((item) => Boolean(item.sourceDescription));
  const linkedItems = receiptItems.filter((item) => Boolean(item.listItemId));
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
    { key: 'matches', title: 'Correspondências encontradas', description: 'Confira os vínculos que o sistema identificou automaticamente.', hasItems: linkedItems.length > 0 },
    { key: 'relate', title: 'Relacionar itens da nota', description: 'Associe cada produto restante da nota a um único item da lista.', hasItems: pendingUnlinkedReceiptItems.length > 0 },
    { key: 'missing', title: 'Itens da lista não encontrados', description: 'Escolha quais produtos ausentes da nota serão adicionados manualmente.', hasItems: pendingListItems.length > 0 },
    { key: 'unlinked', title: 'Produtos sem vínculo', description: 'Decida se cada linha restante da nota entra como um produto novo ou será ignorada.', hasItems: pendingUnlinkedReceiptItems.length > 0 },
  ].filter((entry) => entry.hasItems);
  const activeSteps = [...steps, {
    key: 'summary', title: 'Resultado da compra',
    description: 'Confira o que será adicionado à despensa antes de confirmar.', hasItems: true,
  }];
  const currentStepIndex = activeSteps.findIndex((entry) => entry.key === stepKey);
  const nextStepIndex = activeSteps.findIndex((entry) => stageOrder.indexOf(entry.key) > stageOrder.indexOf(stepKey));
  const stepIndex = currentStepIndex >= 0 ? currentStepIndex : nextStepIndex >= 0 ? nextStepIndex : activeSteps.length - 1;
  const currentStepKey = activeSteps[stepIndex].key;
  const currentStep = activeSteps[stepIndex];

  useEffect(() => {
    if (visible) {
      initialReviewRef.current = {
        items: items.map((item) => ({ ...item })),
        stepKey: activeSteps[0]?.key || 'summary',
      };
      setStepKey(activeSteps[0]?.key || 'matches');
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
    return <Section key={item.id}>
      <PurchaseProductReviewCard item={{ ...item, sourceDescription: item.sourceDescription, unitLabel: item.unitLabel || 'un.' }} title={item.name || 'Produto sem nome'}
        included={Boolean(item.included)} expanded={isOpen} busy={busy}
        editorValues={editorValues(item)} editorErrors={checkoutEditorErrors(item)}
        onEditorChange={(key, value) => onEditorChange(item, key, value)}
        priceHint={isFiscal ? 'Os preços da nota são independentes e podem incluir descontos.' : 'Você pode informar o preço por unidade ou o total do item.'}
        editorNotice={item.requiresReview ? 'A descrição da nota pode conter informações ambíguas. Confira nome, marca e tamanho.' : null}
        categoryOpen={categoryOpenId === item.id}
        categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpenId(categoryOpenId === item.id ? null : item.id)}
        onSelectCategory={(category) => { patch(item, { category }); setCategoryOpenId(null); }}
        onToggleEdit={() => { setOpenId(isOpen ? null : item.id); setCategoryOpenId(null); }}
        onToggleIncluded={!allowLink || item.listItemId ? () => {
          patch(item, { included: !item.included });
          setOpenId(null);
          setCategoryOpenId(null);
        } : undefined}>
      {showMatch ? <Muted>
        {item.matchStatus === 'automatic' ? 'Vínculo sugerido pelo sistema' : 'Vínculo escolhido por você'}: {linked?.name || 'sem vínculo'}
      </Muted> : null}
      {item.categoryConflict ? <Section>
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
      {standalone ? <Muted>{item.reviewed
        ? item.included ? 'Será adicionado como produto novo.' : 'Será ignorado.'
        : 'Escolha adicionar como produto novo ou ignorar esta linha.'}</Muted> : null}
      {item.included && Object.keys(checkoutItemErrors(item)).length ? <ErrorText accessibilityLiveRegion="polite">
        Complete os dados obrigatórios para incluir este produto: {Object.values(checkoutItemErrors(item)).join(' ')}
      </ErrorText> : null}
      {(item.needsReview || standalone) && !item.reviewed ? item.included
        ? <ButtonClick disabled={busy || Object.keys(checkoutItemErrors(item)).length > 0} onPress={() => patch(item, { reviewed: true })}>
          Confirmar inclusão como novo produto
        </ButtonClick>
        : <ChoiceRow><Choice accessibilityRole="button" disabled={busy}
          onPress={() => patch(item, { included: false, reviewed: true })}>
          <ChoiceText>Confirmar que será ignorado</ChoiceText>
        </Choice></ChoiceRow> : null}
      {allowLink ? <Section>
        <Label>Relacionar com um item da lista</Label>
        <ChoiceRow>
          {listItems.map((listItem) => {
            const alreadyUsed = linkedItems.some((other) => other.id !== item.id && other.listItemId === listItem.id);
            const compatible = arePresentationsCompatible(listItem, item);
            const unavailable = alreadyUsed || !compatible;
            return <Choice key={listItem.id} accessibilityRole="radio"
              accessibilityLabel={`Relacionar com ${listItem.name}`}
              accessibilityState={{ checked: item.listItemId === listItem.id, disabled: busy || unavailable }}
              $selected={item.listItemId === listItem.id} disabled={busy || unavailable}
              onPress={() => patch(item, { listItemId: listItem.id, included: true, reviewed: true })}>
              <ChoiceText $selected={item.listItemId === listItem.id}>
                {listItem.name}{alreadyUsed ? ' · já relacionado' : !compatible ? ' · tamanho diferente' : ''}
              </ChoiceText>
            </Choice>;
          })}
        </ChoiceRow>
        {listItems.length === 0 ? <Muted>Esta lista não tem itens para relacionar.</Muted> : null}
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
        included={Boolean(draft.included)} expanded={isOpen} busy={busy}
        editorValues={editorValues(draft)} editorErrors={checkoutEditorErrors(draft)}
        onEditorChange={(key, value) => onEditorChange(draft, key, value)}
        priceHint="Você pode informar o preço por unidade ou o total do item."
        categoryOpen={categoryOpenId === draft.id} categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpenId(categoryOpenId === draft.id ? null : draft.id)}
        onSelectCategory={(category) => { patch(draft, { category }); setCategoryOpenId(null); }}
        onToggleEdit={() => { setOpenId(isOpen ? null : draft.id); setCategoryOpenId(null); }}
        onToggleIncluded={() => {
          patch(draft, { included: !draft.included });
          setOpenId(null);
          setCategoryOpenId(null);
        }}>
      <Muted>{draft.reviewed ? draft.included
        ? 'Será registrado manualmente na despensa.' : 'Este produto não será adicionado.'
        : 'Este item não apareceu na nota. Escolha adicionar manualmente ou confirmar que não será comprado.'}</Muted>
      {draft.categoryConflict ? <Section>
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
      {!draft.reviewed && !draft.included ? <Choice accessibilityRole="button" disabled={busy}
        onPress={() => patch(draft, { reviewed: true })}>
        <ChoiceText>Confirmar que não será adicionado</ChoiceText>
      </Choice> : null}
      {draft.included && Object.keys(checkoutItemErrors(draft)).length ? <ErrorText accessibilityLiveRegion="polite">
        Complete os dados obrigatórios para incluir este produto: {Object.values(checkoutItemErrors(draft)).join(' ')}
      </ErrorText> : null}
      {!draft.reviewed && draft.included ? <ButtonClick disabled={busy || Object.keys(checkoutItemErrors(draft)).length > 0}
        onPress={() => patch(draft, { reviewed: true })}>
        Confirmar inclusão manual na despensa
      </ButtonClick> : null}
      </PurchaseProductReviewCard>
    </Section>;
  }

  function renderFinalSummary() {
    const excludedItems = items.filter((item) => !item.included &&
      !(String(item.id).startsWith('missing-') && linkedListIds.has(item.listItemId)));
    return <>
      <Section>
        <SectionTitle>{list.name || 'Lista de compras'}</SectionTitle>
        <Muted>{purchase?.merchantName || marketQuery || 'Mercado não informado'} · {dateValue || 'Data não identificada'}</Muted>
      </Section>
      <Section>
        <SectionTitle>Produtos que serão adicionados</SectionTitle>
        <Muted>{includedItems.length
          ? `${includedItems.length} ${includedItems.length === 1 ? 'produto será adicionado' : 'produtos serão adicionados'} à despensa.`
          : 'Nenhum produto será adicionado à despensa.'}</Muted>
        {includedItems.map((item) => <PurchaseProductReviewCard key={item.id}
          item={{ ...item, unitLabel: item.unitLabel || 'un.' }} title={item.name || 'Produto sem nome'}
          included readOnly editorValues={editorValues(item)} />)}
      </Section>
      {excludedItems.length ? <Section>
        <SectionTitle>Produtos que serão ignorados</SectionTitle>
        {excludedItems.map((item) => <PurchaseProductReviewCard key={item.id}
          item={{ ...item, unitLabel: item.unitLabel || 'un.' }} title={item.name || 'Produto sem nome'}
          included={false} readOnly editorValues={editorValues(item)} />)}
      </Section> : null}
    </>;
  }

  function renderPurchaseDetails() {
    return <>
      <Section>
        <SectionTitle>{list.name || 'Lista de compras'}</SectionTitle>
        <Muted>{isFiscal && purchase?.merchantName ? `Nota de ${purchase.merchantName}` : 'Confira os dados antes de finalizar.'}</Muted>
      </Section>
      <Section>
        <Label>Data da compra</Label>
        {dateReadOnly ? <DateSummary accessible accessibilityLabel={`Data da compra extraída da nota fiscal: ${dateValue || 'indisponível'}`}>
          <Muted>Data registrada na nota fiscal</Muted><DateValue>{dateValue || 'Data não identificada'}</DateValue>
        </DateSummary> : <FormField accessibilityLabel="Data da compra, formato dia, mês e ano" value={dateValue}
          editable={!busy} placeholder="DD/MM/AAAA" onChangeText={onChangeDate} />}
      </Section>
      <Section>
        <Label>Mercado (opcional)</Label>
        <PlaceSearchField value={marketQuery} selected={Boolean(selectedMarket)} selectedPlace={selectedMarket}
          disabled={busy} Icon={LocationIcon} accessibilityLabel="Mercado da compra, opcional"
          placeholder="Mercado da compra (opcional)" onChangeText={onChangeMarketQuery} onSelect={onSelectMarket} />
      </Section>
    </>;
  }

  const renderFiscalStep = () => {
    if (currentStepKey === 'matches') return linkedItems.map((item) => renderReceiptItem(item, { showMatch: true }));
    if (currentStepKey === 'relate') return pendingUnlinkedReceiptItems.map((item) => renderReceiptItem(item, { allowLink: true }));
    if (currentStepKey === 'missing') return pendingListItems.map(renderPlannedItem);
    if (currentStepKey === 'unlinked') return pendingUnlinkedReceiptItems.map((item) => renderReceiptItem(item, { standalone: true }));
    return renderFinalSummary();
  };

  const canGoNext = stepIndex < activeSteps.length - 1;
  const canContinue = canGoNext && !busy && incompleteIncludedItems.length === 0 &&
    !(currentStepKey === 'missing' && pendingListItems.length > 0) &&
    !(currentStepKey === 'unlinked' && pendingUnlinkedReceiptItems.length > 0);
  const canConfirm = !busy && reviewCount === 0 && incompleteIncludedItems.length === 0;
  const nextStep = () => setStepKey(activeSteps[Math.min(stepIndex + 1, activeSteps.length - 1)].key);
  const previousStep = () => {
    if (currentStepKey === 'summary') {
      onResetItems?.(initialReviewRef.current.items.map((item) => ({ ...item })));
      setStepKey(initialReviewRef.current.stepKey);
      setOpenId(null);
      setCategoryOpenId(null);
      return;
    }
    setStepKey(activeSteps[Math.max(stepIndex - 1, 0)].key);
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <ModalRoot>
      <Header>
        <HeaderRow>
          <Title>Revisar compra</Title>
          <ModalActionButton Icon={CancelCircleIcon} accessibilityLabel="Fechar revisão da compra"
            disabled={busy} onPress={onClose} variant="cancel" />
        </HeaderRow>
        <Muted>{isFiscal ? 'Revise cada etapa antes de adicionar produtos à despensa.' : 'Confira os dados da compra antes de adicionar à despensa.'}</Muted>
      </Header>
      <Content>
        <ContentInner>
          {isFiscal && activeSteps.length > 1 ? <StepHeader>
            <StepCounter>ETAPA {stepIndex + 1} DE {activeSteps.length}</StepCounter>
            <StepTitle>{currentStep.title}</StepTitle>
            <Muted>{currentStep.description}</Muted>
            <ChoiceRow>{activeSteps.map((entry, index) => <StepDot key={entry.key} $active={index === stepIndex} />)}</ChoiceRow>
          </StepHeader> : null}

          {!isFiscal || currentStepKey === 'matches' ? renderPurchaseDetails() : currentStepKey === 'summary' ? null : <Section>
            <SectionTitle>{list.name || 'Lista de compras'}</SectionTitle>
            <Muted>{purchase?.merchantName || 'Compra por NFC-e'} · {dateValue}</Muted>
          </Section>}

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
        <SummaryRow>
          <Label>{includedItems.length ? `${includedItems.length} ${includedItems.length === 1 ? 'produto incluído' : 'produtos incluídos'}` : 'Nenhum produto será adicionado'}</Label>
          <SummaryValue>{`R$ ${total.toFixed(2).replace('.', ',')}`}</SummaryValue>
        </SummaryRow>
        {reviewCount ? <ErrorText accessibilityLiveRegion="polite">{reviewCount} {reviewCount === 1 ? 'produto precisa' : 'produtos precisam'} de uma decisão antes de finalizar.</ErrorText> : null}
        {incompleteIncludedItems.length ? <ErrorText accessibilityLiveRegion="polite">
          Preencha os dados obrigatórios de {incompleteIncludedItems.length === 1 ? '1 produto' : `${incompleteIncludedItems.length} produtos`} antes de avançar.
        </ErrorText> : null}
        {busy ? <ActivityIndicator accessibilityLabel="Confirmando compra" color="#228B22" /> : null}
        {isFiscal && (stepIndex > 0 || currentStepKey === 'summary') ? <Choice accessibilityRole="button" disabled={busy} onPress={previousStep}>
          <ChoiceText>{currentStepKey === 'summary' ? 'Voltar ao início e refazer' : 'Voltar'}</ChoiceText>
        </Choice> : null}
        {isFiscal && canGoNext ? <ButtonClick disabled={!canContinue} onPress={nextStep} title="Continuar" />
          : <ButtonClick accessibilityLabel="Confirmar conclusão da compra" disabled={!canConfirm}
            onPress={onConfirm} title={busy ? 'Confirmando compra...' : 'Confirmar compra'} />}
      </Footer>
    </ModalRoot>
  </Modal>;
}

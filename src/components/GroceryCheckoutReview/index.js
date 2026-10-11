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
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
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

const stageOrder = ['matches', 'relate', 'missing', 'unlinked', 'summary'];
const stageLabelKeys = {
  matches: 'shopping.step.matches', relate: 'shopping.step.relate', missing: 'shopping.step.missing',
  unlinked: 'shopping.step.unlinked', summary: 'shopping.step.summary',
};
const numberValue = (value) => Number(String(value ?? '').replace(',', '.'));
const formatMoney = (value, language) => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));
const itemTotal = (item) => {
  const price = numberValue(item.priceInput);
  const quantity = numberValue(item.quantity) || 0;
  return Number.isFinite(price) ? (item.priceMode === 'total' ? price : price * quantity) : 0;
};
const checkoutItemErrors = (item, t) => {
  const errors = {};
  const name = String(item.name ?? '').trim();
  const brand = String(item.brand ?? '').trim();
  const quantity = numberValue(item.quantity);
  const contentText = String(item.contentValue ?? '').trim();
  const contentValue = contentText ? numberValue(contentText) : null;
  const enteredPrice = numberValue(item.priceInput);
  const totalPrice = item.priceMode === 'unit' ? enteredPrice * quantity : enteredPrice;

  if (!name || name.length > 120) errors.name = t('shopping.validation.name');
  if (brand.length > 100) errors.brand = t('shopping.validation.brand');
  if (!Number.isSafeInteger(quantity) || quantity < 1) errors.quantity = t('shopping.validation.quantity');
  if (contentText && (!Number.isFinite(contentValue) || contentValue <= 0)) errors.contentValue = t('shopping.validation.size');
  if (contentText && !['g', 'kg', 'ml', 'L'].includes(item.unit)) errors.unit = t('shopping.validation.unit');
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) errors.price = t('shopping.validation.price');
  if (!PRODUCT_CATEGORIES.includes(item.category)) errors.category = t('shopping.validation.category');
  if (item.categoryConflict && (!item.categoryResolved ||
    ![item.categoryConflict.listCategory, item.categoryConflict.pantryCategory].includes(item.category))) {
    errors.category = t('shopping.validation.categoryConflict');
  }
  return errors;
};
const checkoutEditorErrors = (item, t, errors = checkoutItemErrors(item, t)) => ({
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
  const { language, t } = useAppPreferences();
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
    (item.included && Object.keys(checkoutItemErrors(item, t)).length > 0));
  const unmatchedListItems = listItems.filter((item) => !linkedListIds.has(item.id));
  const pendingListItems = unmatchedListItems.filter((item) => {
    const draft = items.find((entry) => entry.id === `missing-${item.id}`);
    return draft && (!draft.reviewed || (draft.included && Object.keys(checkoutItemErrors(draft, t)).length > 0));
  });
  const includedItems = items.filter((item) => item.included);
  const incompleteIncludedItems = includedItems.filter((item) => Object.keys(checkoutItemErrors(item, t)).length > 0);
  const total = includedItems.reduce((sum, item) => sum + itemTotal(item), 0);
  const reviewCount = items.filter((item) => !item.reviewed && (
    item.needsReview || (item.sourceDescription && !item.listItemId) || String(item.id).startsWith('missing-')
  )).length;
  const steps = [
    { key: 'matches', title: t('shopping.reviewMatchesTitle'), description: t('shopping.reviewMatchesDescription'), hasItems: autoMatchedItems.length > 0 || stepKey === 'matches' },
    { key: 'relate', title: t('shopping.reviewRelateTitle'), description: t('shopping.reviewRelateDescription'), hasItems: pendingUnlinkedReceiptItems.length > 0 || manuallyLinkedItems.length > 0 || stepKey === 'relate' },
    { key: 'missing', title: t('shopping.reviewMissingTitle'), description: t('shopping.reviewMissingDescription'), hasItems: pendingListItems.length > 0 || stepKey === 'missing' },
    { key: 'unlinked', title: t('shopping.reviewUnlinkedTitle'), description: t('shopping.reviewUnlinkedDescription'), hasItems: pendingUnlinkedReceiptItems.length > 0 || stepKey === 'unlinked' },
  ].filter((entry) => entry.hasItems);
  const activeSteps = [...steps, {
    key: 'summary', title: t('shopping.reviewSummaryTitle'),
    description: t('shopping.reviewSummaryDescription'), hasItems: true,
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
      <PurchaseProductReviewCard item={{ ...item, sourceDescription: item.sourceDescription, unitLabel: item.unitLabel || t('shopping.unitAbbreviation') }} title={item.name || t('shopping.productWithoutName')}
        included={Boolean(item.included)} selectionPending={Boolean(allowLink && !item.listItemId && !item.reviewed) || Boolean(standalone && !item.reviewed)}
        selectionLabel={standalone
          ? item.reviewed ? item.included ? t('shopping.confirmedNewOptionalLink') : t('shopping.confirmedIgnoreCanChange')
            : item.included ? t('shopping.reviewAndConfirm') : t('shopping.chooseLineAction')
          : allowLink && !item.listItemId ? item.reviewed
            ? item.included ? t('shopping.confirmedNewOptionalLink') : t('shopping.confirmedIgnoreCanChange')
            : t('shopping.waitingListLink') : undefined}
        expanded={isOpen} busy={busy}
        editorValues={editorValues(item)} editorErrors={checkoutEditorErrors(item, t)}
        onEditorChange={(key, value) => onEditorChange(item, key, value)}
        priceHint={isFiscal ? t('shopping.receiptPriceHint') : t('shopping.unitOrTotalPriceHint')}
        editorNotice={item.requiresReview ? t('shopping.ambiguousReceiptDescription') : null}
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
        <ContextEyebrow>{item.matchStatus === 'automatic' ? t('shopping.automaticLink') : t('shopping.manualLink')}</ContextEyebrow>
        <LinkRouteLabel>{t('shopping.correspondingListItem')}</LinkRouteLabel>
        <LinkRouteValue>{linked.name}</LinkRouteValue>
      </LinkRoute> : null}
      {item.categoryConflict && item.included ? <Section>
        <Label>{t('shopping.categoryConflict')}</Label>
        <Muted>{t('shopping.listCategory', { category: t(`product.category.${item.categoryConflict.listCategory}`) })} · {t('shopping.pantryCategory', { category: t(`product.category.${item.categoryConflict.pantryCategory}`) })}</Muted>
        <ChoiceRow>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: item.category === item.categoryConflict.listCategory, disabled: busy }}
            $selected={item.category === item.categoryConflict.listCategory} disabled={busy}
            onPress={() => patch(item, { category: item.categoryConflict.listCategory })}>
            <ChoiceText $selected={item.category === item.categoryConflict.listCategory}>{t('shopping.keepListCategory')}</ChoiceText>
          </Choice>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: item.category === item.categoryConflict.pantryCategory, disabled: busy }}
            $selected={item.category === item.categoryConflict.pantryCategory} disabled={busy}
            onPress={() => patch(item, { category: item.categoryConflict.pantryCategory })}>
            <ChoiceText $selected={item.category === item.categoryConflict.pantryCategory}>{t('shopping.usePantryCategory')}</ChoiceText>
          </Choice>
        </ChoiceRow>
      </Section> : null}
      {standalone ? <Section>
        <Label>{t('shopping.receiptProductDecision')}</Label>
        <DecisionList accessibilityRole="radiogroup" accessibilityLabel={t('shopping.receiptProductDecisionA11y')}>
          <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: Boolean(item.included), disabled: busy }}
            $selected={Boolean(item.included)} disabled={busy}
            onPress={() => patch(item, { included: true, reviewed: false })}>
          <DecisionTitle $selected={Boolean(item.included)}>{t('shopping.addAsNew')}</DecisionTitle>
          <DecisionHint>{t('shopping.addAsNewHint')}</DecisionHint>
          </DecisionOption>
          <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: !item.included && item.reviewed, disabled: busy }}
            $selected={!item.included && item.reviewed} disabled={busy}
            onPress={() => patch(item, { included: false, reviewed: true })}>
          <DecisionTitle $selected={!item.included && item.reviewed}>{t('shopping.ignoreLine')}</DecisionTitle>
          <DecisionHint>{t('shopping.ignoreLineHint')}</DecisionHint>
          </DecisionOption>
        </DecisionList>
      </Section> : null}
      {item.included && Object.keys(checkoutItemErrors(item, t)).length ? <ErrorText accessibilityLiveRegion="polite">
        {t('shopping.completeRequired', { errors: Object.values(checkoutItemErrors(item, t)).join(' ') })}
      </ErrorText> : null}
      {(item.needsReview || standalone) && !item.reviewed && item.included ? <ButtonClick
        disabled={busy || Object.keys(checkoutItemErrors(item, t)).length > 0}
        onPress={() => patch(item, { reviewed: true })}
        title={t('shopping.confirmProductToPantry')} /> : null}
      {allowLink ? <Section>
        <Label>{t('shopping.matchProductQuestion')}</Label>
        <Muted>{t('shopping.matchProductHint')}</Muted>
        <DecisionList accessibilityRole="radiogroup" accessibilityLabel={t('shopping.availableListProducts')}>
          {listItems.map((listItem) => {
            const alreadyUsed = linkedItems.some((other) => other.id !== item.id && other.listItemId === listItem.id);
            const compatible = arePresentationsCompatible(listItem, item);
            const unavailable = alreadyUsed || !compatible;
            const presentation = listItem.weight != null && listItem.unit
              ? `${listItem.weight} ${listItem.unit}` : t('shopping.listSizeNotProvided');
            return <DecisionOption key={listItem.id} accessibilityRole="radio"
              accessibilityLabel={t('shopping.linkTo', { name: listItem.name })}
              accessibilityState={{ checked: item.listItemId === listItem.id, disabled: busy || unavailable }}
              $selected={item.listItemId === listItem.id} disabled={busy || unavailable}
              onPress={() => patch(item, { listItemId: listItem.id, included: true, reviewed: true })}>
              <DecisionTitle $selected={item.listItemId === listItem.id}>{listItem.name}</DecisionTitle>
              <DecisionHint>{alreadyUsed ? t('shopping.linkedAnotherLine')
                : !compatible ? t('shopping.sizeCannotLink')
                  : presentation}</DecisionHint>
            </DecisionOption>;
          })}
        </DecisionList>
        {listItems.length === 0 ? <Muted>{t('shopping.noItemsToLink')}</Muted>
          : compatibleChoices.filter((listItem) => !linkedItems.some((other) => other.id !== item.id && other.listItemId === listItem.id)).length === 0
              ? <Muted>{t('shopping.noCompatibleProducts')}</Muted>
            : null}
      </Section> : null}
      {showMatch && item.listItemId ? <Choice accessibilityRole="button" disabled={busy}
        onPress={() => patch(item, { listItemId: null, included: false, needsReview: true, reviewed: false })}>
        <ChoiceText>{t('shopping.unlinkAndReview')}</ChoiceText>
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
          ? draft.included ? t('shopping.confirmedManualAddition') : t('shopping.confirmedExcluded')
          : draft.included ? t('shopping.reviewAndConfirm') : t('shopping.waitingDecision')}
        expanded={isOpen} busy={busy}
        editorValues={editorValues(draft)} editorErrors={checkoutEditorErrors(draft, t)}
        onEditorChange={(key, value) => onEditorChange(draft, key, value)}
        priceHint={t('shopping.unitOrTotalPriceHint')}
        categoryOpen={categoryOpenId === draft.id} categoryOptions={PRODUCT_CATEGORIES}
        onToggleCategory={() => setCategoryOpenId(categoryOpenId === draft.id ? null : draft.id)}
        onSelectCategory={(category) => { patch(draft, { category }); setCategoryOpenId(null); }}
        onToggleEdit={() => { setOpenId(isOpen ? null : draft.id); setCategoryOpenId(null); }}
        >
      <Muted>{t('shopping.missingProductHint')}</Muted>
      <DecisionList accessibilityRole="radiogroup" accessibilityLabel={t('shopping.missingProductDecisionA11y')}>
        <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: Boolean(draft.included), disabled: busy }}
          $selected={Boolean(draft.included)} disabled={busy}
          onPress={() => patch(draft, { included: true, reviewed: false })}>
          <DecisionTitle $selected={Boolean(draft.included)}>{t('shopping.addManually')}</DecisionTitle>
          <DecisionHint>{t('shopping.addManuallyHint')}</DecisionHint>
        </DecisionOption>
        <DecisionOption accessibilityRole="radio" accessibilityState={{ checked: !draft.included && draft.reviewed, disabled: busy }}
          $selected={!draft.included && draft.reviewed} disabled={busy}
          onPress={() => patch(draft, { included: false, reviewed: true })}>
          <DecisionTitle $selected={!draft.included && draft.reviewed}>{t('shopping.doNotAdd')}</DecisionTitle>
          <DecisionHint>{t('shopping.doNotAddHint')}</DecisionHint>
        </DecisionOption>
      </DecisionList>
      {draft.categoryConflict && draft.included ? <Section>
        <Label>{t('shopping.categoryConflict')}</Label>
        <Muted>{t('shopping.listCategory', { category: t(`product.category.${draft.categoryConflict.listCategory}`) })} · {t('shopping.pantryCategory', { category: t(`product.category.${draft.categoryConflict.pantryCategory}`) })}</Muted>
        <ChoiceRow>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: draft.category === draft.categoryConflict.listCategory, disabled: busy }}
            $selected={draft.category === draft.categoryConflict.listCategory} disabled={busy}
            onPress={() => patch(draft, { category: draft.categoryConflict.listCategory })}>
            <ChoiceText $selected={draft.category === draft.categoryConflict.listCategory}>{t('shopping.keepListCategory')}</ChoiceText>
          </Choice>
          <Choice accessibilityRole="radio" accessibilityState={{ checked: draft.category === draft.categoryConflict.pantryCategory, disabled: busy }}
            $selected={draft.category === draft.categoryConflict.pantryCategory} disabled={busy}
            onPress={() => patch(draft, { category: draft.categoryConflict.pantryCategory })}>
            <ChoiceText $selected={draft.category === draft.categoryConflict.pantryCategory}>{t('shopping.usePantryCategory')}</ChoiceText>
          </Choice>
        </ChoiceRow>
      </Section> : null}
      {draft.included && Object.keys(checkoutItemErrors(draft, t)).length ? <ErrorText accessibilityLiveRegion="polite">
        {t('shopping.completeRequired', { errors: Object.values(checkoutItemErrors(draft, t)).join(' ') })}
      </ErrorText> : null}
      {!draft.reviewed && draft.included ? <ButtonClick disabled={busy || Object.keys(checkoutItemErrors(draft, t)).length > 0}
        onPress={() => patch(draft, { reviewed: true })}
        title={t('shopping.confirmProductToPantry')} /> : null}
      </PurchaseProductReviewCard>
    </Section>;
  }

  function renderFinalSummary() {
    const excludedItems = items.filter((item) => !item.included &&
      !(String(item.id).startsWith('missing-') && linkedListIds.has(item.listItemId)));
    const contextMarket = selectedMarket?.localName || selectedMarket?.displayName || marketQuery?.trim() || t('shopping.notInformed');
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
        item={{ ...item, unitLabel: item.unitLabel || t('shopping.unitAbbreviation') }} title={item.name || t('shopping.productWithoutName')}
        included={Boolean(item.included)} readOnly editorValues={editorValues(item)}>
        {linked ? <LinkRoute>
          <LinkRouteLabel>{t('shopping.linkedToListItem')}</LinkRouteLabel>
          <LinkRouteValue>{linked.name}</LinkRouteValue>
        </LinkRoute> : item.sourceDescription ? <LinkRoute>
          <LinkRouteLabel>{t('shopping.source')}</LinkRouteLabel>
          <LinkRouteValue>{t('shopping.newProductNoLink')}</LinkRouteValue>
        </LinkRoute> : null}
        <Muted>{t('product.info.category')}: {item.category ? t(`product.category.${item.category}`) : t('shopping.categoryUndefined')}</Muted>
        {item.sourceDescription && !linked ? <ChoiceRow>
          <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item, 'relate')}>
            <ChoiceText>{t('shopping.reviewLink')}</ChoiceText>
          </Choice>
          <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item, 'unlinked')}>
            <ChoiceText>{t('shopping.reviewInclusion')}</ChoiceText>
          </Choice>
        </ChoiceRow> : <Choice accessibilityRole="button" disabled={busy} onPress={() => editItem(item)}>
          <ChoiceText>{t(String(item.id).startsWith('missing-') ? 'shopping.reviewDecisionAndData' : 'shopping.editDataAndLink')}</ChoiceText>
        </Choice>}
      </PurchaseProductReviewCard>;
    };
    return <>
      <PurchaseContext>
        <ContextEyebrow>{t('shopping.purchaseSummary')}</ContextEyebrow>
        <ContextRow><ContextLabel>{t('shopping.listLabel')}</ContextLabel><ContextValue>{list.name || t('shopping.title')}</ContextValue></ContextRow>
        {purchase?.merchantName ? <ContextRow><ContextLabel>{t('shopping.receiptLabel')}</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
        <ContextRow><ContextLabel>{t('shopping.market')}</ContextLabel><ContextValue>{contextMarket}</ContextValue></ContextRow>
        <ContextRow><ContextLabel>{t('shopping.purchaseDate')}</ContextLabel><ContextValue>{dateValue || t('shopping.unidentified')}</ContextValue></ContextRow>
        {purchase?.totalAmount != null ? <ContextRow><ContextLabel>{t('shopping.receiptTotal')}</ContextLabel><ContextValue>{formatMoney(purchase.totalAmount, language)}</ContextValue></ContextRow> : null}
      </PurchaseContext>
      <SummaryBanner>
        <SummaryBannerTitle>{includedItems.length
          ? t('shopping.productsToPantry', { count: includedItems.length })
          : t('shopping.noProductsToPantry')}</SummaryBannerTitle>
        <SummaryBannerText>{includedItems.length
          ? t('shopping.reviewSelectedProducts', { total: formatMoney(total, language) })
          : t('shopping.listFinishedNoProducts')}</SummaryBannerText>
      </SummaryBanner>
      <Section>
        <SectionTitle>{t('shopping.howProductsAppear')}</SectionTitle>
        {includedItems.length ? includedItems.map(renderSummaryItem) : <Muted>{t('shopping.noProductsSelected')}</Muted>}
      </Section>
      {excludedItems.length ? <Section>
        <SectionTitle>{t('shopping.outsidePantry')}</SectionTitle>
        <Muted>{t('shopping.outsidePantryHint')}</Muted>
        {excludedItems.map(renderSummaryItem)}
      </Section> : null}
      {includedItems.length ? <SummaryBanner>
        <SummaryBannerTitle>{t('shopping.pantryAggregationTitle')}</SummaryBannerTitle>
        <SummaryBannerText>{t('shopping.pantryAggregationHint')}</SummaryBannerText>
      </SummaryBanner> : null}
    </>;
  }

  function renderPurchaseDetails() {
    return <>
      <PurchaseContext>
        <ContextEyebrow>{isFiscal ? t('shopping.receiptData') : t('shopping.purchaseData')}</ContextEyebrow>
        <ContextRow><ContextLabel>{t('shopping.listLabel')}</ContextLabel><ContextValue>{list.name || t('shopping.title')}</ContextValue></ContextRow>
        {isFiscal && purchase?.merchantName ? <ContextRow><ContextLabel>{t('shopping.receiptLabel')}</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
        {isFiscal && purchase?.totalAmount != null ? <ContextRow><ContextLabel>{t('shopping.receiptTotal')}</ContextLabel><ContextValue>{formatMoney(purchase.totalAmount, language)}</ContextValue></ContextRow> : null}
        <Section>
          <Label>{isFiscal ? t('shopping.receiptDate') : t('shopping.purchaseDate')}</Label>
          {dateReadOnly ? <DateSummary accessible accessibilityLabel={t('shopping.receiptDateA11y', { date: dateValue || t('shopping.unavailable') })}>
            <DateValue>{dateValue || t('shopping.unidentifiedDate')}</DateValue>
          </DateSummary> : <FormField accessibilityLabel={t('shopping.purchaseDateA11y')} value={dateValue}
            editable={!busy} placeholder={t('shopping.dateFormat')} onChangeText={onChangeDate} />}
        </Section>
        <Section>
          <Label>{t('shopping.purchaseMarketOptional')}</Label>
          <PlaceSearchField value={marketQuery} selected={Boolean(selectedMarket)} selectedPlace={selectedMarket}
            disabled={busy} Icon={LocationIcon} accessibilityLabel={t('shopping.purchaseMarketA11y')}
            placeholder={t('shopping.purchaseMarketOptional')} onChangeText={onChangeMarketQuery} onSelect={onSelectMarket} />
          {selectedMarket ? <Muted>{t('shopping.selectedMarketHint')}</Muted> : null}
        </Section>
      </PurchaseContext>
    </>;
  }

  function renderCompactPurchaseContext() {
    const contextMarket = selectedMarket?.localName || selectedMarket?.displayName || marketQuery?.trim() || t('shopping.notInformed');
    return <PurchaseContext>
      <ContextHeader><ContextEyebrow>{t('shopping.purchaseInReview')}</ContextEyebrow></ContextHeader>
      <ContextRow><ContextLabel>{t('shopping.listLabel')}</ContextLabel><ContextValue>{list.name || t('shopping.title')}</ContextValue></ContextRow>
      {purchase?.merchantName ? <ContextRow><ContextLabel>{t('shopping.receiptLabel')}</ContextLabel><ContextValue>{purchase.merchantName}</ContextValue></ContextRow> : null}
      <ContextRow><ContextLabel>{t('shopping.market')}</ContextLabel><ContextValue>{contextMarket}</ContextValue></ContextRow>
      <ContextRow><ContextLabel>{t('shopping.purchaseDateShort')}</ContextLabel><ContextValue>{dateValue || t('shopping.unidentified')}</ContextValue></ContextRow>
      <Choice accessibilityRole="button" disabled={busy} onPress={() => setStepKey(activeSteps[0]?.key || 'summary')}>
        <ChoiceText>{t('shopping.editPurchaseData')}</ChoiceText>
      </Choice>
    </PurchaseContext>;
  }

  const renderFiscalStep = () => {
    if (currentStepKey === 'matches') return autoMatchedItems.length
      ? autoMatchedItems.map((item) => renderReceiptItem(item, { showMatch: true }))
      : <Muted>{t('shopping.autoLinksUndone')}</Muted>;
    if (currentStepKey === 'relate') return <>
      {unmatchedReceiptItems.map((item) => renderReceiptItem(item, { allowLink: true }))}
      {manuallyLinkedItems.map((item) => renderReceiptItem(item, { showMatch: true }))}
      {!unmatchedReceiptItems.length ? <SummaryBanner>
        <SummaryBannerTitle>{t('shopping.allRemainingHandled')}</SummaryBannerTitle>
        <SummaryBannerText>{t('shopping.continueMissingItems')}</SummaryBannerText>
      </SummaryBanner> : null}
    </>;
    if (currentStepKey === 'missing') return unmatchedListItems.length
      ? unmatchedListItems.map(renderPlannedItem)
      : <SummaryBanner>
        <SummaryBannerTitle>{t('shopping.allListItemsHandled')}</SummaryBannerTitle>
        <SummaryBannerText>{t('shopping.continueUnlinkedItems')}</SummaryBannerText>
      </SummaryBanner>;
    if (currentStepKey === 'unlinked') return unmatchedReceiptItems.length
      ? unmatchedReceiptItems.map((item) => renderReceiptItem(item, { standalone: true }))
      : <SummaryBanner>
        <SummaryBannerTitle>{t('shopping.noUnlinkedReceiptLines')}</SummaryBannerTitle>
        <SummaryBannerText>{t('shopping.continueFinalResult')}</SummaryBannerText>
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
    ? t('shopping.addProductsToPantry', { count: includedItems.length })
    : t('shopping.finishPurchaseNoProducts');

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <ModalRoot edges={['top', 'right', 'bottom', 'left']}>
      <Header>
        <HeaderRow>
          <Title>{t('shopping.finishPurchase')}</Title>
          <ModalActionButton Icon={CancelCircleIcon} accessibilityLabel={t('shopping.closePurchaseReview')}
            disabled={busy} onPress={onClose} variant="cancel" />
        </HeaderRow>
        <Muted>{isFiscal
          ? t('shopping.receiptReadInstruction')
          : t('shopping.reviewInstruction')}</Muted>
      </Header>
      <Content>
        <ContentInner>
          {isFiscal ? <StepHeader>
            <StepCounter>{t('shopping.stepCounter', { current: stepIndex + 1, total: activeSteps.length })}</StepCounter>
            <StepTitle>{currentStep.title}</StepTitle>
            <Muted>{currentStep.description}</Muted>
            <ProgressTrack accessibilityRole="progressbar" accessibilityLabel={currentStep.title}
              accessibilityValue={{ min: 1, max: activeSteps.length, now: stepIndex + 1 }}>
              {activeSteps.map((entry, index) => <ProgressChip key={entry.key}
                $active={index === stepIndex} $complete={index < stepIndex}>
                <ProgressChipText $active={index === stepIndex} $complete={index < stepIndex}>
                  {t(stageLabelKeys[entry.key])}
                </ProgressChipText>
              </ProgressChip>)}
            </ProgressTrack>
          </StepHeader> : null}

          {!isFiscal ? renderPurchaseDetails()
            : currentStepKey === 'summary' ? null
              : stepIndex === 0 ? renderPurchaseDetails() : renderCompactPurchaseContext()}

          {isFiscal ? renderFiscalStep() : <>
            <Section><SectionTitle>{t('shopping.purchaseProducts')}</SectionTitle>
              <Muted>{t('shopping.savedProductDataHint')}</Muted>
            </Section>
            {items.map((item) => renderReceiptItem(item))}
          </>}
          {error ? <ErrorText accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</ErrorText> : null}
        </ContentInner>
      </Content>
      <Footer>
        <Muted>{t('shopping.reviewSummary')}</Muted>
        <SummaryRow>
          <Label>{includedItems.length
            ? t(includedItems.length === 1 ? 'shopping.selectedProductCount.one' : 'shopping.selectedProductCount.other', { count: includedItems.length })
            : t('shopping.noneSelected')}</Label>
        </SummaryRow>
        <SummaryRow><Label>{t('shopping.selectedSubtotal')}</Label><SummaryValue>{formatMoney(total, language)}</SummaryValue></SummaryRow>
        {stepReviewCount ? <ErrorText accessibilityLiveRegion="polite">
          {t(currentStepKey === 'missing' ? stepReviewCount === 1 ? 'shopping.reviewPending.missing.one' : 'shopping.reviewPending.missing.other'
            : currentStepKey === 'unlinked' ? stepReviewCount === 1 ? 'shopping.reviewPending.unlinked.one' : 'shopping.reviewPending.unlinked.other'
              : currentStepKey === 'summary' ? stepReviewCount === 1 ? 'shopping.reviewPending.summary.one' : 'shopping.reviewPending.summary.other'
                : stepReviewCount === 1 ? 'shopping.reviewPending.other.one' : 'shopping.reviewPending.other.other', { count: stepReviewCount })}
        </ErrorText> : null}
        {incompleteIncludedItems.length ? <ErrorText accessibilityLiveRegion="polite">
          {t(incompleteIncludedItems.length === 1 ? 'shopping.incompleteProducts.one' : 'shopping.incompleteProducts.other', { count: incompleteIncludedItems.length })}
        </ErrorText> : null}
        {busy ? <ActivityIndicator accessibilityLabel={t('shopping.confirmingPurchase')} color="#228B22" /> : null}
        {isFiscal && canGoNext ? <>
          {nextStepTitle ? <Muted>{t('shopping.nextStep', { title: nextStepTitle })}</Muted> : null}
          <ButtonClick disabled={!canContinue} onPress={nextStep} title={t('shopping.continue')} />
        </> : <ButtonClick accessibilityLabel={confirmationTitle} disabled={!canConfirm}
          onPress={onConfirm} title={busy ? t('shopping.finalizingPurchase') : confirmationTitle} />}
        {isFiscal && stepIndex > 0 ? <Choice accessibilityRole="button" disabled={busy} onPress={previousStep}>
          <ChoiceText>{t('shopping.backOneStep')}</ChoiceText>
        </Choice> : null}
        {isFiscal && currentStepKey === 'summary' && stepIndex > 0 ? <Choice accessibilityRole="button" disabled={busy} onPress={restartReview}>
          <ChoiceText>{t('shopping.discardRestart')}</ChoiceText>
        </Choice> : null}
      </Footer>
    </ModalRoot>
  </Modal>;
}

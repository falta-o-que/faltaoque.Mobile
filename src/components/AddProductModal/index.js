import { useEffect, useRef, useState } from 'react';
import { Modal, Platform } from 'react-native';

import {
  AngleIcon,
  BoxIcon,
  CancelCircleIcon,
  CheckIcon,
  DeliveryIcon,
  PenIcon,
} from '../../assets/icons/export';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  validateProduct,
} from '../../domain/productValidation';
import CategoryTag from '../CategoryTag';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
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
  price: '',
  quantity: '',
  weight: '',
  unit: '',
  category: null,
};

export function AddProductModal({ onCreate, onRequestClose, visible }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setDraft(EMPTY_DRAFT);
      setErrors({});
      setIsCategoryOpen(true);
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [visible]);

  function updateField(field, value) {
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
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onCreate({ ...draft });
    } catch (error) {
      const fieldErrors = error?.fields && typeof error.fields === 'object'
        ? error.fields
        : {};
      setErrors((currentErrors) => ({
        ...currentErrors,
        ...fieldErrors,
        submit: 'Não foi possível adicionar o produto. Tente novamente.',
      }));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const hasWeight = draft.weight.trim() !== '';

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
                  <Heading>Produto</Heading>
                </Header>
                <ProductName>{draft.name.trim() || 'Adicionar produto'}</ProductName>
              </TitleGroup>

              <FormContent>
                <Fields>
                  <FormField
                  accessibilityLabel="Nome do produto, obrigatório"
                  autoCapitalize="sentences"
                  editable={!isSubmitting}
                  error={errors.name}
                  Icon={PenIcon}
                  maxLength={120}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Nome *"
                  returnKeyType="next"
                  value={draft.name}
                />
                  <FormField
                  accessibilityLabel="Preço unitário do produto, obrigatório"
                  editable={!isSubmitting}
                  error={errors.price}
                  Icon={DeliveryIcon}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  maxLength={16}
                  onChangeText={(value) => updateField('price', value)}
                  placeholder="Preço *"
                  value={draft.price}
                />
                  <FormField
                  accessibilityLabel="Quantidade do produto, obrigatória"
                  editable={!isSubmitting}
                  error={errors.quantity}
                  Icon={DeliveryIcon}
                  inputMode="numeric"
                  keyboardType="number-pad"
                  maxLength={9}
                  onChangeText={(value) => updateField('quantity', value)}
                  placeholder="Quantidade *"
                  value={draft.quantity}
                />
                  <WeightGroup>
                    <FormField
                    accessibilityLabel="Peso ou volume do produto, opcional"
                    editable={!isSubmitting}
                    error={errors.weight}
                    Icon={BoxIcon}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    maxLength={16}
                    onChangeText={handleWeightChange}
                    placeholder="Peso"
                    value={draft.weight}
                  />
                  {hasWeight ? (
                    <>
                      <UnitOptions accessibilityRole="radiogroup">
                        {PRODUCT_UNITS.map((unit) => (
                          <UnitOption
                            key={unit}
                            accessibilityLabel={`Unidade ${unit}`}
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
                      {errors.unit ? (
                        <InlineError accessibilityLiveRegion="polite">{errors.unit}</InlineError>
                      ) : null}
                    </>
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
                  <AccordionLabel>Categoria</AccordionLabel>
                  <Chevron style={{ transform: [{ rotate: isCategoryOpen ? '180deg' : '0deg' }] }}>
                    <AngleIcon />
                  </Chevron>
                </AccordionHeader>
                {isCategoryOpen ? (
                  <CategoryOptions $disabled={isSubmitting}>
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
                {errors.category ? (
                  <InlineError accessibilityLiveRegion="polite">{errors.category}</InlineError>
                ) : null}
                </Accordion>
              </FormContent>

              {errors.submit ? (
                <SubmitError accessibilityLiveRegion="polite">{errors.submit}</SubmitError>
              ) : null}

              {isSubmitting ? (
                <BusyStatus accessibilityLiveRegion="polite">
                  <BusyIndicator />
                  <BusyText>Salvando...</BusyText>
                </BusyStatus>
              ) : null}

              <Actions>
                <ModalActionButton
                  accessibilityLabel="Cancelar adição do produto"
                  disabled={isSubmitting}
                  Icon={CancelCircleIcon}
                  onPress={handleClose}
                  variant="cancel"
                />
                <ModalActionButton
                  accessibilityLabel="Adicionar produto"
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

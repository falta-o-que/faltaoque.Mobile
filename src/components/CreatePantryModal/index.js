import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal } from 'react-native';

import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { AngleIcon, CancelCircleIcon, CheckIcon, LocationIcon, PantryIcon, PenIcon } from '../../assets/icons/export';
import FormField from '../FormField';
import DangerActionButton from '../DangerActionButton';
import ModalActionButton from '../ModalActionButton';
import PlaceSearchField from '../PlaceSearchField';
import {
  Actions,
  Card,
  ColorChevron,
  ColorField,
  ColorGrid,
  ColorHeader,
  ColorOption,
  ColorPanel,
  ColorRow,
  FieldLabel,
  Header,
  Heading,
  InlineError,
  Overlay,
  Scroller,
  Content,
} from './styles';

export function PantryFormModal({ busy = false, onCreate, onDelete, onRequestClose, onSave, pantry = null, visible }) {
  const isEditing = Boolean(pantry?.id);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLocationDirty, setIsLocationDirty] = useState(false);
  const [color, setColor] = useState(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [shouldRenderColorPicker, setShouldRenderColorPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const colorPickerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName(pantry?.name ?? '');
      const existingLocationName = pantry?.locationName ?? String(pantry?.location ?? '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
      setLocation(existingLocationName);
      setSelectedPlace(pantry?.location ? {
        cep: pantry.location,
        localName: existingLocationName,
        displayName: existingLocationName,
      } : null);
      setIsLocationDirty(false);
      setColor(pantry?.color ?? null);
      setErrors({});
      setIsColorPickerOpen(false);
      setShouldRenderColorPicker(false);
      setIsSubmitting(false);
    } else {
      setName('');
      setLocation('');
      setSelectedPlace(null);
      setIsLocationDirty(false);
      setColor(null);
      setErrors({});
      setIsColorPickerOpen(false);
      setShouldRenderColorPicker(false);
      setIsSubmitting(false);
    }
  }, [pantry?.color, pantry?.id, pantry?.location, pantry?.locationName, pantry?.name, visible]);

  useEffect(() => {
    if (isColorPickerOpen) {
      setShouldRenderColorPicker(true);
    }
  }, [isColorPickerOpen]);

  useEffect(() => {
    if (!shouldRenderColorPicker) {
      return undefined;
    }

    const animation = Animated.timing(colorPickerProgress, {
      toValue: isColorPickerOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !isColorPickerOpen) {
        setShouldRenderColorPicker(false);
      }
    });

    return () => animation.stop();
  }, [colorPickerProgress, isColorPickerOpen, shouldRenderColorPicker]);

  const colorPickerPanelStyle = {
    opacity: colorPickerProgress,
    transform: [
      {
        scaleY: colorPickerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
      {
        translateY: colorPickerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
  };

  const colorPickerChevronStyle = {
    transform: [
      {
        rotate: colorPickerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const handleClose = () => {
    if (busy || isSubmitting) return;
    onRequestClose();
  };

  const handleConfirm = async () => {
    const nextErrors = {
      name: name.trim() ? undefined : 'Informe o nome da despensa.',
      color: color ? undefined : 'Escolha uma cor para a despensa.',
      location: isLocationDirty && location.trim() && !selectedPlace
        ? 'Selecione um endereço válido nas sugestões do Google ou deixe o campo em branco.' : undefined,
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.color || nextErrors.location) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        color,
        name: name.trim(),
        location: isEditing && !isLocationDirty ? pantry.location ?? null : selectedPlace?.cep ?? null,
        locationName: isEditing && !isLocationDirty ? pantry.locationName ?? null : selectedPlace?.displayName ?? null,
      };
      await (isEditing ? onSave : onCreate)?.(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderColorPicker = () => (
    <ColorField>
      <ColorHeader
        accessibilityRole="button"
        accessibilityState={{ expanded: isColorPickerOpen }}
        disabled={busy || isSubmitting}
        onPress={() => setIsColorPickerOpen((currentValue) => !currentValue)}
        $hasError={Boolean(errors.color)}
      >
        <FieldLabel>Cor da despensa *</FieldLabel>
        <ColorChevron style={colorPickerChevronStyle}><AngleIcon /></ColorChevron>
      </ColorHeader>
      {shouldRenderColorPicker ? (
        <ColorPanel style={colorPickerPanelStyle}>
          <ColorGrid>
            {COLOR_OPTION_ROWS.map((row, rowIndex) => (
              <ColorRow key={`pantry-color-row-${rowIndex + 1}`}>
                {row.map((option) => (
                  <ColorOption
                    key={option}
                    accessibilityLabel={`Selecionar cor ${option}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: color === option }}
                    disabled={busy || isSubmitting}
                    onPress={() => {
                      setColor(option);
                      setErrors((currentErrors) => ({ ...currentErrors, color: undefined }));
                    }}
                    $color={option}
                    $selected={color === option}
                  />
                ))}
              </ColorRow>
            ))}
          </ColorGrid>
        </ColorPanel>
      ) : null}
      {errors.color ? <InlineError accessibilityLiveRegion="polite" accessibilityRole="alert">{errors.color}</InlineError> : null}
    </ColorField>
  );

  return (
    <Modal animationType="fade" onRequestClose={handleClose} transparent visible={visible}>
      <Overlay accessibilityViewIsModal>
        <Card>
          <Scroller bounces={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Content>
              <Header><PantryIcon size={24} /><Heading>{isEditing ? 'Editar Despensa' : 'Criar Despensa'}</Heading></Header>
              <FormField
                accessibilityLabel="Nome da despensa, obrigatório"
                autoCapitalize="sentences"
                editable={!busy && !isSubmitting}
                error={errors.name}
                Icon={PenIcon}
                maxLength={150}
                onChangeText={(value) => {
                  setName(value);
                  setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
                }}
                placeholder="Nome *"
                value={name}
              />
              {isEditing ? renderColorPicker() : null}
              <PlaceSearchField
                accessibilityLabel="Endereço da despensa, opcional"
                value={location}
                selected={Boolean(selectedPlace?.displayName)}
                selectedPlace={selectedPlace}
                disabled={busy || isSubmitting}
                error={errors.location}
                Icon={LocationIcon}
                placeholder="Endereço da despensa (opcional)"
                onChangeText={(value) => {
                  setLocation(value);
                  setSelectedPlace(null);
                  setIsLocationDirty(true);
                  setErrors((currentErrors) => ({ ...currentErrors, location: undefined }));
                }}
                onSelect={(place) => {
                  setSelectedPlace(place);
                  setLocation(place.displayName);
                  setIsLocationDirty(true);
                  setErrors((currentErrors) => ({ ...currentErrors, location: undefined }));
                }}
              />
              {!isEditing ? renderColorPicker() : null}
              {isEditing ? <DangerActionButton disabled={busy || isSubmitting} onPress={onDelete} text="Excluir Despensa" /> : null}
              <Actions>
                <ModalActionButton accessibilityLabel={isEditing ? 'Cancelar edição da despensa' : 'Cancelar criação da despensa'} disabled={busy || isSubmitting} Icon={CancelCircleIcon} onPress={handleClose} variant="cancel" />
                <ModalActionButton accessibilityLabel={isEditing ? 'Salvar alterações da despensa' : 'Criar despensa'} disabled={busy || isSubmitting} Icon={CheckIcon} onPress={handleConfirm} variant="confirm" />
              </Actions>
            </Content>
          </Scroller>
        </Card>
      </Overlay>
    </Modal>
  );
}

export function CreatePantryModal({ onCreate, onRequestClose, visible }) {
  return <PantryFormModal onCreate={onCreate} onRequestClose={onRequestClose} visible={visible} />;
}

export default CreatePantryModal;

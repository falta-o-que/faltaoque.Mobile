import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal } from 'react-native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

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
  const { t } = useAppPreferences();
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
      name: name.trim() ? undefined : t('pantryForm.nameError'),
      color: color ? undefined : t('pantryForm.colorError'),
      location: isLocationDirty && location.trim() && !selectedPlace
        ? t('pantryForm.locationError') : undefined,
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
        <FieldLabel>{t('pantryForm.color')}</FieldLabel>
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
                    accessibilityLabel={t('pantryForm.selectColor', { color: option })}
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
              <Header><PantryIcon size={24} /><Heading>{t(isEditing ? 'pantryForm.editTitle' : 'pantryForm.createTitle')}</Heading></Header>
              <FormField
                accessibilityLabel={t('pantryForm.nameA11y')}
                autoCapitalize="sentences"
                editable={!busy && !isSubmitting}
                error={errors.name}
                Icon={PenIcon}
                maxLength={150}
                onChangeText={(value) => {
                  setName(value);
                  setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
                }}
                placeholder={t('pantryForm.namePlaceholder')}
                value={name}
              />
              {isEditing ? renderColorPicker() : null}
              <PlaceSearchField
                accessibilityLabel={t('pantryForm.locationA11y')}
                value={location}
                selected={Boolean(selectedPlace?.displayName)}
                selectedPlace={selectedPlace}
                disabled={busy || isSubmitting}
                error={errors.location}
                Icon={LocationIcon}
                placeholder={t('pantryForm.locationPlaceholder')}
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
              {isEditing ? <DangerActionButton disabled={busy || isSubmitting} onPress={onDelete} text={t('pantryForm.delete')} /> : null}
              <Actions>
                <ModalActionButton accessibilityLabel={t(isEditing ? 'pantryForm.cancelEdit' : 'pantryForm.cancelCreate')} disabled={busy || isSubmitting} Icon={CancelCircleIcon} onPress={handleClose} variant="cancel" />
                <ModalActionButton accessibilityLabel={t(isEditing ? 'pantryForm.save' : 'pantryForm.create')} disabled={busy || isSubmitting} Icon={CheckIcon} onPress={handleConfirm} variant="confirm" />
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

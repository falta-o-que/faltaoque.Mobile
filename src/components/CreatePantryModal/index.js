import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal } from 'react-native';

import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { AngleIcon, CancelCircleIcon, CheckIcon, PantryIcon, PenIcon } from '../../assets/icons/export';
import FormField from '../FormField';
import ModalActionButton from '../ModalActionButton';
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
} from './styles';

export function CreatePantryModal({ onCreate, onRequestClose, visible }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [shouldRenderColorPicker, setShouldRenderColorPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const colorPickerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setName('');
      setColor(null);
      setErrors({});
      setIsColorPickerOpen(false);
      setShouldRenderColorPicker(false);
      setIsSubmitting(false);
    }
  }, [visible]);

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
    onRequestClose();
  };

  const handleConfirm = async () => {
    const nextErrors = {
      name: name.trim() ? undefined : 'Informe o nome da despensa.',
      color: color ? undefined : 'Escolha uma cor para a despensa.',
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.color) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate({ color, name: name.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <Overlay accessibilityViewIsModal>
        <Card>
          <Header>
            <PantryIcon size={24} />
            <Heading>Criar Despensa</Heading>
          </Header>
          <ColorField>
            <FormField
              accessibilityLabel="Nome da despensa"
              error={errors.name}
              Icon={PenIcon}
              onChangeText={(value) => {
                setName(value);
                setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
              }}
              placeholder="Nome"
              value={name}
            />
            <ColorHeader
              accessibilityRole="button"
              accessibilityState={{ expanded: isColorPickerOpen }}
              onPress={() => setIsColorPickerOpen((currentValue) => !currentValue)}
              $hasError={Boolean(errors.color)}
            >
              <FieldLabel>Cor da despensa</FieldLabel>
              <ColorChevron style={colorPickerChevronStyle}>
                <AngleIcon />
              </ColorChevron>
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
            {errors.color ? <InlineError>{errors.color}</InlineError> : null}
          </ColorField>
          <Actions>
            <ModalActionButton
              accessibilityLabel="Cancelar criação da despensa"
              disabled={isSubmitting}
              Icon={CancelCircleIcon}
              onPress={handleClose}
              variant="cancel"
            />
            <ModalActionButton
              accessibilityLabel="Criar despensa"
              disabled={isSubmitting}
              Icon={CheckIcon}
              onPress={handleConfirm}
              variant="confirm"
            />
          </Actions>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default CreatePantryModal;

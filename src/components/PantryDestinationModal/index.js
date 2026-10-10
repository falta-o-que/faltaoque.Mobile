import { Modal } from 'react-native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

import {
  Card,
  CancelButton,
  CancelText,
  DestinationButton,
  DestinationText,
  Heading,
  Overlay,
  Subtitle,
} from './styles';

export function PantryDestinationModal({
  onOpenPantry,
  onOpenShoppingList,
  onRequestClose,
  pantryName,
  visible,
}) {
  const { t } = useAppPreferences();
  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      <Overlay accessibilityViewIsModal>
        <Card>
          <Heading>{t('pantry.destination.question')}</Heading>
          <Subtitle>
            {t('pantry.destination.choose', { pantry: pantryName })}
          </Subtitle>
          <DestinationButton
            $primary
            accessibilityLabel={t('pantry.destination.openPantry')}
            accessibilityRole="button"
            onPress={onOpenPantry}
          >
            <DestinationText>{t('pantry.destination.openPantry')}</DestinationText>
          </DestinationButton>
          <DestinationButton
            $secondary
            accessibilityLabel={t('pantry.destination.openList')}
            accessibilityRole="button"
            onPress={onOpenShoppingList}
          >
            <DestinationText>{t('pantry.destination.openList')}</DestinationText>
          </DestinationButton>
          <CancelButton accessibilityRole="button" onPress={onRequestClose}>
            <CancelText>{t('common.cancel')}</CancelText>
          </CancelButton>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default PantryDestinationModal;

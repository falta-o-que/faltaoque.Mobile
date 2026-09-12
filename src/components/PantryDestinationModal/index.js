import { Modal } from 'react-native';

import {
  Card,
  CancelButton,
  CancelText,
  DestinationButton,
  DestinationText,
  Heading,
  Overlay,
  PantryName,
  Subtitle,
} from './styles';

export function PantryDestinationModal({
  onOpenPantry,
  onOpenShoppingList,
  onRequestClose,
  pantryName,
  visible,
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      <Overlay accessibilityViewIsModal>
        <Card>
          <Heading>O que você quer acessar?</Heading>
          <Subtitle>
            Escolha uma opção para <PantryName>{pantryName}</PantryName>
          </Subtitle>
          <DestinationButton
            $primary
            accessibilityLabel="Ir para sua despensa"
            accessibilityRole="button"
            onPress={onOpenPantry}
          >
            <DestinationText>Ir para sua despensa</DestinationText>
          </DestinationButton>
          <DestinationButton
            $secondary
            accessibilityLabel="Ir para lista de compras"
            accessibilityRole="button"
            onPress={onOpenShoppingList}
          >
            <DestinationText>Ir para lista de compras</DestinationText>
          </DestinationButton>
          <CancelButton accessibilityRole="button" onPress={onRequestClose}>
            <CancelText>Cancelar</CancelText>
          </CancelButton>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default PantryDestinationModal;

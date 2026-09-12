import { Modal } from 'react-native';
import { Card, CancelButton, CancelText, DestinationButton, DestinationText, Heading, Overlay, Subtitle } from '../PantryDestinationModal/styles';
export default function AddProductMethodModal({ visible, onRequestClose, onManual, onQrCode }) {
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={onRequestClose}><Overlay accessibilityViewIsModal><Card><Heading>Como deseja adicionar?</Heading><Subtitle>Escolha como você quer incluir produtos nesta despensa.</Subtitle><DestinationButton $primary accessibilityRole="button" onPress={onQrCode}><DestinationText>Ler QR Code da nota</DestinationText></DestinationButton><DestinationButton $secondary accessibilityRole="button" onPress={onManual}><DestinationText>Adicionar manualmente</DestinationText></DestinationButton><CancelButton accessibilityRole="button" onPress={onRequestClose}><CancelText>Cancelar</CancelText></CancelButton></Card></Overlay></Modal>;
}

import { Modal } from 'react-native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { Card, CancelButton, CancelText, DestinationButton, DestinationText, Heading, Overlay, Subtitle } from '../PantryDestinationModal/styles';
export default function AddProductMethodModal({ visible, onRequestClose, onManual, onQrCode, checkout = false }) {
  const { t } = useAppPreferences();
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={onRequestClose}><Overlay accessibilityViewIsModal><Card><Heading>{t(checkout ? 'product.method.checkoutTitle' : 'product.method.addTitle')}</Heading><Subtitle>{t(checkout ? 'product.method.checkoutSubtitle' : 'product.method.addSubtitle')}</Subtitle><DestinationButton $primary accessibilityRole="button" onPress={onQrCode}><DestinationText>{t('product.method.qr')}</DestinationText></DestinationButton><DestinationButton $secondary accessibilityRole="button" onPress={onManual}><DestinationText>{t(checkout ? 'product.method.manualCheckout' : 'product.method.manualAdd')}</DestinationText></DestinationButton><CancelButton accessibilityRole="button" onPress={onRequestClose}><CancelText>{t('common.cancel')}</CancelText></CancelButton></Card></Overlay></Modal>;
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CancelCircleIcon, PantryIcon } from '../../assets/icons/export';
import ButtonClick from '../ButtonClick';
import ModalActionButton from '../ModalActionButton';
import { loadFiscalPurchase } from '../../services/nfceImportService';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { getUserErrorMessage } from '../../utils/userErrors';
import { CameraArea, CameraHint, CameraShell, Content, Error, Eyebrow, Footer, Frame, Header, HeadingGroup, Help, Intro, IntroIcon, PermissionState, Screen, Status, StatusText, Title } from './styles';

export default function NfceScannerModal({ visible, onRequestClose, onPurchaseLoaded }) {
  const { t } = useAppPreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (!visible) { setProcessing(false); setError(null); } }, [visible]);
  async function handleScan({ data }) {
    if (processing) return;
    setProcessing(true); setError(null);
    try { await onPurchaseLoaded(await loadFiscalPurchase(data)); }
    catch (cause) { setError(getUserErrorMessage(cause, t('shopping.readReceiptError'), t)); setProcessing(false); }
  }
  const title = permission?.granted ? t('shopping.readQr') : t('shopping.useCamera');
  return <Modal visible={visible} onRequestClose={onRequestClose} animationType="slide"><Screen edges={['top', 'left', 'right', 'bottom']}><Content>
    <Header><HeadingGroup><Eyebrow>{t('shopping.cameraAdd')}</Eyebrow><Title>{title}</Title></HeadingGroup><ModalActionButton Icon={CancelCircleIcon} accessibilityLabel={t('shopping.cancelScan')} onPress={onRequestClose} variant="cancel" /></Header>
    {!permission ? <PermissionState><ActivityIndicator accessibilityLabel={t('shopping.checkingCameraPermission')} /><StatusText>{t('shopping.preparingCamera')}</StatusText></PermissionState> : !permission.granted ? <PermissionState><Intro><IntroIcon><PantryIcon size={26} /></IntroIcon><Help>{t('shopping.cameraPermissionHelp')}</Help></Intro><ButtonClick title={t('shopping.allowCamera')} onPress={requestPermission} /></PermissionState> : <><Intro><IntroIcon><PantryIcon size={26} /></IntroIcon><Help>{t('shopping.scanHelp')}</Help></Intro><CameraShell><CameraArea><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={processing ? undefined : handleScan} /></CameraArea><Frame pointerEvents="none" /><CameraHint>{t('shopping.centerQr')}</CameraHint></CameraShell><Footer><Status>{processing ? <><ActivityIndicator size="small" /><StatusText>{t('shopping.queryReceipt')}</StatusText></> : null}</Status>{error ? <Error accessibilityRole="alert">{error}</Error> : null}</Footer></>}
  </Content></Screen></Modal>;
}

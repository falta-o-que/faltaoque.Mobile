import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CancelCircleIcon, PantryIcon } from '../../assets/icons/export';
import ButtonClick from '../ButtonClick';
import ModalActionButton from '../ModalActionButton';
import { loadFiscalPurchase } from '../../services/nfceImportService';
import { getUserErrorMessage } from '../../utils/userErrors';
import { CameraArea, CameraHint, CameraShell, Content, Error, Eyebrow, Footer, Frame, Header, HeadingGroup, Help, Intro, IntroIcon, PermissionState, Screen, Status, StatusText, Title } from './styles';

export default function NfceScannerModal({ visible, onRequestClose, onPurchaseLoaded }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (!visible) { setProcessing(false); setError(null); } }, [visible]);
  async function handleScan({ data }) {
    if (processing) return;
    setProcessing(true); setError(null);
    try { onPurchaseLoaded(await loadFiscalPurchase(data)); }
    catch (cause) { setError(getUserErrorMessage(cause, 'Não foi possível ler esta nota. Confira sua conexão e tente novamente.')); setProcessing(false); }
  }
  const title = permission?.granted ? 'Ler QR Code' : 'Usar a câmera';
  return <Modal visible={visible} onRequestClose={onRequestClose} animationType="slide"><Screen edges={['top', 'left', 'right', 'bottom']}><Content>
    <Header><HeadingGroup><Eyebrow>ADICIONAR PELA NOTA</Eyebrow><Title>{title}</Title></HeadingGroup><ModalActionButton Icon={CancelCircleIcon} accessibilityLabel="Cancelar leitura da nota" onPress={onRequestClose} variant="cancel" /></Header>
    {!permission ? <PermissionState><ActivityIndicator accessibilityLabel="Verificando permissão da câmera" /><StatusText>Preparando a câmera...</StatusText></PermissionState> : !permission.granted ? <PermissionState><Intro><IntroIcon><PantryIcon size={26} /></IntroIcon><Help>Precisamos acessar sua câmera para ler o QR Code e trazer os produtos para sua despensa.</Help></Intro><ButtonClick title="Permitir uso da câmera" onPress={requestPermission} /></PermissionState> : <><Intro><IntroIcon><PantryIcon size={26} /></IntroIcon><Help>Aponte para o QR Code da nota fiscal. Você poderá revisar os produtos antes de guardar.</Help></Intro><CameraShell><CameraArea><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={processing ? undefined : handleScan} /></CameraArea><Frame pointerEvents="none" /><CameraHint>Centralize o QR Code dentro da moldura</CameraHint></CameraShell><Footer><Status>{processing ? <><ActivityIndicator size="small" /><StatusText>Consultando a nota...</StatusText></> : null}</Status>{error ? <Error accessibilityRole="alert">{error}</Error> : null}</Footer></>}
  </Content></Screen></Modal>;
}

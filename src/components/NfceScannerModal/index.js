import {useLayoutEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {CancelCircleIcon, PantryIcon} from '../../assets/icons/export';
import ButtonClick from '../ButtonClick';
import ModalActionButton from '../ModalActionButton';
import {loadFiscalPurchase} from '../../services/nfceImportService';
import {useAppPreferences} from '../../contexts/AppPreferencesContext';
import {getUserErrorMessage} from '../../utils/userErrors';
import {createFiscalScanSession} from '../../utils/fiscalScanSession';
import {
    CameraArea,
    CameraHint,
    CameraShell,
    Content,
    Error,
    Eyebrow,
    Footer,
    Frame,
    Header,
    HeadingGroup,
    Help,
    Intro,
    IntroIcon,
    PermissionState,
    Screen,
    Status,
    StatusText,
    Title
} from './styles';

export default function NfceScannerModal({visible, accountId, onRequestClose, onPurchaseLoaded}) {
    const {t} = useAppPreferences();
    const [permission, requestPermission] = useCameraPermissions();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const session = useRef(createFiscalScanSession()).current;
    const acceptingScans = useRef(false);
    useLayoutEffect(() => {
        acceptingScans.current = visible;
        setProcessing(false);
        setError(null);
        return () => {
            acceptingScans.current = false;
            session.invalidate();
        };
    }, [visible, accountId, session]);

    function closeScanner() {
        acceptingScans.current = false;
        session.invalidate();
        setProcessing(false);
        setError(null);
        onRequestClose();
    }

    async function handleScan({data}) {
        if (!acceptingScans.current) return;
        const isCurrent = session.begin();
        if (!isCurrent) return;
        setProcessing(true);
        setError(null);
        try {
            const purchase = await loadFiscalPurchase(data, accountId);
            if (!isCurrent()) return;
            await onPurchaseLoaded(purchase, isCurrent);
        } catch (cause) {
            if (isCurrent()) setError(getUserErrorMessage(cause, t('shopping.readReceiptError'), t));
        } finally {
            if (isCurrent()) setProcessing(false);
            session.finish(isCurrent);
        }
    }

    const title = permission?.granted ? t('shopping.readQr') : t('shopping.useCamera');
    return <Modal visible={visible} onRequestClose={closeScanner} animationType="slide"><Screen
        edges={['top', 'left', 'right', 'bottom']}><Content>
        <Header><HeadingGroup><Eyebrow>{t('shopping.cameraAdd')}</Eyebrow><Title>{title}</Title></HeadingGroup><ModalActionButton
            Icon={CancelCircleIcon} accessibilityLabel={t('shopping.cancelScan')} onPress={closeScanner}
            variant="cancel"/></Header>
        {!permission ? <PermissionState><ActivityIndicator accessibilityLabel={t('shopping.checkingCameraPermission')}/><StatusText>{t('shopping.preparingCamera')}</StatusText></PermissionState> : !permission.granted ?
            <PermissionState><Intro><IntroIcon><PantryIcon
                size={26}/></IntroIcon><Help>{t('shopping.cameraPermissionHelp')}</Help></Intro><ButtonClick
                title={t('shopping.allowCamera')} onPress={requestPermission}/></PermissionState> : <><Intro><IntroIcon><PantryIcon
                size={26}/></IntroIcon><Help>{t('shopping.scanHelp')}</Help></Intro><CameraShell><CameraArea><CameraView
                style={{flex: 1}} facing="back" barcodeScannerSettings={{barcodeTypes: ['qr']}}
                onBarcodeScanned={processing ? undefined : handleScan}/></CameraArea><Frame
                pointerEvents="none"/><CameraHint>{t('shopping.centerQr')}</CameraHint></CameraShell><Footer><Status>{processing ? <>
                <ActivityIndicator
                    size="small"/><StatusText>{t('shopping.queryReceipt')}</StatusText></> : null}</Status>{error ?
                <Error accessibilityRole="alert">{error}</Error> : null}</Footer></>}
    </Content></Screen></Modal>;
}

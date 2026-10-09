import { useEffect, useState } from 'react';
import { Modal } from 'react-native';

import { CancelCircleIcon, CheckIcon, LocationIcon, PantryIcon } from '../../assets/icons/export';
import ModalActionButton from '../ModalActionButton';
import PlaceSearchField from '../PlaceSearchField';
import {
  Actions,
  Card,
  Header,
  Heading,
  HelpText,
  Overlay,
} from './styles';

export default function PantryLocationModal({ visible, pantry, busy, onSave, onRequestClose }) {
  const [location, setLocation] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    const currentCep = pantry?.location ?? null;
    const currentLocationName = pantry?.locationName ?? null;
    setLocation(currentLocationName ?? '');
    setSelectedPlace(currentCep ? {
      cep: currentCep,
      localName: currentLocationName,
      displayName: currentLocationName ?? '',
    } : null);
    setError('');
  }, [visible, pantry?.id, pantry?.location, pantry?.locationName]);

  async function save() {
    if (location.trim() && !selectedPlace) {
      setError('Selecione um endereço válido nas sugestões do Google ou deixe o campo em branco.');
      return;
    }
    await onSave(selectedPlace?.cep ?? null, selectedPlace?.displayName ?? null);
  }

  return (
    <Modal animationType="fade" onRequestClose={onRequestClose} transparent visible={visible}>
      <Overlay accessibilityViewIsModal>
        <Card>
          <Header>
            <PantryIcon size={24} />
            <Heading>Localização da despensa</Heading>
          </Header>
          <HelpText>Escolha o endereço da despensa para encontrar mercados próximos. Você pode alterar ou remover depois.</HelpText>
          {pantry?.location && !pantry?.locationName ? <HelpText>Esse endereço foi salvo antes do nome do local. Selecione novamente uma sugestão para identificá-lo.</HelpText> : null}
          <PlaceSearchField
            accessibilityLabel="Endereço da despensa, opcional"
            value={location}
            selected={Boolean(selectedPlace?.displayName)}
            selectedPlace={selectedPlace}
            disabled={busy}
            error={error}
            Icon={LocationIcon}
            placeholder="Endereço da despensa"
            onChangeText={(value) => {
              setLocation(value);
              setSelectedPlace(null);
              setError('');
            }}
            onSelect={(place) => {
              setSelectedPlace(place);
              setLocation(place.displayName);
              setError('');
            }}
          />
          <Actions>
            <ModalActionButton accessibilityLabel="Cancelar" disabled={busy} Icon={CancelCircleIcon} onPress={onRequestClose} variant="cancel" />
            <ModalActionButton accessibilityLabel="Salvar endereço da despensa" disabled={busy} Icon={CheckIcon} onPress={save} variant="confirm" />
          </Actions>
        </Card>
      </Overlay>
    </Modal>
  );
}

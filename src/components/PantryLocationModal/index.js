import { useEffect, useState } from 'react';
import { Modal } from 'react-native';

import { CancelCircleIcon, CheckIcon, LocationIcon, PantryIcon } from '../../assets/icons/export';
import { formatCepInput } from '../../domain/locationValidation';
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
    setLocation(formatCepInput(currentCep));
    setSelectedPlace(currentCep ? { cep: currentCep } : null);
    setError('');
  }, [visible, pantry?.id, pantry?.location]);

  async function save() {
    if (location.trim() && !selectedPlace) {
      setError('Escolha um endereço da lista de sugestões.');
      return;
    }
    await onSave(selectedPlace?.cep ?? null);
  }

  return (
    <Modal animationType="fade" onRequestClose={onRequestClose} transparent visible={visible}>
      <Overlay accessibilityViewIsModal>
        <Card>
          <Header>
            <PantryIcon size={24} />
            <Heading>Localização da despensa</Heading>
          </Header>
          <HelpText>Digite o endereço e escolha uma sugestão. O app salva o CEP para encontrar mercados próximos. Você pode deixar em branco ou remover depois.</HelpText>
          <PlaceSearchField
            accessibilityLabel="Endereço da despensa, opcional"
            value={location}
            selected={Boolean(selectedPlace)}
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
            <ModalActionButton accessibilityLabel="Salvar CEP da despensa" disabled={busy} Icon={CheckIcon} onPress={save} variant="confirm" />
          </Actions>
        </Card>
      </Overlay>
    </Modal>
  );
}

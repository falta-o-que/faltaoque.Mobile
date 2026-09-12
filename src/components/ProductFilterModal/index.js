import { useEffect, useState } from 'react';
import { Modal, Platform } from 'react-native';

import { CancelCircleIcon, CheckIcon, FilterIcon } from '../../assets/icons/export';
import ModalActionButton from '../ModalActionButton';
import { Actions, Card, Content, Divider, Header, Heading, Overlay, SortLabel, SortOption, SortOptionLabel, SortOptions, SortSection } from './styles';

const SORT_OPTIONS = [
  { key: 'nameAsc', label: 'A - Z' },
  { key: 'nameDesc', label: 'Z - A' },
  { key: 'priceAsc', label: 'Menor Preço' },
  { key: 'priceDesc', label: 'Maior Preço' },
  { key: 'quantityDesc', label: 'Maior quantidade' },
];

export function ProductFilterModal({ onApply, onRequestClose, selectedSort = null, visible }) {
  const [draftSort, setDraftSort] = useState(selectedSort);

  useEffect(() => {
    if (visible) setDraftSort(selectedSort);
  }, [selectedSort, visible]);

  const handleApply = () => {
    onApply(draftSort);
    onRequestClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onRequestClose} transparent visible={visible}>
      <Overlay accessibilityViewIsModal behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Card>
          <Content>
            <Header><FilterIcon size={24} /><Heading>Filtros</Heading></Header>
            <SortSection>
              <Divider><SortLabel>Ordenar por:</SortLabel></Divider>
              <SortOptions accessibilityRole="radiogroup">
                {SORT_OPTIONS.map((option) => (
                  <SortOption
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draftSort === option.key }}
                    onPress={() => setDraftSort(option.key)}
                    $selected={draftSort === option.key}
                  >
                    <SortOptionLabel>{option.label}</SortOptionLabel>
                  </SortOption>
                ))}
              </SortOptions>
            </SortSection>
            <Actions>
              <ModalActionButton accessibilityLabel="Cancelar filtros" Icon={CancelCircleIcon} onPress={onRequestClose} variant="cancel" />
              <ModalActionButton accessibilityLabel="Aplicar filtros" Icon={CheckIcon} onPress={handleApply} variant="confirm" />
            </Actions>
          </Content>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default ProductFilterModal;

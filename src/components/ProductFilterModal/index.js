import { useEffect, useState } from 'react';
import { Modal, Platform } from 'react-native';

import { CancelCircleIcon, CheckIcon, FilterIcon } from '../../assets/icons/export';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import ModalActionButton from '../ModalActionButton';
import { Actions, Card, Content, Divider, Header, Heading, Overlay, SortLabel, SortOption, SortOptionLabel, SortOptions, SortSection } from './styles';

const SORT_OPTIONS = [
  { key: 'nameAsc', labelKey: 'product.filter.nameAsc' },
  { key: 'nameDesc', labelKey: 'product.filter.nameDesc' },
  { key: 'priceAsc', labelKey: 'product.filter.priceAsc' },
  { key: 'priceDesc', labelKey: 'product.filter.priceDesc' },
  { key: 'quantityDesc', labelKey: 'product.filter.quantityDesc' },
];

export function ProductFilterModal({ onApply, onRequestClose, selectedSort = null, visible }) {
  const { t } = useAppPreferences();
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
            <Header><FilterIcon size={24} /><Heading>{t('product.filter.title')}</Heading></Header>
            <SortSection>
              <Divider><SortLabel>{t('product.filter.sortBy')}</SortLabel></Divider>
              <SortOptions accessibilityRole="radiogroup">
                {SORT_OPTIONS.map((option) => (
                  <SortOption
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draftSort === option.key }}
                    onPress={() => setDraftSort(option.key)}
                    $selected={draftSort === option.key}
                  >
                    <SortOptionLabel>{t(option.labelKey)}</SortOptionLabel>
                  </SortOption>
                ))}
              </SortOptions>
            </SortSection>
            <Actions>
              <ModalActionButton accessibilityLabel={t('product.filter.cancel')} Icon={CancelCircleIcon} onPress={onRequestClose} variant="cancel" />
              <ModalActionButton accessibilityLabel={t('product.filter.apply')} Icon={CheckIcon} onPress={handleApply} variant="confirm" />
            </Actions>
          </Content>
        </Card>
      </Overlay>
    </Modal>
  );
}

export default ProductFilterModal;

import { Modal } from 'react-native';

import { CancelCircleIcon, ShoppingListIcon } from '../../assets/icons/export';
import ModalActionButton from '../ModalActionButton';
import {
  Actions,
  Card,
  Content,
  DateLabel,
  DateRow,
  DateText,
  EmptyText,
  Header,
  Heading,
  HistoryCard,
  ItemMeta,
  ItemName,
  ItemRow,
  Items,
  ListName,
  Overlay,
  RepeatButton,
  RepeatButtonText,
  Scroll,
  SectionLabel,
} from './styles';

const formatDate = (value) => {
  if (!value) return 'Não informada';

  const text = String(value);
  const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (brDate) return text;

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;

  return 'Não informada';
};

const formatMeasure = (item) => {
  const quantity = Number(item?.quantity);
  const parts = [`${Number.isFinite(quantity) && quantity > 0 ? quantity : 1}x`];

  if (item?.weight != null && item.weight !== '') {
    parts.push(`${String(item.weight).replace('.', ',')}${item.unit ?? ''}`);
  }

  return parts.join(' · ');
};

const formatCep = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : 'Não informado';
};

const formatPrice = (value) => value == null
  ? 'Sem estimativa'
  : `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

export default function GroceryListHistoryModal({
  visible,
  lists = [],
  busy = false,
  onRepeat,
  onClose,
}) {
  const finishedLists = lists.filter((list) => list?.status === 'finished');

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Overlay accessibilityViewIsModal>
        <Card>
          <Content>
            <Header>
              <ShoppingListIcon color="#00DD00" size={24} />
              <Heading>Histórico de listas</Heading>
            </Header>

            <Scroll
              bounces={false}
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {finishedLists.length ? finishedLists.map((list) => {
                const items = Array.isArray(list.items) ? list.items : [];

                return (
                  <HistoryCard key={list.id}>
                    <ListName numberOfLines={2}>{list.name || 'Lista sem nome'}</ListName>

                    <DateRow>
                      <DateLabel>Planejada</DateLabel>
                      <DateText>{formatDate(list.plannedDate)}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>Concluída</DateLabel>
                      <DateText>{formatDate(list.finishedAt)}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>Mercado</DateLabel>
                      <DateText>{formatCep(list.location)}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>Preço estimado</DateLabel>
                      <DateText>{formatPrice(list.estimatedPrice)}</DateText>
                    </DateRow>

                    <SectionLabel>
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </SectionLabel>
                    <Items>
                      {items.length ? items.map((item, index) => (
                        <ItemRow key={item.id ?? `${list.id}-item-${index}`}>
                          <ItemName numberOfLines={2}>{item.name || 'Item sem nome'}</ItemName>
                          <ItemMeta>{formatMeasure(item)}</ItemMeta>
                        </ItemRow>
                      )) : <EmptyText>Esta lista foi concluída sem itens.</EmptyText>}
                    </Items>

                    <RepeatButton
                      accessibilityLabel={`Repetir a lista ${list.name || 'sem nome'}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: busy }}
                      disabled={busy}
                      onPress={() => onRepeat?.(list)}
                    >
                      <RepeatButtonText>Repetir como nova lista</RepeatButtonText>
                    </RepeatButton>
                  </HistoryCard>
                );
              }) : (
                <EmptyText>As listas concluídas aparecerão aqui.</EmptyText>
              )}
            </Scroll>

            <Actions>
              <ModalActionButton
                accessibilityLabel="Fechar histórico de listas"
                disabled={busy}
                Icon={CancelCircleIcon}
                onPress={onClose}
                variant="cancel"
              />
            </Actions>
          </Content>
        </Card>
      </Overlay>
    </Modal>
  );
}

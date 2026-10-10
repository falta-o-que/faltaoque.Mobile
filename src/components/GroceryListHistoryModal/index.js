import { Modal } from 'react-native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

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

const formatMeasure = (item) => {
  const quantity = Number(item?.quantity);
  const parts = [`${Number.isFinite(quantity) && quantity > 0 ? quantity : 1}x`];

  if (item?.weight != null && item.weight !== '') {
    parts.push(`${String(item.weight).replace('.', ',')}${item.unit ?? ''}`);
  }

  return parts.join(' · ');
};

export default function GroceryListHistoryModal({
  visible,
  lists = [],
  busy = false,
  onRepeat,
  onClose,
}) {
  const { t } = useAppPreferences();
  const finishedLists = lists.filter((list) => list?.status === 'finished');
  const formatDate = (value) => {
    if (!value) return t('shopping.unknownDate');
    const text = String(value);
    const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (brDate) return text;
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
    return t('shopping.unknownDate');
  };
  const formatPrice = (value) => value == null
    ? t('shopping.unregisteredValue')
    : `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

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
              <Heading>{t('shopping.historyTitle')}</Heading>
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
                      <DateLabel>{t('shopping.planned')}</DateLabel>
                      <DateText>{formatDate(list.plannedDate)}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>{t('shopping.finished')}</DateLabel>
                      <DateText>{formatDate(list.finishedAt)}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>{t('shopping.market')}</DateLabel>
                      <DateText>{list.market?.localName || t('shopping.unknownMarket')}</DateText>
                    </DateRow>
                    <DateRow>
                      <DateLabel>{t('shopping.purchaseTotal')}</DateLabel>
                      <DateText>{formatPrice(list.estimatedPrice)}</DateText>
                    </DateRow>

                    <SectionLabel>
                      {items.length} {items.length === 1 ? t('shopping.item') : t('shopping.items')}
                    </SectionLabel>
                    <Items>
                      {items.length ? items.map((item, index) => (
                        <ItemRow key={item.id ?? `${list.id}-item-${index}`}>
                          <ItemName numberOfLines={2}>{item.name || 'Item sem nome'}</ItemName>
                          <ItemMeta>{formatMeasure(item)}</ItemMeta>
                        </ItemRow>
                      )) : <EmptyText>{t('shopping.noItemsFinished')}</EmptyText>}
                    </Items>

                    <RepeatButton
                      accessibilityLabel={t('shopping.repeatList', { name: list.name || t('shopping.noName') })}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: busy }}
                      disabled={busy}
                      onPress={() => onRepeat?.(list)}
                    >
                      <RepeatButtonText>{t('shopping.repeatAsNew')}</RepeatButtonText>
                    </RepeatButton>
                  </HistoryCard>
                );
              }) : (
                <EmptyText>{t('shopping.historyEmpty')}</EmptyText>
              )}
            </Scroll>

            <Actions>
              <ModalActionButton
                accessibilityLabel={t('shopping.closeHistory')}
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

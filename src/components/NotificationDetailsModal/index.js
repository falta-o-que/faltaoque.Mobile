import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

import { BoxIcon, CalendarIcon, CancelCircleIcon } from '../../assets/icons/export';
import {
  ActionButton,
  ActionText,
  Actions,
  BusyArea,
  BusyText,
  Card,
  CloseButton,
  Content,
  DetailLabel,
  DetailRow,
  Details,
  DetailValue,
  EmptyLists,
  ErrorText,
  Header,
  Heading,
  KeyboardArea,
  ListOption,
  ListOptionText,
  ListOptions,
  ListPrompt,
  Overlay,
  ProductName,
  RadioInner,
  RadioOuter,
  Scroll,
  Summary,
} from './styles';

const formatDate = (value, fallback) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').slice(0, 10));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback;
};

const formatQuantity = (value, t) => {
  const quantity = Number(value);
  return `${quantity} ${t(quantity === 1 ? 'notifications.modal.unit.one' : 'notifications.modal.unit.other')}`;
};

function NotificationDetailsModal({
  visible,
  notification,
  lists = [],
  listsLoading = false,
  listsError = null,
  busy = false,
  onAddToList,
  onCreateList,
  onOpenPantry,
  onClose,
}) {
  const theme = useTheme();
  const { t } = useAppPreferences();
  const [selectedListId, setSelectedListId] = useState(null);
  const isDepleted = notification?.type === 'depleted';
  const product = notification?.product;
  const productName = product?.baseName || product?.name || t('notifications.modal.productFallback');
  const listsToShow = lists.filter((list) => list.status === 'active');
  const isAlreadyHandled = notification?.handled?.action === 'added-to-list';

  useEffect(() => {
    if (visible) setSelectedListId(listsToShow[0]?.id ?? null);
    else setSelectedListId(null);
  }, [visible, notification?.id, lists.length]);

  const handleAdd = () => {
    const list = listsToShow.find((entry) => entry.id === selectedListId);
    if (list && !busy) onAddToList?.(list);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Overlay accessibilityViewIsModal>
        <KeyboardArea>
          <Card>
            <Scroll>
              <Content>
              <Header>
                {isDepleted
                  ? <BoxIcon color={theme.colors.primary.Green} size={24} />
                  : <CalendarIcon color={theme.colors.primary.Green} size={24} />}
                <Heading>{isDepleted ? t('notifications.modal.depletedTitle') : t('notifications.modal.expirationTitle')}</Heading>
                <CloseButton
                  accessibilityLabel={t('notifications.modal.closeDetails')}
                  accessibilityRole="button"
                  onPress={onClose}
                >
                  <CancelCircleIcon color="#000000" size={20} />
                </CloseButton>
              </Header>

              <ProductName>{productName}</ProductName>
              <Summary>
                {isDepleted
                  ? isAlreadyHandled
                    ? t('notifications.modal.handledSummary', { list: notification.handled.listName })
                    : t('notifications.modal.depletedSummary')
                  : t('notifications.modal.expirationSummary')}
              </Summary>

              <Details>
                <DetailRow>
                  <DetailLabel>{t('notifications.modal.pantry')}</DetailLabel>
                  <DetailValue>{notification?.pantryName ?? t('notifications.modal.pantryFallback')}</DetailValue>
                </DetailRow>
                {isDepleted ? (
                  <DetailRow>
                    <DetailLabel>{t('notifications.modal.stock')}</DetailLabel>
                    <DetailValue>{formatQuantity(product?.quantity ?? 0, t)}</DetailValue>
                  </DetailRow>
                ) : (
                  <DetailRow>
                    <DetailLabel>{t('notifications.modal.expiration')}</DetailLabel>
                    <DetailValue>{formatDate(notification?.expirationDate, t('notifications.modal.notProvided'))}</DetailValue>
                  </DetailRow>
                )}
                {product?.weight != null ? (
                  <DetailRow>
                    <DetailLabel>{t('notifications.modal.package')}</DetailLabel>
                    <DetailValue>{`${String(product.weight).replace('.', ',')} ${product.unit ?? ''}`.trim()}</DetailValue>
                  </DetailRow>
                ) : null}
                {product?.brand || product?.brands?.length ? (
                  <DetailRow>
                    <DetailLabel>{t('notifications.modal.brand')}</DetailLabel>
                    <DetailValue>{product.brand || product.brands.filter(Boolean).join(', ') || t('notifications.modal.notProvided')}</DetailValue>
                  </DetailRow>
                ) : null}
              </Details>

              {isDepleted && !isAlreadyHandled ? (
                <>
                  <ListPrompt>{t('notifications.modal.addToListPrompt')}</ListPrompt>
                  {listsLoading ? (
                    <BusyArea>
                      <ActivityIndicator color={theme.colors.primary.Green} size="small" />
                      <BusyText>{t('notifications.modal.loadingLists')}</BusyText>
                    </BusyArea>
                  ) : null}
                  {listsError ? <ErrorText accessibilityRole="alert">{listsError}</ErrorText> : null}
                  {!listsLoading && !listsError && listsToShow.length === 0 ? (
                    <EmptyLists>{t('notifications.modal.emptyLists')}</EmptyLists>
                  ) : null}
                  {!listsLoading && !listsError && listsToShow.length > 0 ? (
                    <ListOptions>
                      {listsToShow.map((list) => {
                        const selected = list.id === selectedListId;
                        return (
                          <ListOption
                            key={list.id}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => setSelectedListId(list.id)}
                            $selected={selected}
                          >
                            <RadioOuter $selected={selected}>
                              {selected ? <RadioInner /> : null}
                            </RadioOuter>
                            <ListOptionText>{list.name}</ListOptionText>
                          </ListOption>
                        );
                      })}
                    </ListOptions>
                  ) : null}
                </>
              ) : null}

              <Actions>
                {isDepleted && isAlreadyHandled ? (
                  <ActionButton onPress={onClose}>
                    <ActionText>{t('notifications.modal.close')}</ActionText>
                  </ActionButton>
                ) : isDepleted ? (
                  <>
                    {listsToShow.length === 0 && !listsLoading && !listsError ? (
                      <ActionButton disabled={busy} onPress={onCreateList}>
                        <ActionText>{t('notifications.modal.createList')}</ActionText>
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={busy || listsLoading || Boolean(listsError) || !selectedListId}
                        onPress={handleAdd}
                      >
                        {busy
                          ? <BusyArea><ActivityIndicator color={theme.colors.white[100]} size="small" /><BusyText $inverse>{t('notifications.modal.adding')}</BusyText></BusyArea>
                          : <ActionText>{t('notifications.modal.addToList')}</ActionText>}
                      </ActionButton>
                    )}
                    <ActionButton $secondary onPress={onClose}>
                      <ActionText $secondary>{t('notifications.modal.notNow')}</ActionText>
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton onPress={onOpenPantry}>
                      <ActionText>{t('notifications.modal.pantry')}</ActionText>
                    </ActionButton>
                    <ActionButton $secondary onPress={onClose}>
                      <ActionText $secondary>{t('notifications.modal.close')}</ActionText>
                    </ActionButton>
                  </>
                )}
              </Actions>
              </Content>
            </Scroll>
          </Card>
        </KeyboardArea>
      </Overlay>
    </Modal>
  );
}

export default NotificationDetailsModal;

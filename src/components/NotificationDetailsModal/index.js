import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { useTheme } from 'styled-components/native';

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

const formatDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').slice(0, 10));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informada';
};

const formatQuantity = (value) => {
  const quantity = Number(value);
  return `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'}`;
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
  const [selectedListId, setSelectedListId] = useState(null);
  const isDepleted = notification?.type === 'depleted';
  const product = notification?.product;
  const productName = product?.baseName || product?.name || 'Produto';
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
                <Heading>{isDepleted ? 'Produto acabou' : 'Validade do produto'}</Heading>
                <CloseButton
                  accessibilityLabel="Fechar detalhes da notificação"
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
                    ? `Este produto já foi adicionado à lista “${notification.handled.listName}”.`
                    : 'O saldo deste produto chegou a zero. Quer incluí-lo em uma lista de compras?'
                  : 'A data de validade deste produto já chegou. Confira as informações antes de decidir o que fazer.'}
              </Summary>

              <Details>
                <DetailRow>
                  <DetailLabel>Despensa</DetailLabel>
                  <DetailValue>{notification?.pantryName ?? 'Não identificada'}</DetailValue>
                </DetailRow>
                {isDepleted ? (
                  <DetailRow>
                    <DetailLabel>Estoque atual</DetailLabel>
                    <DetailValue>{formatQuantity(product?.quantity ?? 0)}</DetailValue>
                  </DetailRow>
                ) : (
                  <DetailRow>
                    <DetailLabel>Validade</DetailLabel>
                    <DetailValue>{formatDate(notification?.expirationDate)}</DetailValue>
                  </DetailRow>
                )}
                {product?.weight != null ? (
                  <DetailRow>
                    <DetailLabel>Embalagem</DetailLabel>
                    <DetailValue>{`${String(product.weight).replace('.', ',')} ${product.unit ?? ''}`.trim()}</DetailValue>
                  </DetailRow>
                ) : null}
                {product?.brand || product?.brands?.length ? (
                  <DetailRow>
                    <DetailLabel>Marca</DetailLabel>
                    <DetailValue>{product.brand || product.brands.filter(Boolean).join(', ') || 'Não informada'}</DetailValue>
                  </DetailRow>
                ) : null}
              </Details>

              {isDepleted && !isAlreadyHandled ? (
                <>
                  <ListPrompt>Adicionar a qual lista?</ListPrompt>
                  {listsLoading ? (
                    <BusyArea>
                      <ActivityIndicator color={theme.colors.primary.Green} size="small" />
                      <BusyText>Carregando listas...</BusyText>
                    </BusyArea>
                  ) : null}
                  {listsError ? <ErrorText accessibilityRole="alert">{listsError}</ErrorText> : null}
                  {!listsLoading && !listsError && listsToShow.length === 0 ? (
                    <EmptyLists>Esta despensa não tem listas ativas. Crie uma lista para adicionar o produto.</EmptyLists>
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
                    <ActionText>Fechar</ActionText>
                  </ActionButton>
                ) : isDepleted ? (
                  <>
                    {listsToShow.length === 0 && !listsLoading && !listsError ? (
                      <ActionButton disabled={busy} onPress={onCreateList}>
                        <ActionText>Criar lista</ActionText>
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={busy || listsLoading || Boolean(listsError) || !selectedListId}
                        onPress={handleAdd}
                      >
                        {busy
                          ? <BusyArea><ActivityIndicator color={theme.colors.white[100]} size="small" /><BusyText $inverse>Adicionando...</BusyText></BusyArea>
                          : <ActionText>Adicionar à lista</ActionText>}
                      </ActionButton>
                    )}
                    <ActionButton $secondary onPress={onClose}>
                      <ActionText $secondary>Agora não</ActionText>
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton onPress={onOpenPantry}>
                      <ActionText>Abrir despensa</ActionText>
                    </ActionButton>
                    <ActionButton $secondary onPress={onClose}>
                      <ActionText $secondary>Fechar</ActionText>
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

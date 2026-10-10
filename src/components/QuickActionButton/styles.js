import styled from 'styled-components/native';

export const ActionButton = styled.TouchableOpacity.attrs({
  activeOpacity: 0.72,
  hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
})`
  width: 60px;
  height: 60px;
  gap: 4px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-color: #0b8c0b;
  border-width: ${({$selected}) => ($selected ? 2 : 0)}px;
  border-radius: 21px;
  background-color: ${({theme}) => theme.colors.primary.Green};
`;

export const TextButton = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 12px;
  letter-spacing: 0.2px;
`;

export const IconArea = styled.View`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const NotificationBadge = styled.View`
  position: absolute;
  top: -3px;
  right: -4px;
  width: 9px;
  height: 9px;
  border: 1px solid ${({ theme }) => theme.colors.white[100]};
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.danger[500]};
`;

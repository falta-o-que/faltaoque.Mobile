import styled from 'styled-components/native';

export const Options = styled.ScrollView.attrs({ nestedScrollEnabled: true, keyboardShouldPersistTaps: 'handled' })`
  max-height: 210px;
  margin-top: -6px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;
export const Option = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 52px;
  justify-content: center;
  padding: 9px 14px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.white[200]};
`;
export const OptionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;
export const OptionSubtitle = styled.Text`
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;
export const Attribution = styled.Text`
  padding: 8px 12px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 11px;
`;
export const GoogleLetter = styled.Text`
  color: ${({ $color }) => $color};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 11px;
`;
export const Status = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;
export const Helper = styled.Text`
  color: ${({ $error, theme }) => $error ? theme.colors.danger[600] : theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

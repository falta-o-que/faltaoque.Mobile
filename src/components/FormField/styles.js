import styled from 'styled-components/native';

export const FieldGroup = styled.View`
  width: 100%;
`;

export const Container = styled.View`
  min-height: 56px;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  border: 1px solid ${({ theme, $hasError }) =>
    $hasError ? theme.colors.danger[600] : theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Input = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.primary.Green,
}))`
  flex: 1;
  padding: 0;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
`;

export const IconContainer = styled.View`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
`;

export const IconButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.65 })`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  margin-right: -8px;
  margin-left: 4px;
`;

export const ErrorText = styled.Text`
  margin-top: 6px;
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 11px;
`;

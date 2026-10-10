import styled from 'styled-components/native';

export const Button = styled.TouchableOpacity.attrs(({ disabled }) => ({
  activeOpacity: 0.72,
  disabled,
}))`
  width: 100%;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 20px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ theme }) => theme.colors.danger[600]};
`;

export const Label = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
`;

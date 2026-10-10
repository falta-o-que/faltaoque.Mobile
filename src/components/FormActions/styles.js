import styled from 'styled-components/native';

export const Container = styled.View`
  gap: 10px;
`;

export const SaveButton = styled.TouchableOpacity.attrs(({ disabled }) => ({
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
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;

export const SaveLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

export const CancelButton = styled.TouchableOpacity.attrs(({ disabled }) => ({
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
  background-color: ${({ theme }) => theme.colors.danger[500]};
`;

export const CancelLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

import styled from 'styled-components/native';

export const Form = styled.View`
  gap: 20px;
`;

export const ColorField = styled.View`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
`;

export const FieldLabel = styled.Text`
  margin-bottom: 14px;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 14px;
`;

export const ColorGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
`;

export const ColorOption = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border-width: ${({ $selected }) => ($selected ? 3 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  background-color: ${({ $color }) => $color};
`;

export const Terms = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 9px;
  margin-top: 16px;
`;

export const Checkbox = styled.View`
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.primary.Green};
  border-radius: 9px;
`;

export const Checkmark = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-size: 12px;
`;

export const TermsText = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black[200]};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 11px;
`;

export const PrimaryButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  height: 47px;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;

export const PrimaryLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const BackLink = styled.TouchableOpacity`
  align-self: center;
  padding: 14px;
`;

export const BackText = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 14px;
`;

export const Muted = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
`;

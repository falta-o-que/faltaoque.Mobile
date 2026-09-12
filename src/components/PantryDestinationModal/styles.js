import styled from 'styled-components/native';

export const Overlay = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.45);
`;

export const Card = styled.View`
  width: 100%;
  max-width: 350px;
  gap: 12px;
  padding: 24px 20px 16px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 8;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.24;
  shadow-radius: 12px;
`;

export const Heading = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => theme.fonts.sizes['3']}px;
  text-align: center;
`;

export const Subtitle = styled.Text`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  line-height: 20px;
  text-align: center;
`;

export const PantryName = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
`;

export const DestinationButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.78 })`
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-width: 1px;
  border-color: ${({ $primary, theme }) =>
    $primary ? theme.colors.primary.Green : theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ $primary, theme }) =>
    $primary ? theme.colors.primary.Green : theme.colors.white[100]};
`;

export const DestinationText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const CancelButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  align-self: center;
  padding: 10px 16px 2px;
`;

export const CancelText = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

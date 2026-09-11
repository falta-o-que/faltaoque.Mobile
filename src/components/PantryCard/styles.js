import styled from 'styled-components/native';

export const Card = styled.TouchableOpacity.attrs({
  activeOpacity: 0.8,
})`
  width: 100%;
  max-width: 350px;
  align-self: center;
  gap: 12px;
  padding: 12px;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 8px;
  elevation: 2;
`;

export const TitleGroup = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const Title = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
`;

export const Details = styled.View`
  gap: 6px;
  padding: 0 10px;
`;

export const DetailRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const Label = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['0']}px;
`;

export const QuantityBadge = styled.View`
  padding: 2px 6px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.primary.Green};
`;

export const QuantityText = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['0']}px;
`;

export const Footer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ColorCircle = styled.View`
  width: 27px;
  height: 27px;
  border-radius: 14px;
  background-color: ${({ $color, theme }) => $color ?? theme.colors.primary.Green};
`;

export const IconButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  margin: -6px;
`;

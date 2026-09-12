import styled from 'styled-components/native';

export const Card = styled.View`
  width: 100%;
  min-height: 142px;
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.white[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 1px;
  shadow-opacity: 0.12;
  shadow-radius: 4px;
  elevation: 4;
`;

export const ProductDetails = styled.View`
  min-width: 0;
  flex: 1;
  justify-content: center;
  margin-right: 12px;
`;

export const ProductHeader = styled.View`
  min-width: 0;
  flex-direction: row;
  align-items: baseline;
`;

export const CategoryIndicator = styled.View`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-right: 7px;
  border-radius: 999px;
  background-color: ${({ theme, $category }) => theme.colors.tags[$category]};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.white[100]};
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 1px;
  shadow-opacity: 0.16;
  shadow-radius: 2px;
  elevation: 2;
`;

export const ProductImage = styled.Image`
  width: 50px;
  height: 50px;
  margin-bottom: 2px;
`;

export const ProductName = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const ProductMeasure = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex-shrink: 1;
  margin-left: 6px;
  color: ${({ theme }) => theme.colors.white[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.regular};
`;

export const ProductPrice = styled.Text`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const Expiration = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex-shrink: 1;
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.regular};
`;

export const InfoButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  align-self: flex-start;
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
`;

export const InfoLabel = styled.Text`
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['0']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.regular};
`;

export const QuantityControl = styled.View`
  width: 109px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.white[200]};
  border-radius: 12px;
`;

export const QuantityButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.75 })`
  width: 28px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${({ $disabled, theme }) =>
    $disabled ? theme.colors.white[300] : theme.colors.primary[300]};
`;

export const QuantityButtonLabel = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
  line-height: 20px;
`;

export const Quantity = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex: 1;
  max-width: 28px;
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.medium};
  text-align: center;
`;

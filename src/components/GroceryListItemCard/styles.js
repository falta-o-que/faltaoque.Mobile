import styled from 'styled-components/native';

export const Card = styled.View`
  width: 100%;
  height: 52px;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.white[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 2;
  opacity: ${({ $disabled }) => ($disabled ? 0.56 : 1)};
`;

export const Accent = styled.View`
  width: 4px;
  height: 20px;
  margin-left: 16px;
  margin-right: 6px;
  border-radius: 2px;
  border-width: ${({ $category }) => ($category === 'limpezaHigiene' ? '1px' : '0px')};
  border-color: ${({ theme }) => theme.colors.black[300]};
  background-color: ${({ theme, $category }) => theme.colors.tags[$category] || theme.colors.primary[300]};
`;

export const Content = styled.View`
  min-width: 0;
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-right: 8px;
`;

export const ProductName = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
  text-decoration-line: none;
`;

export const Metadata = styled.Text.attrs({
  ellipsizeMode: 'tail',
  numberOfLines: 1,
})`
  min-width: 0;
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.white[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.regular};
`;

export const Quantity = styled.Text`
  color: ${({ theme }) => theme.colors.white[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.medium};
`;

export const EditButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export const Checkbox = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.black[500]};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

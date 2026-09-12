import styled from 'styled-components/native';

const lightTextCategories = new Set([
  'integraisCereais',
  'frescos',
  'carnes',
]);

export const Container = styled.TouchableOpacity.attrs({
  activeOpacity: 0.7,
})`
  align-self: flex-start;
  min-height: ${({ $variant }) => ($variant === 'product' ? 30 : 28)}px;
  align-items: center;
  justify-content: center;
  padding: ${({ $variant }) => ($variant === 'product' ? '4px 8px' : '5px 12px')};
  border-radius: 999px;
  border-width: 2px;
  border-color: ${({ theme, $category, $selected, $variant }) => {
    if ($selected) return theme.colors.black.Black;
    if ($variant === 'product') return 'transparent';
    if ($category === 'limpezaHigiene') return theme.colors.white[300];
    return 'transparent';
  }};
  background-color: ${({ theme, $category, $variant }) =>
    $variant === 'product' && $category === 'limpezaHigiene'
      ? theme.colors.white[200]
      : theme.colors.tags[$category]};
  opacity: ${({ $category, $variant }) =>
    $variant === 'product' && ['bebidas', 'carnes', 'frescos'].includes($category) ? 0.9 : 1};
`;

export const Label = styled.Text`
  color: ${({ theme, $category }) =>
    lightTextCategories.has($category)
      ? theme.colors.white[100]
      : theme.colors.black.Black};
  font-family: ${({ theme, $variant }) => theme.fonts.families.inter[$variant === 'product' ? 'medium' : 'bold']};
  font-size: ${({ theme, $variant }) => theme.fonts.sizes[$variant === 'product' ? 1 : 0]}px;
`;

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
  min-height: 28px;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  border-width: 2px;
  border-color: ${({ theme, $category, $selected }) => {
    if ($selected) return theme.colors.black.Black;
    if ($category === 'limpezaHigiene') return theme.colors.white[300];
    return 'transparent';
  }};
  background-color: ${({ theme, $category }) => theme.colors.tags[$category]};
`;

export const Label = styled.Text`
  color: ${({ theme, $category }) =>
    lightTextCategories.has($category)
      ? theme.colors.white[100]
      : theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
`;

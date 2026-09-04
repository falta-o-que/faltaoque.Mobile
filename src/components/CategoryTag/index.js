import { useState } from 'react';
import styled from 'styled-components/native';

export const CATEGORY_LABELS = {
  integraisCereais: 'Integrais/Cereais',
  limpezaHigiene: 'Limpeza/Higiene',
  frescos: 'Frescos',
  carnes: 'Carnes',
  bebidas: 'Bebidas',
  organicos: 'Orgânicos',
};

const lightTextCategories = new Set([
  'integraisCereais',
  'frescos',
  'carnes',
]);

const Container = styled.TouchableOpacity.attrs({
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

const Label = styled.Text`
  color: ${({ theme, $category }) =>
    lightTextCategories.has($category)
      ? theme.colors.white[100]
      : theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export function CategoryTag({
  category = 'organicos',
  label,
  selected,
  defaultSelected = false,
  onPress,
  onSelectionChange,
  ...props
}) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const resolvedCategory = CATEGORY_LABELS[category] ? category : 'organicos';
  const isControlled = selected !== undefined;
  const isSelected = isControlled ? selected : internalSelected;

  function handlePress(event) {
    const nextSelected = !isSelected;

    if (!isControlled) {
      setInternalSelected(nextSelected);
    }

    onSelectionChange?.(nextSelected);
    onPress?.(event);
  }

  return (
    <Container
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      $category={resolvedCategory}
      $selected={isSelected}
      {...props}
    >
      <Label $category={resolvedCategory}>
        {label ?? CATEGORY_LABELS[resolvedCategory]}
      </Label>
    </Container>
  );
}

export default CategoryTag;

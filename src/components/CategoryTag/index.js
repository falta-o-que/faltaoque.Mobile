import { useState } from 'react';
import { useTheme } from 'styled-components/native';
import { TagIcon } from '../../assets/icons/export';
import { Container, getTagForegroundColor, Label } from './styles';

export const CATEGORY_LABELS = {
  integraisCereais: 'Integrais/Cereais',
  limpezaHigiene: 'Limpeza/Higiene',
  frescos: 'Frescos',
  carnes: 'Carnes',
  bebidas: 'Bebidas',
  organicos: 'Orgânicos',
  outros: 'Outros',
};

export function CategoryTag({
  category = 'organicos',
  label,
  selected,
  defaultSelected = false,
  onPress,
  onSelectionChange,
  variant = 'default',
  ...props
}) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const theme = useTheme();
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
      $variant={variant}
      {...props}
    >
      <TagIcon color={getTagForegroundColor(theme, resolvedCategory)} />
      <Label $category={resolvedCategory} $variant={variant}>
        {label ?? CATEGORY_LABELS[resolvedCategory]}
      </Label>
    </Container>
  );
}

export default CategoryTag;

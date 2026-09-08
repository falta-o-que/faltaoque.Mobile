import { useState } from 'react';
import { Container, Label } from './styles';

export const CATEGORY_LABELS = {
  integraisCereais: 'Integrais/Cereais',
  limpezaHigiene: 'Limpeza/Higiene',
  frescos: 'Frescos',
  carnes: 'Carnes',
  bebidas: 'Bebidas',
  organicos: 'Orgânicos',
};

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

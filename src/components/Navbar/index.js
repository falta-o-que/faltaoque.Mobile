import { useState } from 'react';
import { useTheme } from 'styled-components/native';

import {
  DashboardIcon,
  PantryIcon,
  ShoppingListIcon,
  UserIcon,
} from '../../assets/icons/export';
import { Container, NavItem, SafeAreaContainer } from './styles';

export const DEFAULT_NAV_ITEMS = [
  { key: 'profile', label: 'Perfil', icon: UserIcon },
  { key: 'shopping-list', label: 'Lista de compras', icon: ShoppingListIcon },
  { key: 'pantry', label: 'Despensa', icon: PantryIcon },
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
];

export function Navbar({
  items = DEFAULT_NAV_ITEMS,
  activeItem,
  defaultActiveItem,
  onItemChange,
  ...props
}) {
  const theme = useTheme();
  const initialItem = defaultActiveItem ?? items[0]?.key;
  const [internalActiveItem, setInternalActiveItem] = useState(initialItem);
  const isControlled = activeItem !== undefined;
  const selectedItem = isControlled ? activeItem : internalActiveItem;

  function handleItemPress(item) {
    if (!isControlled) {
      setInternalActiveItem(item.key);
    }

    onItemChange?.(item.key, item);
    item.onPress?.();
  }

  return (
    <SafeAreaContainer edges={['bottom']} {...props}>
      <Container accessibilityRole="tablist">
        {items.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedItem === item.key;
          const color = isSelected
            ? theme.colors.black[400]
            : theme.colors.primary.Green;

          return (
            <NavItem
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleItemPress(item)}
            >
              <Icon size={24} color={color} />
            </NavItem>
          );
        })}
      </Container>
    </SafeAreaContainer>
  );
}

export default Navbar;

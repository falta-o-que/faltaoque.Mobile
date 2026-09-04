import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import {
  DashboardIcon,
  PantryIcon,
  ShoppingListIcon,
  UserIcon,
} from '../../assets/icons';

export const DEFAULT_NAV_ITEMS = [
  { key: 'profile', label: 'Perfil', icon: UserIcon },
  { key: 'shopping-list', label: 'Lista de compras', icon: ShoppingListIcon },
  { key: 'pantry', label: 'Despensa', icon: PantryIcon },
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
];

const SafeAreaContainer = styled(SafeAreaView)`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white[100]};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.white[300]};
  elevation: 6;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px -3px;
  shadow-opacity: 0.16;
  shadow-radius: 6px;
`;

const Container = styled.View`
  width: 100%;
  height: 52px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const NavItem = styled.TouchableOpacity.attrs({
  activeOpacity: 0.65,
})`
  height: 52px;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

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

import { SimpleCheckIcon } from '../../assets/icons/export';
import {
  Accent,
  Card,
  Checkbox,
  Content,
  Metadata,
  ProductName,
  Quantity,
} from './styles';

export function GroceryListItemCard({
  name,
  weight,
  size,
  quantity = 1,
  checked = false,
  onToggle,
  disabled = false,
}) {
  const metadata = [weight, size].filter(Boolean).join(' · ');
  const canToggle = !disabled && typeof onToggle === 'function';

  return (
    <Card $disabled={disabled} accessibilityRole="summary">
      <Accent />
      <Content>
        <ProductName $checked={checked}>{name}</ProductName>
        {metadata ? <Metadata>{metadata}</Metadata> : null}
        <Quantity accessibilityLabel={`Quantidade: ${quantity}`}>{quantity}</Quantity>
      </Content>
      <Checkbox
        $checked={checked}
        accessibilityLabel={checked ? `Desmarcar ${name}` : `Marcar ${name}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: !canToggle }}
        disabled={!canToggle}
        onPress={canToggle ? onToggle : undefined}
      >
        {checked ? <SimpleCheckIcon width={9} height={7} /> : null}
      </Checkbox>
    </Card>
  );
}

export default GroceryListItemCard;

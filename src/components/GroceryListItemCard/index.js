import { useState } from 'react';
import { PenIcon, SimpleCheckIcon } from '../../assets/icons/export';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import {
  Accent,
  Card,
  Checkbox,
  Content,
  EditButton,
  Metadata,
  ProductName,
  Quantity,
} from './styles';

export function GroceryListItemCard({
  name,
  category,
  weight,
  size,
  quantity = 1,
  checked = false,
  onToggle,
  onEdit,
  disabled = false,
  dimmed = disabled,
  showCheckbox = true,
}) {
  const { t } = useAppPreferences();
  const [pressed, setPressed] = useState(false);
  const metadata = [weight, size].filter(Boolean).join(' · ');
  const canToggle = showCheckbox && !disabled && typeof onToggle === 'function';

  return (
    <Card $dimmed={dimmed || pressed} accessible={false} disabled={!canToggle} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} onPress={onToggle}>
      <Accent $category={category} />
      <Content>
        <ProductName $checked={checked}>{name}</ProductName>
        {metadata ? <Metadata>{metadata}</Metadata> : null}
        <Quantity accessibilityLabel={t('shopping.quantity', { quantity })}>{quantity}</Quantity>
      </Content>
      {onEdit ? (
        <EditButton $dimmed={dimmed} accessibilityRole="button" accessibilityLabel={t('shopping.edit', { name })} disabled={disabled} onPress={(event) => { event.stopPropagation(); onEdit(); }}>
          <PenIcon size={16} color="#494949" />
        </EditButton>
      ) : null}
      {showCheckbox ? <Checkbox
        $checked={checked}
        accessibilityLabel={checked ? t('shopping.uncheck', { name }) : t('shopping.check', { name })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: !canToggle }}
        disabled={!canToggle}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={canToggle ? (event) => { event.stopPropagation(); onToggle(); } : undefined}
      >
        {checked ? <SimpleCheckIcon width={9} height={7} /> : null}
      </Checkbox> : null}
    </Card>
  );
}

export default GroceryListItemCard;

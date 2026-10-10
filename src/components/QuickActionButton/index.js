import { ActionButton, IconArea, NotificationBadge, TextButton } from './styles';

export function QuickActionButton({
  Icon,
  accessibilityLabel,
  onPress,
  selected = false,
  showBadge = false,
  text,
}) {
  return (
    <ActionButton
      $selected={selected}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
    >
      <IconArea>
        <Icon color="#FFFFFF" size={24} />
        {showBadge ? <NotificationBadge /> : null}
      </IconArea>
      <TextButton>{text}</TextButton>
    </ActionButton>
  );
}

export default QuickActionButton;

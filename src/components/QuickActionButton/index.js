import { ActionButton, TextButton } from './styles';

export function QuickActionButton({
  Icon,
  accessibilityLabel,
  onPress,
  selected = false,
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
      <Icon color="#FFFFFF" size={24} />
      <TextButton>{text}</TextButton>
    </ActionButton>
  );
}

export default QuickActionButton;

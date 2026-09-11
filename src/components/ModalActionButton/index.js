import { IconContainer, Touchable } from './styles';

export function ModalActionButton({
  accessibilityLabel,
  Icon,
  onPress,
  rotated = false,
  variant,
}) {
  return (
    <Touchable
      $variant={variant}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
    >
      <IconContainer $rotated={rotated}>
        <Icon color="#000000" height={20} size={20} width={20} />
      </IconContainer>
    </Touchable>
  );
}

export default ModalActionButton;

import { Container, isButtonVariant, Label } from './styles';

export function ButtonClick({
  children,
  title,
  variant = 'primary',
  disabled = false,
  onPress,
  ...props
}) {
  const resolvedVariant = isButtonVariant(variant) ? variant : 'primary';

  return (
    <Container
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      $variant={resolvedVariant}
      {...props}
    >
      <Label $variant={resolvedVariant}>{children ?? title}</Label>
    </Container>
  );
}

export default ButtonClick;

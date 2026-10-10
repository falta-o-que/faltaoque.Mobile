import { Button, Label } from './styles';

export default function DangerActionButton({ accessibilityLabel, disabled = false, onPress, text }) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <Label>{text}</Label>
    </Button>
  );
}

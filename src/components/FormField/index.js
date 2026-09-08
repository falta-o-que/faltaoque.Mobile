import {
  Container,
  ErrorText,
  FieldGroup,
  IconButton,
  IconContainer,
  Input,
} from './styles';

export function FormField({
  Icon,
  error,
  iconAccessibilityLabel,
  onIconPress,
  ...props
}) {
  const icon = Icon ? <Icon size={24} /> : null;

  return (
    <FieldGroup>
      <Container $hasError={Boolean(error)}>
        <Input
          aria-invalid={Boolean(error)}
          {...props}
        />
        {onIconPress ? (
          <IconButton
            accessibilityLabel={iconAccessibilityLabel}
            accessibilityRole="button"
            onPress={onIconPress}
          >
            {icon}
          </IconButton>
        ) : icon ? (
          <IconContainer>{icon}</IconContainer>
        ) : null}
      </Container>
      {error ? <ErrorText accessibilityLiveRegion="polite">{error}</ErrorText> : null}
    </FieldGroup>
  );
}

export default FormField;

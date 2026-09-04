import styled from 'styled-components/native';

const backgroundByVariant = {
  primary: (theme) => theme.colors.primary[500],
  secondary: (theme) => theme.colors.primary[500],
  danger: (theme) => theme.colors.danger[600],
};

const textColorByVariant = {
  primary: (theme) => theme.colors.white[100],
  secondary: (theme) => theme.colors.black.Black,
  danger: (theme) => theme.colors.white[100],
};

const Container = styled.TouchableOpacity.attrs(({ disabled }) => ({
  activeOpacity: 0.72,
  disabled,
}))`
  width: 100%;
  min-height: 64px;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  border-radius: 16px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ theme, $variant }) =>
    backgroundByVariant[$variant](theme)};
`;

const Label = styled.Text`
  color: ${({ theme, $variant }) => textColorByVariant[$variant](theme)};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: ${({ theme }) => theme.fonts.sizes[2]}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export function ButtonClick({
  children,
  title,
  variant = 'primary',
  disabled = false,
  onPress,
  ...props
}) {
  const resolvedVariant = backgroundByVariant[variant] ? variant : 'primary';

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

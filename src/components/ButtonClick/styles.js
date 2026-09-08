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

export const isButtonVariant = (variant) => Boolean(backgroundByVariant[variant]);

export const Container = styled.TouchableOpacity.attrs(({ disabled }) => ({
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

export const Label = styled.Text`
  color: ${({ theme, $variant }) => textColorByVariant[$variant](theme)};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: ${({ theme }) => theme.fonts.sizes[2]}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

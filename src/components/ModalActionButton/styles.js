import styled from 'styled-components/native';

export const Touchable = styled.TouchableOpacity.attrs(({ disabled }) => ({
  activeOpacity: 0.72,
  disabled,
}))`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ $variant, theme }) =>
    $variant === 'cancel' ? theme.colors.danger[500] : '#95E880'};
`;

export const IconContainer = styled.View`
  transform: ${({ $rotated }) => ($rotated ? 'rotate(45deg)' : 'rotate(0deg)')};
`;

import styled from 'styled-components/native';
import { Pressable } from 'react-native';

export const Form = styled.View`
  gap: 20px;
`;

export const Actions = styled.View`
  align-items: center;
  gap: 10px;
  margin-top: 30px;
`;

export const PrimaryButton = styled(Pressable).attrs(({ $active }) => ({
  style: {
    transform: [{ scale: $active ? 0.98 : 1 }],
  },
}))`
  width: 100%;
  height: 47px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary[300] : theme.colors.primary[200]};
`;

export const PrimaryLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const Link = styled.TouchableOpacity.attrs({ activeOpacity: 0.65 })`
  padding: 7px;
`;

export const LinkText = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 14px;
`;

export const Muted = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
`;

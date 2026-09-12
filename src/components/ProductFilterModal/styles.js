import { KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components/native';

export const Overlay = styled(KeyboardAvoidingView)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.35);
`;

export const Card = styled.View`
  width: 100%;
  max-width: 350px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;

export const Content = styled.View`
  gap: 20px;
  padding: 20px;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const Heading = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const SortSection = styled.View`
  width: 100%;
  gap: 20px;
  padding: 0 10px;
`;

export const Divider = styled.View`
  width: 100%;
  padding-bottom: 6px;
  border-bottom-width: 0.5px;
  border-bottom-color: ${({ theme }) => theme.colors.black[400]};
`;

export const SortLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const SortOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

export const SortOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-width: ${({ $selected }) => ($selected ? 2 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.tags.organicos};
`;

export const SortOptionLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 12px;
`;

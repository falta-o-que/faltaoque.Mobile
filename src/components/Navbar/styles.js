import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const SafeAreaContainer = styled(SafeAreaView)`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white[100]};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.white[300]};
  elevation: 6;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px -3px;
  shadow-opacity: 0.16;
  shadow-radius: 6px;
`;

export const Container = styled.View`
  width: 100%;
  height: 68px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

export const NavItem = styled.TouchableOpacity.attrs({
  activeOpacity: 0.65,
})`
  height: 68px;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const NavContent = styled.View`
  width: 94%;
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
`;

export const ActiveIndicator = styled.View`
  position: absolute;
  top: 0;
  width: 52px;
  height: 4px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  background-color: ${({ theme }) => theme.colors.primary.Green};
`;

export const NavLabel = styled.Text`
  margin-top: 4px;
  width: 100%;
  text-align: center;
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary.Green : theme.colors.black[400]};
  font-family: ${({ theme, $selected }) => $selected ? theme.fonts.families.inter.bold : theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

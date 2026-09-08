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
  height: 52px;
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
  height: 52px;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

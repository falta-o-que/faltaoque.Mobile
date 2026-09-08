import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const KeyboardArea = styled.KeyboardAvoidingView.attrs({
  behavior: 'padding',
})`
  flex: 1;
`;

export const ScrollArea = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  keyboardShouldPersistTaps: 'handled',
  showsVerticalScrollIndicator: false,
})``;

export const Content = styled.View`
  flex: 1;
  width: 100%;
  max-width: 390px;
  align-self: center;
  justify-content: center;
`;

export const Header = styled.View`
  align-items: center;
  margin-bottom: 50px;
`;

export const Logo = styled(Image)`
  width: 98px;
  height: 95px;
  margin-bottom: 2px;
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: 40px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
  text-align: center;
`;

export const Subtitle = styled.Text`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: 16px;
  text-align: center;
`;

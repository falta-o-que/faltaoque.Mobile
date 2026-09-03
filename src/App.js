import { Text } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import styled from 'styled-components/native';

import theme from './theme';

const Screen = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

const Title = styled(Text)`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: ${({ theme }) => theme.fonts.sizes[4]}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
    color: ${({ theme }) => theme.colors.black[600]};
`;

const Subtitle = styled(Text)`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Screen>
        <Title>Falta o que?</Title>
        <Subtitle>Tokens do Figma conectados ao app.</Subtitle>
      </Screen>
    </ThemeProvider>
  );
}

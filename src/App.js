import { ThemeProvider } from 'styled-components/native';
import styled from 'styled-components/native';

import ButtonClick from './components/ButtonClick';
import CategoryTag, { CATEGORY_LABELS } from './components/CategoryTag';
import theme from './theme';

const Screen = styled.View`
  flex: 1;
  justify-content: center;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

const Title = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.black[600]};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: ${({ theme }) => theme.fonts.sizes[4]}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

const Subtitle = styled.Text`
  margin-top: 8px;
  margin-bottom: 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

const ButtonList = styled.View`
  gap: 12px;
`;

const TagList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Screen>
        <Title>Falta o que?</Title>
        <Subtitle>Tokens do Figma conectados ao app.</Subtitle>
        <TagList>
          {Object.keys(CATEGORY_LABELS).map((category) => (
            <CategoryTag key={category} category={category} />
          ))}
        </TagList>
        <ButtonList>
          <ButtonClick title="Button" onPress={() => {}} />
          <ButtonClick title="Button" variant="secondary" onPress={() => {}} />
          <ButtonClick title="Button" variant="danger" onPress={() => {}} />
        </ButtonList>
      </Screen>
    </ThemeProvider>
  );
}

import {
  Container,
  Content,
  Header,
  KeyboardArea,
  Logo,
  ScrollArea,
  Subtitle,
  Title,
} from './styles';

const logo = require('../../assets/branding/logo.png');

export function AuthScreenLayout({ title, subtitle, children }) {
  return (
    <Container edges={['top', 'right', 'bottom', 'left']}>
      <KeyboardArea>
        <ScrollArea>
          <Content>
            <Header>
              <Logo source={logo} resizeMode="contain" accessibilityIgnoresInvertColors />
              <Title>{title}</Title>
              <Subtitle>{subtitle}</Subtitle>
            </Header>
            {children}
          </Content>
        </ScrollArea>
      </KeyboardArea>
    </Container>
  );
}

export default AuthScreenLayout;

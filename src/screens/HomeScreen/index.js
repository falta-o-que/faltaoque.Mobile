import Navbar from '../../components/Navbar';
import {
  Avatar,
  Content,
  EmptyText,
  Greeting,
  PantryTitle,
  Question,
  QuickAction,
  QuickActions,
  QuickLabel,
  Screen,
  Section,
  Subtitle,
} from './styles';

export function HomeScreen() {
  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Avatar />
        <Greeting>Oi, pessoa viva</Greeting>
        <Subtitle>Sua casa está no ritmo.</Subtitle>
        <Section>
          <Question>O que você quer fazer?</Question>
          <QuickActions>
            {['Despensa', 'Notif.', 'Perfil', 'Config.'].map((label) => (
              <QuickAction key={label} accessibilityRole="button">
                <QuickLabel>{label}</QuickLabel>
              </QuickAction>
            ))}
          </QuickActions>
        </Section>
        <Section>
          <PantryTitle>Suas despensas</PantryTitle>
          <EmptyText>Você ainda não possui despensas...</EmptyText>
        </Section>
      </Content>
      <Navbar activeItem="pantry" />
    </Screen>
  );
}

export default HomeScreen;

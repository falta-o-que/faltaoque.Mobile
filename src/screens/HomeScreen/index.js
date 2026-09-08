import { Alert } from 'react-native';

import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
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
  const { account, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Deseja encerrar esta sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Content>
        <Avatar />
        <Greeting>Oi, {account?.name ?? 'pessoa viva'}</Greeting>
        <Subtitle>Sua casa está no ritmo.</Subtitle>
        <Section>
          <Question>O que você quer fazer?</Question>
          <QuickActions>
            {['Despensa', 'Notif.', 'Perfil', 'Sair'].map((label) => (
              <QuickAction
                key={label}
                accessibilityRole="button"
                onPress={label === 'Sair' ? handleLogout : undefined}
              >
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

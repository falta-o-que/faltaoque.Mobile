import { useState } from 'react';
import { Alert } from 'react-native';

import Navbar from '../../components/Navbar';
import QuickActionButton from '../../components/QuickActionButton';
import {
  PantryIcon,
  SettingsIcon,
  SinoIcon,
  UserIcon,
} from '../../assets/icons/export';
import { useAuth } from '../../contexts/AuthContext';
import {
  Avatar,
  Content,
  EmptyText,
  Greeting,
  PantryTitle,
  Question,
  QuickActions,
  Screen,
  Section,
  Subtitle,
} from './styles';

const QUICK_ACTIONS = [
  { key: 'pantry', label: 'Despensa', text: 'Despensa', icon: PantryIcon },
  { key: 'notifications', label: 'Notificações', text: 'Notif.', icon: SinoIcon },
  { key: 'profile', label: 'Perfil', text: 'Perfil', icon: UserIcon },
  { key: 'settings', label: 'Configurações', text: 'Config.', icon: SettingsIcon },
];

export function HomeScreen() {
  const { account } = useAuth();
  const [selectedAction, setSelectedAction] = useState('pantry');

  const handleActionPress = (key, label) => {
    if (key === 'pantry') {
      setSelectedAction(key);
      return;
    }

    Alert.alert('Em breve', `${label} estará disponível em breve.`);
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
            {QUICK_ACTIONS.map(({ icon, key, label, text }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={label}
                onPress={() => handleActionPress(key, label)}
                selected={selectedAction === key}
                text={text}
              />
            ))}
          </QuickActions>
        </Section>
        {selectedAction === 'pantry' ? (
          <Section>
            <PantryTitle>Suas despensas</PantryTitle>
            <EmptyText>Você ainda não possui despensas...</EmptyText>
          </Section>
        ) : null}
      </Content>
      <Navbar activeItem="profile" />
    </Screen>
  );
}

export default HomeScreen;

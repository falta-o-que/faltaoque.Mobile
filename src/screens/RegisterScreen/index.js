import { useState } from 'react';

import AuthScreenLayout from '../../components/AuthScreenLayout';
import FormField from '../../components/FormField';
import {
  BackLink,
  BackText,
  Checkbox,
  Checkmark,
  ColorField,
  ColorGrid,
  ColorOption,
  FieldLabel,
  Form,
  Muted,
  PrimaryButton,
  PrimaryLabel,
  Terms,
  TermsText,
} from './styles';

const AVATAR_COLORS = [
  '#10d8df', '#75c2df', '#202e67', '#0736ec', '#540018', '#7a13ce',
  '#b45ab4', '#2eb842', '#8cecc6', '#ff1414', '#ffae00', '#00d80b',
];

export function RegisterScreen({ navigation }) {
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <AuthScreenLayout title="Crie sua conta" subtitle="Leva menos de dois minutos.">
      <Form>
        <FormField accessibilityLabel="Nome" autoComplete="name" placeholder="Nome" />
        <FormField
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
        />
        <ColorField>
          <FieldLabel>Cor do avatar</FieldLabel>
          <ColorGrid>
            {AVATAR_COLORS.map((color) => (
              <ColorOption
                key={color}
                accessibilityLabel={`Selecionar cor ${color}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: avatarColor === color }}
                onPress={() => setAvatarColor(color)}
                $color={color}
                $selected={avatarColor === color}
              />
            ))}
          </ColorGrid>
        </ColorField>
        <FormField accessibilityLabel="Senha" placeholder="Senha" secureTextEntry />
        <FormField
          accessibilityLabel="Confirmar senha"
          placeholder="Confirmar senha"
          secureTextEntry
        />
      </Form>
      <Terms
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        onPress={() => setAcceptedTerms((value) => !value)}
      >
        <Checkbox>{acceptedTerms ? <Checkmark>✓</Checkmark> : null}</Checkbox>
        <TermsText>Concordo com os Termos de Uso e a Política de Privacidade.</TermsText>
      </Terms>
      <PrimaryButton accessibilityRole="button" disabled>
        <PrimaryLabel>Criar conta</PrimaryLabel>
      </PrimaryButton>
      <BackLink accessibilityRole="button" onPress={() => navigation.goBack()}>
        <BackText><Muted>Já possui conta?</Muted> Logar</BackText>
      </BackLink>
    </AuthScreenLayout>
  );
}

export default RegisterScreen;

import AuthScreenLayout from '../../components/AuthScreenLayout';
import FormField from '../../components/FormField';
import { PUBLIC_ROUTES } from '../../navigation/routes';
import {
  Actions,
  Form,
  Link,
  LinkText,
  Muted,
  PrimaryButton,
  PrimaryLabel,
} from './styles';

export function LoginScreen({ navigation }) {
  return (
    <AuthScreenLayout title="FaltaOquê?" subtitle="Sua casa abastecida na hora certa.">
      <Form>
        <FormField
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
        />
        <FormField
          accessibilityLabel="Senha"
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Senha"
          secureTextEntry
        />
      </Form>
      <Actions>
        <PrimaryButton accessibilityRole="button" disabled>
          <PrimaryLabel>Entrar</PrimaryLabel>
        </PrimaryButton>
        <Link accessibilityRole="button">
          <LinkText>Esqueci a Senha</LinkText>
        </Link>
        <Link
          accessibilityRole="button"
          onPress={() => navigation.navigate(PUBLIC_ROUTES.REGISTER)}
        >
          <LinkText><Muted>Ainda não tem conta?</Muted> Criar conta</LinkText>
        </Link>
      </Actions>
    </AuthScreenLayout>
  );
}

export default LoginScreen;

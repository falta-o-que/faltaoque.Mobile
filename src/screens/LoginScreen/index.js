import { useState } from 'react';
import { Alert } from 'react-native';

import AuthScreenLayout from '../../components/AuthScreenLayout';
import FormField from '../../components/FormField';
import { EmailIcon, EyeClosedIcon, EyeIcon } from '../../assets/icons/export';
import { hasValidationErrors, validateLogin } from '../../domain/authValidation';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitActive, setIsSubmitActive] = useState(false);

  const handleEmailChange = (value) => {
    setEmail(value);
    setErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
  };

  const handleSubmit = () => {
    const validationErrors = validateLogin({ email, password });

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperação de senha',
      'Este recurso será implementado em breve.',
      [{ text: 'Entendi' }],
    );
  };

  return (
    <AuthScreenLayout title="FaltaOquê?" subtitle="Sua casa abastecida na hora certa.">
      <Form>
        <FormField
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={handleEmailChange}
          error={errors.email}
          Icon={EmailIcon}
        />
        <FormField
          accessibilityLabel="Senha"
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Senha"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={handlePasswordChange}
          error={errors.password}
          Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          onIconPress={() => setIsPasswordVisible((value) => !value)}
        />
      </Form>
      <Actions>
        <PrimaryButton
          $active={isSubmitActive}
          accessibilityRole="button"
          onHoverIn={() => setIsSubmitActive(true)}
          onHoverOut={() => setIsSubmitActive(false)}
          onPress={handleSubmit}
          onPressIn={() => setIsSubmitActive(true)}
          onPressOut={() => setIsSubmitActive(false)}
        >
          <PrimaryLabel>Entrar</PrimaryLabel>
        </PrimaryButton>
        <Link accessibilityRole="button" onPress={handleForgotPassword}>
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

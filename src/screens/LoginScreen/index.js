import { useState } from 'react';
import { Alert } from 'react-native';

import AuthScreenLayout from '../../components/AuthScreenLayout';
import FormField from '../../components/FormField';
import { EmailIcon, EyeClosedIcon, EyeIcon } from '../../assets/icons/export';
import { hasValidationErrors, validateLogin } from '../../domain/authValidation';
import { PUBLIC_ROUTES } from '../../navigation/routes';
import { useAuth } from '../../contexts/AuthContext';
import { showUserErrorAlert } from '../../utils/userErrors';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import {IS_DEMO_VARIANT} from '../../config/appVariant';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginDemo } = useAuth();
  const { t } = useAppPreferences();
  const errorText = (error) => error ? t(error) : undefined;

  const handleEmailChange = (value) => {
    setEmail(value);
    setErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateLogin({ email, password });

    if (hasValidationErrors(validationErrors)) {
      setErrors(Object.fromEntries(Object.entries(validationErrors).map(([key, value]) => [key, errorText(value)])));
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
    } catch (error) {
      if (error?.message === 'LOGIN_ACCOUNT_NOT_FOUND') {
        Alert.alert(t('auth.login.accountNotFoundTitle'), t('auth.login.accountNotFoundMessage'), [
          { text: t('auth.login.checkCredentials'), style: 'cancel' },
          { text: t('auth.login.createAccount'), onPress: () => navigation.navigate(PUBLIC_ROUTES.REGISTER) },
        ]);
      } else if (error?.message === 'INVALID_CREDENTIALS') {
        Alert.alert(t('auth.login.incorrectPasswordTitle'), t('auth.login.incorrectPasswordMessage'), [{ text: t('auth.common.ok') }]);
      } else {
        showUserErrorAlert(error, { title: t('auth.errors.loginTitle'), fallback: t('auth.errors.connection'), dismissText: t('auth.common.ok'), t });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t('auth.login.forgotTitle'),
      t('auth.login.forgotBody'),
      [{ text: t('auth.common.ok') }],
    );
  };

  const handleDemoLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginDemo();
    } catch (error) {
      showUserErrorAlert(error, { title: t('auth.errors.loginTitle'), fallback: t('auth.errors.connection'), dismissText: t('auth.common.ok'), t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout title={IS_DEMO_VARIANT ? 'FaltaOquê? Demo' : 'FaltaOquê?'} subtitle={t('auth.login.subtitle')}>
      <Form>
        <FormField
          accessibilityLabel={t('auth.login.email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder={t('auth.login.email')}
          value={email}
          onChangeText={handleEmailChange}
          error={errors.email}
          Icon={EmailIcon}
        />
        <FormField
          accessibilityLabel={t('auth.login.password')}
          autoCapitalize="none"
          autoComplete="password"
          placeholder={t('auth.login.password')}
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={handlePasswordChange}
          error={errors.password}
          Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isPasswordVisible ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          onIconPress={() => setIsPasswordVisible((value) => !value)}
        />
      </Form>
      <Actions>
        <PrimaryButton
          $active={isSubmitActive}
          accessibilityRole="button"
          disabled={isSubmitting}
          onHoverIn={() => setIsSubmitActive(true)}
          onHoverOut={() => setIsSubmitActive(false)}
          onPress={handleSubmit}
          onPressIn={() => setIsSubmitActive(true)}
          onPressOut={() => setIsSubmitActive(false)}
        >
          <PrimaryLabel>{isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}</PrimaryLabel>
        </PrimaryButton>
        {IS_DEMO_VARIANT ? <Link accessibilityRole="button" disabled={isSubmitting} onPress={handleDemoLogin}>
          <LinkText>{t('auth.login.demo')}</LinkText>
        </Link> : null}
        <Link accessibilityRole="button" onPress={handleForgotPassword}>
          <LinkText>{t('auth.login.forgotPassword')}</LinkText>
        </Link>
        <Link
          accessibilityRole="button"
          onPress={() => navigation.navigate(PUBLIC_ROUTES.REGISTER)}
        >
          <LinkText><Muted>{t('auth.login.noAccount')}</Muted> {t('auth.login.createAccount')}</LinkText>
        </Link>
      </Actions>
    </AuthScreenLayout>
  );
}

export default LoginScreen;

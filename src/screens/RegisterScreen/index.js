import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing } from 'react-native';

import AuthScreenLayout from '../../components/AuthScreenLayout';
import FormField from '../../components/FormField';
import {
  AngleIcon,
  CheckIcon,
  EmailIcon,
  EyeClosedIcon,
  EyeIcon,
  UserIcon,
} from '../../assets/icons/export';
import {
  hasValidationErrors,
  validateRegistration,
} from '../../domain/authValidation';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  BackLink,
  BackText,
  Checkbox,
  ColorChevron,
  ColorField,
  ColorFieldHeader,
  ColorGrid,
  ColorOption,
  ColorPanel,
  ColorRow,
  EmptyCheckbox,
  FieldLabel,
  Form,
  InlineError,
  Muted,
  PrimaryButton,
  PrimaryLabel,
  Terms,
  TermsText,
} from './styles';

export function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarColor, setAvatarColor] = useState(null);
  const [isAvatarColorOpen, setIsAvatarColorOpen] = useState(false);
  const [shouldRenderAvatarColorPanel, setShouldRenderAvatarColorPanel] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isSubmitActive, setIsSubmitActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeRegistration, register } = useAuth();
  const { t } = useAppPreferences();
  const localizedErrors = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ? t(value) : value]));
  const avatarColorMenuProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAvatarColorOpen) {
      setShouldRenderAvatarColorPanel(true);
    }
  }, [isAvatarColorOpen]);

  useEffect(() => {
    if (!shouldRenderAvatarColorPanel) {
      return undefined;
    }

    const animation = Animated.timing(avatarColorMenuProgress, {
      toValue: isAvatarColorOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !isAvatarColorOpen) {
        setShouldRenderAvatarColorPanel(false);
      }
    });

    return () => animation.stop();
  }, [avatarColorMenuProgress, isAvatarColorOpen, shouldRenderAvatarColorPanel]);

  const avatarColorPanelStyle = {
    opacity: avatarColorMenuProgress,
    transform: [
      {
        scaleY: avatarColorMenuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
      {
        translateY: avatarColorMenuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
  };

  const avatarColorChevronStyle = {
    transform: [
      {
        rotate: avatarColorMenuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const formValues = {
    name,
    email,
    avatarColor,
    password,
    passwordConfirmation,
    acceptedTerms,
  };
  const formHasErrors = hasValidationErrors(errors);
  const formNeedsScroll =
    isAvatarColorOpen || shouldRenderAvatarColorPanel || formHasErrors;

  const updateField = (field, value) => {
    const nextValues = { ...formValues, [field]: value };

    if (errors[field] || (field === 'password' && errors.passwordConfirmation)) {
      const nextErrors = localizedErrors(validateRegistration(nextValues));
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: nextErrors[field],
        ...(field === 'password'
          ? { passwordConfirmation: nextErrors.passwordConfirmation }
          : {}),
      }));
    }

    return value;
  };

  const handleCreateAccount = async () => {
    const validationErrors = validateRegistration(formValues);
    setErrors(localizedErrors(validationErrors));

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const account = await register({ name, email, avatarColor, password });

      Alert.alert(
        t('auth.register.createdTitle'),
        t('auth.register.createdBody'),
        [{ text: t('auth.common.continue'), onPress: () => completeRegistration(account) }],
        { cancelable: false },
      );
    } catch (error) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        setErrors((currentErrors) => ({
          ...currentErrors,
          email: t('auth.errors.emailExists'),
        }));
        return;
      }

      showUserErrorAlert(error, { title: t('auth.errors.registerTitle'), fallback: t('auth.errors.connection'), dismissText: t('auth.common.ok') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <Form
        $expanded={isAvatarColorOpen || shouldRenderAvatarColorPanel}
        scrollEnabled={formNeedsScroll}
      >
        <FormField
          accessibilityLabel={t('auth.common.name')}
          autoComplete="name"
          error={errors.name}
          onChangeText={(value) => setName(updateField('name', value))}
          placeholder={t('auth.common.name')}
          value={name}
          Icon={UserIcon}
        />
        <FormField
          accessibilityLabel={t('auth.login.email')}
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          onChangeText={(value) => setEmail(updateField('email', value))}
          placeholder={t('auth.login.email')}
          value={email}
          Icon={EmailIcon}
        />
        <ColorField>
          <ColorFieldHeader
            accessibilityRole="button"
            accessibilityState={{ expanded: isAvatarColorOpen }}
            onPress={() => setIsAvatarColorOpen((value) => !value)}
          >
            <FieldLabel>{t('auth.common.avatarColor')}</FieldLabel>
            <ColorChevron style={avatarColorChevronStyle}>
              <AngleIcon />
            </ColorChevron>
          </ColorFieldHeader>
          {shouldRenderAvatarColorPanel ? (
            <ColorPanel style={avatarColorPanelStyle}>
              <ColorGrid>
                {COLOR_OPTION_ROWS.map((row, rowIndex) => (
                  <ColorRow key={`avatar-color-row-${rowIndex + 1}`}>
                    {row.map((color) => (
                      <ColorOption
                        key={color}
                        accessibilityLabel={t('auth.common.selectColor', { color })}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: avatarColor === color }}
                        onPress={() => setAvatarColor(updateField('avatarColor', color))}
                        $color={color}
                        $selected={avatarColor === color}
                      />
                    ))}
                  </ColorRow>
                ))}
              </ColorGrid>
            </ColorPanel>
          ) : null}
          {errors.avatarColor ? <InlineError accessibilityLiveRegion="polite" accessibilityRole="alert">{errors.avatarColor}</InlineError> : null}
        </ColorField>
        <FormField
          accessibilityLabel={t('auth.login.password')}
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.password}
          onChangeText={(value) => setPassword(updateField('password', value))}
          placeholder={t('auth.login.password')}
          secureTextEntry={!isPasswordVisible}
          value={password}
          Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isPasswordVisible ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          onIconPress={() => setIsPasswordVisible((value) => !value)}
        />
        <FormField
          accessibilityLabel={t('auth.common.confirmPassword')}
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.passwordConfirmation}
          onChangeText={(value) => setPasswordConfirmation(updateField('passwordConfirmation', value))}
          placeholder={t('auth.common.confirmPassword')}
          secureTextEntry={!isConfirmationVisible}
          value={passwordConfirmation}
          Icon={isConfirmationVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isConfirmationVisible ? t('auth.common.hideConfirmation') : t('auth.common.showConfirmation')}
          onIconPress={() => setIsConfirmationVisible((value) => !value)}
        />
      </Form>
      <Terms
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        onPress={() => setAcceptedTerms(updateField('acceptedTerms', !acceptedTerms))}
      >
        <Checkbox>
          {acceptedTerms ? <CheckIcon width={22} height={23} /> : <EmptyCheckbox />}
        </Checkbox>
        <TermsText>{t('auth.register.agreeTerms')}</TermsText>
      </Terms>
      {errors.acceptedTerms ? <InlineError accessibilityLiveRegion="polite" accessibilityRole="alert">{errors.acceptedTerms}</InlineError> : null}
      <PrimaryButton
        $active={isSubmitActive}
        accessibilityRole="button"
        disabled={isSubmitting}
        onHoverIn={() => setIsSubmitActive(true)}
        onHoverOut={() => setIsSubmitActive(false)}
        onPress={handleCreateAccount}
        onPressIn={() => setIsSubmitActive(true)}
        onPressOut={() => setIsSubmitActive(false)}
      >
        <PrimaryLabel>{isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}</PrimaryLabel>
      </PrimaryButton>
      <BackLink accessibilityRole="button" onPress={() => navigation.goBack()}>
        <BackText><Muted>{t('auth.register.hasAccount')}</Muted> {t('auth.register.login')}</BackText>
      </BackLink>
    </AuthScreenLayout>
  );
}

export default RegisterScreen;

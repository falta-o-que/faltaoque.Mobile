import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

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

const AVATAR_COLORS = [
  '#00F0FF', '#75C1E0', '#1E2B5E', '#0031F5', '#470419', '#7115C2',
  '#B666B2', '#36B83F', '#97F7CD', '#FF0505', '#FFB405', '#00DD00',
];

const AVATAR_COLOR_ROWS = [
  AVATAR_COLORS.slice(0, 6),
  AVATAR_COLORS.slice(6, 12),
];

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
      const nextErrors = validateRegistration(nextValues);
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

  const handleCreateAccount = () => {
    const validationErrors = validateRegistration(formValues);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }
  };

  return (
    <AuthScreenLayout title="Crie sua conta" subtitle="Leva menos de dois minutos.">
      <Form
        $expanded={isAvatarColorOpen || shouldRenderAvatarColorPanel}
        scrollEnabled={formNeedsScroll}
      >
        <FormField
          accessibilityLabel="Nome"
          autoComplete="name"
          error={errors.name}
          onChangeText={(value) => setName(updateField('name', value))}
          placeholder="Nome"
          value={name}
          Icon={UserIcon}
        />
        <FormField
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          onChangeText={(value) => setEmail(updateField('email', value))}
          placeholder="Email"
          value={email}
          Icon={EmailIcon}
        />
        <ColorField>
          <ColorFieldHeader
            accessibilityRole="button"
            accessibilityState={{ expanded: isAvatarColorOpen }}
            onPress={() => setIsAvatarColorOpen((value) => !value)}
          >
            <FieldLabel>Cor do avatar</FieldLabel>
            <ColorChevron style={avatarColorChevronStyle}>
              <AngleIcon />
            </ColorChevron>
          </ColorFieldHeader>
          {shouldRenderAvatarColorPanel ? (
            <ColorPanel style={avatarColorPanelStyle}>
              <ColorGrid>
                {AVATAR_COLOR_ROWS.map((row, rowIndex) => (
                  <ColorRow key={`avatar-color-row-${rowIndex + 1}`}>
                    {row.map((color) => (
                      <ColorOption
                        key={color}
                        accessibilityLabel={`Selecionar cor ${color}`}
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
          {errors.avatarColor ? <InlineError>{errors.avatarColor}</InlineError> : null}
        </ColorField>
        <FormField
          accessibilityLabel="Senha"
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.password}
          onChangeText={(value) => setPassword(updateField('password', value))}
          placeholder="Senha"
          secureTextEntry={!isPasswordVisible}
          value={password}
          Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          onIconPress={() => setIsPasswordVisible((value) => !value)}
        />
        <FormField
          accessibilityLabel="Confirmar senha"
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.passwordConfirmation}
          onChangeText={(value) => setPasswordConfirmation(updateField('passwordConfirmation', value))}
          placeholder="Confirmar senha"
          secureTextEntry={!isConfirmationVisible}
          value={passwordConfirmation}
          Icon={isConfirmationVisible ? EyeIcon : EyeClosedIcon}
          iconAccessibilityLabel={isConfirmationVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
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
        <TermsText>Concordo com os Termos de Uso e a Política de Privacidade.</TermsText>
      </Terms>
      {errors.acceptedTerms ? <InlineError>{errors.acceptedTerms}</InlineError> : null}
      <PrimaryButton
        $active={isSubmitActive}
        accessibilityRole="button"
        onHoverIn={() => setIsSubmitActive(true)}
        onHoverOut={() => setIsSubmitActive(false)}
        onPress={handleCreateAccount}
        onPressIn={() => setIsSubmitActive(true)}
        onPressOut={() => setIsSubmitActive(false)}
      >
        <PrimaryLabel>Criar conta</PrimaryLabel>
      </PrimaryButton>
      <BackLink accessibilityRole="button" onPress={() => navigation.goBack()}>
        <BackText><Muted>Já possui conta?</Muted> Logar</BackText>
      </BackLink>
    </AuthScreenLayout>
  );
}

export default RegisterScreen;

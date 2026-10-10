import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import { AngleIcon, EmailIcon, EyeClosedIcon, EyeIcon, PantryIcon, SettingsIcon, SinoIcon, UserIcon } from '../../assets/icons/export';
import AnimatedDropdown from '../../components/AnimatedDropdown';
import FormField from '../../components/FormField';
import Navbar from '../../components/Navbar';
import QuickActionButton from '../../components/QuickActionButton';
import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { hasValidationErrors, validateProfile } from '../../domain/authValidation';
import { useAuth } from '../../contexts/AuthContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listNotifications, syncDeviceNotifications } from '../../services/notificationService';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  Avatar,
  CancelButton,
  CancelLabel,
  ColorField,
  ColorFieldHeader,
  ColorGrid,
  ColorOption,
  ColorPanel,
  ColorRow,
  Content,
  FieldLabel,
  Form,
  FormScroll,
  GradientBackground,
  Greeting,
  GreetingGroup,
  HeadingMarker,
  InlineError,
  KeyboardArea,
  ProfileHeading,
  ProfileSection,
  ProfileTitle,
  QuickActions,
  QuickSection,
  Question,
  SaveButton,
  SaveLabel,
  Screen,
  SectionTitleGroup,
  Subtitle,
  Chevron,
} from './styles';

const QUICK_ACTIONS = [
  { key: 'pantry', label: 'Despensa', text: 'Despensa', icon: PantryIcon },
  { key: 'notifications', label: 'Notificações', text: 'Notif.', icon: SinoIcon },
  { key: 'profile', label: 'Perfil', text: 'Perfil', icon: UserIcon },
  { key: 'settings', label: 'Configurações', text: 'Config.', icon: SettingsIcon },
];

export default function ProfileScreen({ navigation, embedded = false }) {
  const { account, updateProfile } = useAuth();
  const [name, setName] = useState(account?.name ?? '');
  const [email, setEmail] = useState(account?.email ?? '');
  const [avatarColor, setAvatarColor] = useState(account?.avatarColor ?? '#1E2B5E');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const colorChevronProgress = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    let isActive = true;

    syncDeviceNotifications(account?.id)
      .then(({ unreadCount }) => {
        if (isActive) setHasUnreadNotifications(unreadCount > 0);
      })
      .catch(() => listNotifications(account?.id)
        .then((items) => {
          if (isActive) setHasUnreadNotifications(items.some((item) => !item.isRead));
        })
        .catch(() => {}));

    return () => { isActive = false; };
  }, [account?.id]));

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      syncDeviceNotifications(account?.id)
        .then(({ unreadCount }) => setHasUnreadNotifications(unreadCount > 0))
        .catch(() => listNotifications(account?.id)
          .then((items) => setHasUnreadNotifications(items.some((item) => !item.isRead)))
          .catch(() => {}));
    });

    return () => subscription.remove();
  }, [account?.id]);

  useEffect(() => {
    setName(account?.name ?? '');
    setEmail(account?.email ?? '');
    setAvatarColor(account?.avatarColor ?? '#1E2B5E');
    setPassword('');
    setPasswordConfirmation('');
    setIsPasswordVisible(false);
    setIsPasswordConfirmationVisible(false);
  }, [account?.id, account?.name, account?.email, account?.avatarColor]);

  useEffect(() => {
    const animation = Animated.timing(colorChevronProgress, {
      toValue: isColorOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [colorChevronProgress, isColorOpen]);

  const chevronStyle = {
    transform: [{
      rotate: colorChevronProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  const currentValues = { name, email, avatarColor, password, passwordConfirmation };
  const updateField = (field, value) => {
    const relatedFields = field === 'password' || field === 'passwordConfirmation'
      ? ['password', 'passwordConfirmation']
      : [field];
    if (relatedFields.some((relatedField) => errors[relatedField])) {
      const validationErrors = validateProfile({ ...currentValues, [field]: value });
      setErrors((current) => ({
        ...current,
        ...Object.fromEntries(relatedFields.map((relatedField) => [relatedField, validationErrors[relatedField]])),
      }));
    }
  };

  const resetForm = () => {
    setName(account?.name ?? '');
    setEmail(account?.email ?? '');
    setAvatarColor(account?.avatarColor ?? '#1E2B5E');
    setPassword('');
    setPasswordConfirmation('');
    setIsPasswordVisible(false);
    setIsPasswordConfirmationVisible(false);
    setErrors({});
    setIsColorOpen(false);
  };

  const handleSave = async () => {
    const validationErrors = validateProfile({ name, email, avatarColor, password, passwordConfirmation });
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors) || isSaving) return;

    try {
      setIsSaving(true);
      await updateProfile({ name, email, avatarColor, password });
      setPassword('');
      setPasswordConfirmation('');
      setIsPasswordVisible(false);
      setIsPasswordConfirmationVisible(false);
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas.');
    } catch (error) {
      if (error?.message === 'EMAIL_ALREADY_EXISTS') {
        setErrors((current) => ({ ...current, email: 'Este e-mail já está cadastrado.' }));
        return;
      }
      showUserErrorAlert(error, {
        title: 'Não foi possível salvar o perfil',
        fallback: 'Seus dados não foram alterados. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAction = (key, label) => {
    if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'notifications') navigation.navigate(AUTHENTICATED_ROUTES.NOTIFICATIONS);
    else if (key === 'settings') Alert.alert('Em breve', `${label} estará disponível em breve.`);
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') return;
    if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else Alert.alert('Em breve', `${item.label} estará disponível em breve.`);
  };

  const profileSection = (
    <ProfileSection>
          <ProfileHeading>
            <SectionTitleGroup>
              <HeadingMarker $color={account?.avatarColor} />
              <ProfileTitle>Configurações de Perfil</ProfileTitle>
            </SectionTitleGroup>
          </ProfileHeading>

          <KeyboardArea>
          <FormScroll>
          <Form>
          <FormField
            accessibilityLabel="Nome"
            autoComplete="name"
            error={errors.name}
            onChangeText={(value) => { updateField('name', value); setName(value); }}
            placeholder="Nome"
            returnKeyType="next"
            value={name}
            Icon={UserIcon}
          />
          <FormField
            accessibilityLabel="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            keyboardType="email-address"
            onChangeText={(value) => { updateField('email', value); setEmail(value); }}
            placeholder="Email"
            returnKeyType="next"
            value={email}
            Icon={EmailIcon}
          />

          <ColorField>
            <ColorFieldHeader
              accessibilityRole="button"
              accessibilityState={{ expanded: isColorOpen }}
              onPress={() => setIsColorOpen((open) => !open)}
            >
              <FieldLabel>Cor do avatar</FieldLabel>
              <Chevron style={chevronStyle}><AngleIcon /></Chevron>
            </ColorFieldHeader>
            <AnimatedDropdown open={isColorOpen}>
              <ColorPanel>
                <ColorGrid>
                  {COLOR_OPTION_ROWS.map((row, rowIndex) => (
                    <ColorRow key={`avatar-color-row-${rowIndex + 1}`}>
                      {row.map((color) => (
                        <ColorOption
                          key={color}
                          accessibilityLabel={`Selecionar cor ${color}`}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: avatarColor === color }}
                          onPress={() => { setAvatarColor(color); updateField('avatarColor', color); }}
                          $color={color}
                          $selected={avatarColor === color}
                        />
                      ))}
                    </ColorRow>
                  ))}
                </ColorGrid>
              </ColorPanel>
            </AnimatedDropdown>
            {errors.avatarColor ? <InlineError accessibilityLiveRegion="polite" accessibilityRole="alert">{errors.avatarColor}</InlineError> : null}
          </ColorField>

          <FormField
            accessibilityLabel="Nova senha para alterar a senha"
            accessibilityHint="Preencha para atualizar a senha. Deixe vazio para manter a senha atual."
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.password}
            onChangeText={(value) => { updateField('password', value); setPassword(value); }}
            placeholder="Nova senha"
            returnKeyType="done"
            secureTextEntry={!isPasswordVisible}
            value={password}
            Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
            iconAccessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            onIconPress={() => setIsPasswordVisible((visible) => !visible)}
          />
          <FormField
            accessibilityLabel="Confirmar nova senha"
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.passwordConfirmation}
            onChangeText={(value) => { updateField('passwordConfirmation', value); setPasswordConfirmation(value); }}
            placeholder="Confirmar nova senha"
            returnKeyType="done"
            secureTextEntry={!isPasswordConfirmationVisible}
            value={passwordConfirmation}
            Icon={isPasswordConfirmationVisible ? EyeIcon : EyeClosedIcon}
            iconAccessibilityLabel={isPasswordConfirmationVisible ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
            onIconPress={() => setIsPasswordConfirmationVisible((visible) => !visible)}
          />

          <SaveButton accessibilityRole="button" disabled={isSaving} onPress={handleSave}>
            <SaveLabel>{isSaving ? 'Salvando...' : 'Salvar'}</SaveLabel>
          </SaveButton>
          <CancelButton accessibilityRole="button" disabled={isSaving} onPress={resetForm}>
            <CancelLabel>Cancelar</CancelLabel>
          </CancelButton>
          </Form>
          </FormScroll>
          </KeyboardArea>
    </ProfileSection>
  );

  if (embedded) return profileSection;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GradientBackground colors={['#FFFFFF', '#F9F9F9']} />
      <Content>
        <GreetingGroup>
          <Avatar $color={account?.avatarColor ?? '#1E2B5E'} />
          <Greeting numberOfLines={1}>Oi, {account?.name ?? 'pessoa viva'}</Greeting>
          <Subtitle>Sua casa está no ritmo.</Subtitle>
        </GreetingGroup>

        <QuickSection>
          <Question>O que você quer fazer?</Question>
          <QuickActions>
            {QUICK_ACTIONS.map(({ icon, key, label, text }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={label}
                onPress={() => handleQuickAction(key, label)}
                selected={key === 'profile'}
                showBadge={key === 'notifications' && hasUnreadNotifications}
                text={text}
              />
            ))}
          </QuickActions>
        </QuickSection>
        {profileSection}
      </Content>
      <Navbar activeItem="profile" onItemChange={handleNavbar} />
    </Screen>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import { AngleIcon, EmailIcon, EyeClosedIcon, EyeIcon, PantryIcon, SettingsIcon, SinoIcon, UserIcon } from '../../assets/icons/export';
import AnimatedDropdown from '../../components/AnimatedDropdown';
import FormField from '../../components/FormField';
import Navbar from '../../components/Navbar';
import FormActions from '../../components/FormActions';
import ScreenSectionHeading from '../../components/ScreenSectionHeading';
import QuickActionButton from '../../components/QuickActionButton';
import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { hasValidationErrors, validateProfile } from '../../domain/authValidation';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { AUTHENTICATED_ROUTES } from '../../navigation/routes';
import { listNotifications, syncDeviceNotifications } from '../../services/notificationService';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  Avatar,
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
  InlineError,
  KeyboardArea,
  ProfileSection,
  QuickActions,
  QuickSection,
  Question,
  Screen,
  Subtitle,
  Chevron,
} from './styles';

const QUICK_ACTIONS = [
  { key: 'pantry', labelKey: 'auth.quick.pantry', textKey: 'auth.quick.pantry', icon: PantryIcon },
  { key: 'notifications', labelKey: 'auth.quick.notifications', textKey: 'auth.quick.notificationsShort', icon: SinoIcon },
  { key: 'profile', labelKey: 'auth.quick.profile', textKey: 'auth.quick.profile', icon: UserIcon },
  { key: 'settings', labelKey: 'auth.quick.settings', textKey: 'auth.quick.settingsShort', icon: SettingsIcon },
];

export default function ProfileScreen({ navigation, embedded = false }) {
  const { account, updateProfile } = useAuth();
  const { t } = useAppPreferences();
  const localizedErrors = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ? t(value) : value]));
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
      const validationErrors = localizedErrors(validateProfile({ ...currentValues, [field]: value }));
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
    const validationErrors = localizedErrors(validateProfile({ name, email, avatarColor, password, passwordConfirmation }));
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors) || isSaving) return;

    try {
      setIsSaving(true);
      await updateProfile({ name, email, avatarColor, password });
      setPassword('');
      setPasswordConfirmation('');
      setIsPasswordVisible(false);
      setIsPasswordConfirmationVisible(false);
      Alert.alert(t('auth.profile.updatedTitle'), t('auth.profile.updatedBody'), [{ text: t('common.ok') }]);
    } catch (error) {
      if (error?.message === 'EMAIL_ALREADY_EXISTS') {
        setErrors((current) => ({ ...current, email: t('auth.errors.emailExists') }));
        return;
      }
      showUserErrorAlert(error, {
        title: t('auth.profile.saveErrorTitle'),
        fallback: t('auth.profile.saveErrorBody'),
        dismissText: t('auth.common.ok'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAction = (key, label) => {
    if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.HOME);
    else if (key === 'notifications') navigation.navigate(AUTHENTICATED_ROUTES.NOTIFICATIONS);
    else if (key === 'settings') Alert.alert(t('auth.common.comingSoon'), t('auth.common.willBeAvailable', { label }), [{ text: t('common.ok') }]);
  };

  const handleNavbar = (key, item) => {
    if (key === 'profile') return;
    if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES);
    else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER);
    else Alert.alert(t('auth.common.comingSoon'), t('auth.common.willBeAvailable', { label: item.label }), [{ text: t('common.ok') }]);
  };

  const profileSection = (
    <ProfileSection>
          <ScreenSectionHeading color={account?.avatarColor} title={t('auth.profile.title')} />

          <KeyboardArea>
          <FormScroll>
          <Form>
          <FormField
            accessibilityLabel={t('auth.common.name')}
            autoComplete="name"
            error={errors.name}
            onChangeText={(value) => { updateField('name', value); setName(value); }}
            placeholder={t('auth.common.name')}
            returnKeyType="next"
            value={name}
            Icon={UserIcon}
          />
          <FormField
            accessibilityLabel={t('auth.login.email')}
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            keyboardType="email-address"
            onChangeText={(value) => { updateField('email', value); setEmail(value); }}
            placeholder={t('auth.login.email')}
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
              <FieldLabel>{t('auth.common.avatarColor')}</FieldLabel>
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
                          accessibilityLabel={t('auth.common.selectColor', { color })}
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
            accessibilityLabel={t('auth.profile.newPasswordLabel')}
            accessibilityHint={t('auth.profile.newPasswordHint')}
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.password}
            onChangeText={(value) => { updateField('password', value); setPassword(value); }}
            placeholder={t('auth.profile.newPassword')}
            returnKeyType="done"
            secureTextEntry={!isPasswordVisible}
            value={password}
            Icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
            iconAccessibilityLabel={isPasswordVisible ? t('auth.profile.hidePassword') : t('auth.profile.showPassword')}
            onIconPress={() => setIsPasswordVisible((visible) => !visible)}
          />
          <FormField
            accessibilityLabel={t('auth.profile.newPasswordConfirm')}
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.passwordConfirmation}
            onChangeText={(value) => { updateField('passwordConfirmation', value); setPasswordConfirmation(value); }}
            placeholder={t('auth.profile.newPasswordConfirm')}
            returnKeyType="done"
            secureTextEntry={!isPasswordConfirmationVisible}
            value={passwordConfirmation}
            Icon={isPasswordConfirmationVisible ? EyeIcon : EyeClosedIcon}
            iconAccessibilityLabel={isPasswordConfirmationVisible ? t('auth.profile.hideConfirmation') : t('auth.profile.showConfirmation')}
            onIconPress={() => setIsPasswordConfirmationVisible((visible) => !visible)}
          />

          <FormActions
            cancelText={t('auth.profile.cancel')}
            isSaving={isSaving}
            onCancel={resetForm}
            onSave={handleSave}
            saveText={t('auth.profile.save')}
            savingText={t('auth.profile.saving')}
          />
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
          <Greeting numberOfLines={1}>{t('auth.profile.greeting', { name: account?.name ?? 'pessoa viva' })}</Greeting>
          <Subtitle>{t('auth.profile.subtitle')}</Subtitle>
        </GreetingGroup>

        <QuickSection>
          <Question>{t('auth.profile.question')}</Question>
          <QuickActions>
            {QUICK_ACTIONS.map(({ icon, key, labelKey, textKey }) => (
              <QuickActionButton
                key={key}
                Icon={icon}
                accessibilityLabel={t(labelKey)}
                onPress={() => handleQuickAction(key, t(labelKey))}
                selected={key === 'profile'}
                showBadge={key === 'notifications' && hasUnreadNotifications}
                text={t(textKey)}
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

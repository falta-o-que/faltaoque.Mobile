import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing } from 'react-native';

import { AngleIcon, EmailIcon, EyeClosedIcon, EyeIcon, UserIcon } from '../../assets/icons/export';
import AnimatedDropdown from '../../components/AnimatedDropdown';
import FormField from '../../components/FormField';
import FormActions from '../../components/FormActions';
import ScreenSectionHeading from '../../components/ScreenSectionHeading';
import { COLOR_OPTION_ROWS } from '../../constants/colorOptions';
import { hasValidationErrors, validateProfile } from '../../domain/authValidation';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { showUserErrorAlert } from '../../utils/userErrors';
import {
  ColorField,
  ColorFieldHeader,
  ColorGrid,
  ColorOption,
  ColorPanel,
  ColorRow,
  FieldLabel,
  Form,
  FormScroll,
  InlineError,
  KeyboardArea,
  ProfileSection,
  Chevron,
} from './styles';

export default function ProfileScreen() {
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
  const colorChevronProgress = useRef(new Animated.Value(0)).current;

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
        t,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileSection>
          <KeyboardArea>
          <FormScroll>
          <ScreenSectionHeading color={account?.avatarColor} showMarker={false} title={t('auth.profile.title')} />
          <Form>
          <FormField
            accessibilityLabel={t('auth.common.name')}
            autoComplete="name"
            error={errors.name}
            onChangeText={(value) => { updateField('name', value); setName(value); }}
            placeholder={`${t('auth.common.name')} *`}
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
            placeholder={`${t('auth.login.email')} *`}
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
              <FieldLabel>{t('auth.common.avatarColor')} *</FieldLabel>
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

}

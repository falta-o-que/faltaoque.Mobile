import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Modal, Platform, ScrollView, Switch } from 'react-native';
import * as Notifications from 'expo-notifications';

import FormActions from '../../components/FormActions';
import DangerActionButton from '../../components/DangerActionButton';
import ModalActionButton from '../../components/ModalActionButton';
import ScreenSectionHeading from '../../components/ScreenSectionHeading';
import { CancelCircleIcon } from '../../assets/icons/export';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { syncDeviceNotifications } from '../../services/notificationService';
import { translate } from '../../localization';
import { Screen, SettingsSection, Content, Section, SectionTitle, Description, LanguageRow, LanguageOption, LanguageLabel, FontControls, FontButton, FontValue, PreferenceRow, LinkRow, LinkLabel, LinkArrow, AboutRow, AboutLabel, AboutValue, TeamList, TeamMember, ModalBackdrop, ModalCard, ModalHeader, ModalTitle, ModalBody } from './styles';

const LANGUAGES = [
  { key: 'pt-BR', labelKey: 'settings.language.pt-BR' },
  { key: 'en', labelKey: 'settings.language.en' },
  { key: 'es', labelKey: 'settings.language.es' },
];

const TEAM = [
  'Manuela Vitória Barbosa de Andrade',
  'Miguel Zacharias da Silva',
  'Nikollas Oliveira Andrade dos Santos',
  'Sarah Santos de Jesus',
  'Thiago Soares Coelho da Costa',
];

const LEGAL_LINKS = {
  guide: 'settings.help',
  privacy: 'settings.privacy',
  terms: 'settings.terms',
};

const PROJECT_URL = 'https://github.com/falta-o-que';

export default function SettingsScreen({ embedded = false }) {
  const { account, logout } = useAuth();
  const { language, fontScale, isPreferencesLoading, savePreferences, t } = useAppPreferences();
  const [draft, setDraft] = useState({ language, fontScale });
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [isPermissionLoading, setIsPermissionLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => setDraft({ language, fontScale }), [language, fontScale]);

  const refreshNotificationPermission = useCallback(async () => {
    try {
      const permission = await Notifications.getPermissionsAsync();
      setNotificationPermission(Boolean(permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL));
    } catch {
      setNotificationPermission(false);
    } finally {
      setIsPermissionLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotificationPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshNotificationPermission();
    });
    return () => subscription.remove();
  }, [refreshNotificationPermission]);

  const hasChanges = draft.language !== language || draft.fontScale !== fontScale;

  const handleCancel = () => setDraft({ language, fontScale });

  const syncNotifications = async (savedLanguage) => {
    const savedT = (key) => translate(savedLanguage, key);
    try {
      await syncDeviceNotifications(account?.id);
    } catch {
      Alert.alert(savedT('settings.notificationSyncErrorTitle'), savedT('settings.notificationSyncErrorMessage'), [
        { text: savedT('common.ok'), style: 'cancel' },
        { text: savedT('common.retry'), onPress: async () => {
          if (savingRef.current) return;
          savingRef.current = true;
          setIsSaving(true);
          try {
            await syncNotifications(savedLanguage);
          } finally {
            savingRef.current = false;
            setIsSaving(false);
          }
        } },
      ]);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || savingRef.current || isPreferencesLoading) return;
    savingRef.current = true;
    try {
      setIsSaving(true);
      const saved = await savePreferences(draft);
      await syncNotifications(saved.language);
    } catch {
      Alert.alert(t('settings.saveErrorTitle'), t('settings.saveErrorMessage'), [{ text: t('common.ok') }]);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleNotificationPress = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(t('settings.openErrorTitle'), t('settings.openSystemSettingsError'), [{ text: t('common.ok') }]);
    }
  };

  const handleProjectPress = async () => {
    try {
      await Linking.openURL(PROJECT_URL);
    } catch {
      Alert.alert(t('settings.openErrorTitle'), t('settings.openProjectError'), [{ text: t('common.ok') }]);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert(t('settings.logoutErrorTitle'), t('settings.logoutErrorMessage'), [{ text: t('common.ok') }]);
          }
        },
      },
    ]);
  };

  const title = activeModal ? t(LEGAL_LINKS[activeModal]) : '';

  return (
    <Screen edges={embedded ? [] : ['top', 'left', 'right']}>
      <SettingsSection>
        <ScreenSectionHeading color={account?.avatarColor} title={t('settings.title')} />
        <Content $embedded={embedded}>
          <Section>
            <SectionTitle>{t('settings.language')}</SectionTitle>
            <LanguageRow>
              {LANGUAGES.map(({ key, labelKey }) => (
                <LanguageOption
                  key={key}
                  accessibilityRole="radio"
                  disabled={isSaving || isPreferencesLoading}
                  accessibilityState={{ checked: draft.language === key, disabled: isSaving || isPreferencesLoading }}
                  onPress={() => setDraft((current) => ({ ...current, language: key }))}
                  $selected={draft.language === key}
                >
                  <LanguageLabel $selected={draft.language === key}>{t(labelKey)}</LanguageLabel>
                </LanguageOption>
              ))}
            </LanguageRow>
          </Section>

          <Section>
            <SectionTitle>{t('settings.fontSize')}</SectionTitle>
            <FontControls>
              <FontButton accessibilityLabel={t('settings.fontSize.decrease')} accessibilityRole="button" disabled={isSaving || isPreferencesLoading || draft.fontScale <= 0.9} onPress={() => setDraft((current) => ({ ...current, fontScale: Math.max(0.9, Number((current.fontScale - 0.1).toFixed(1))) }))}>
                <FontValue>−</FontValue>
              </FontButton>
              <Description>{draft.fontScale === 1 ? t('settings.fontSize.default') : `${Math.round(draft.fontScale * 100)}%`}</Description>
              <FontButton accessibilityLabel={t('settings.fontSize.increase')} accessibilityRole="button" disabled={isSaving || isPreferencesLoading || draft.fontScale >= 1.1} onPress={() => setDraft((current) => ({ ...current, fontScale: Math.min(1.1, Number((current.fontScale + 0.1).toFixed(1))) }))}>
                <FontValue>+</FontValue>
              </FontButton>
            </FontControls>
          </Section>

          <Section>
            <PreferenceRow>
              <SectionTitle>{t('settings.notifications')}</SectionTitle>
              <Switch
                accessibilityLabel={t('settings.notifications')}
                value={notificationPermission}
                disabled={isPermissionLoading}
                onValueChange={handleNotificationPress}
                trackColor={{ false: '#D5D5D5', true: '#8AFF8A' }}
                thumbColor={notificationPermission ? '#00A900' : undefined}
              />
            </PreferenceRow>
            <Description>{t('settings.notifications.description')}</Description>
            {Platform.OS === 'android' && !notificationPermission && !isPermissionLoading ? <Description>{t('settings.systemNotificationsDenied')}</Description> : null}
          </Section>

          <Section>
            <SectionTitle>{t('settings.about')}</SectionTitle>
            <AboutRow><AboutLabel>{t('settings.version')}</AboutLabel><AboutValue>{t('settings.betaVersion', { version: '0.9' })}</AboutValue></AboutRow>
            <AboutRow><AboutLabel>{t('settings.project')}</AboutLabel><AboutValue>{t('settings.projectName')}</AboutValue></AboutRow>
            <LinkRow accessibilityRole="link" onPress={handleProjectPress}>
              <LinkLabel>github.com/falta-o-que</LinkLabel>
              <LinkArrow>›</LinkArrow>
            </LinkRow>
            <AboutLabel>{t('settings.team')}</AboutLabel>
            <TeamList>{TEAM.map((name) => <TeamMember key={name}>{name}</TeamMember>)}</TeamList>
          </Section>

          <Section>
            {[['guide', 'settings.help'], ['privacy', 'settings.privacy'], ['terms', 'settings.terms']].map(([key, labelKey]) => (
              <LinkRow key={key} accessibilityRole="button" onPress={() => setActiveModal(key)}>
                <LinkLabel>{t(labelKey)}</LinkLabel>
                <LinkArrow>›</LinkArrow>
              </LinkRow>
            ))}
          </Section>

          <FormActions
            cancelDisabled={!hasChanges || isSaving}
            cancelText={t('common.cancel')}
            isSaving={isSaving}
            onCancel={handleCancel}
            onSave={handleSave}
            saveDisabled={!hasChanges || isPreferencesLoading}
            saveText={t('common.save')}
            savingText={t('settings.saving')}
          />
          <DangerActionButton
            accessibilityLabel={t('settings.logout')}
            disabled={isSaving}
            onPress={handleLogout}
            text={t('settings.logout')}
          />
        </Content>
      </SettingsSection>

      <Modal animationType="fade" transparent visible={Boolean(activeModal)} onRequestClose={() => setActiveModal(null)}>
        <ModalBackdrop>
          <ModalCard accessibilityViewIsModal>
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
              <ModalActionButton
                accessibilityLabel={t('common.close')}
                Icon={CancelCircleIcon}
                onPress={() => setActiveModal(null)}
                variant="cancel"
              />
            </ModalHeader>
            <ScrollView>
              <ModalBody>{t(`settings.content.${activeModal}`)}</ModalBody>
            </ScrollView>
          </ModalCard>
        </ModalBackdrop>
      </Modal>
    </Screen>
  );
}

import ButtonClick from '../../components/ButtonClick';
import {useAppPreferences} from '../AppPreferencesContext';
import {getSessionRestoreMessages} from './messages';
import {Action, Content, Description, Screen, Title} from './styles';

export default function SessionRestoreError({onRetry}) {
    const {language, t} = useAppPreferences();
    const messages = getSessionRestoreMessages(language);

    return (<Screen>
        <Content accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Title>{messages.title}</Title>
            <Description>{messages.description}</Description>
            <Action>
                <ButtonClick accessibilityLabel={t('common.retry')} onPress={onRetry}>
                    {t('common.retry')}
                </ButtonClick>
            </Action>
        </Content>
    </Screen>);
}

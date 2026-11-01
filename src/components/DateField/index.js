import { useState } from 'react';
import { Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarIcon } from '../../assets/icons/export';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { normalizeDateOnly } from '../../domain/dateValidation';
import FormField from '../FormField';
import { Overlay, Card, Actions, Action, ActionText } from './styles';

const localDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const format = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

export default function DateField({ value, onChangeText, limit, editable = true, ...props }) {
  const { t, language } = useAppPreferences();
  const [draft, setDraft] = useState(null);
  const today = localDate(new Date());
  const minimumDate = limit === 'future' ? today : undefined;
  const maximumDate = limit === 'past' ? today : undefined;

  function openCalendar() {
    const normalized = normalizeDateOnly(value);
    const [year, month, day] = normalized ? normalized.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    let selected = new Date(year, month - 1, day);
    if ((minimumDate && selected < minimumDate) || (maximumDate && selected > maximumDate)) selected = today;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: selected, mode: 'date', minimumDate, maximumDate,
        onValueChange: (_, date) => { if (date) onChangeText(format(date)); } });
    } else setDraft(selected);
  }

  return <>
    <FormField {...props} value={value} editable={editable} onChangeText={onChangeText} Icon={CalendarIcon}
      iconAccessibilityLabel={t('date.openCalendar')} onIconPress={editable ? openCalendar : undefined} />
    {Platform.OS === 'ios' && draft ? <Modal transparent animationType="fade" visible onRequestClose={() => setDraft(null)}>
      <Overlay><Card accessibilityViewIsModal>
        <DateTimePicker value={draft} mode="date" display="inline" locale={language === 'pt-BR' ? 'pt-BR' : language} minimumDate={minimumDate} maximumDate={maximumDate}
          onValueChange={(_, date) => { if (date) setDraft(date); }} />
        <Actions><Action accessibilityRole="button" onPress={() => setDraft(null)}><ActionText>{t('common.cancel')}</ActionText></Action>
          <Action accessibilityRole="button" onPress={() => { onChangeText(format(draft)); setDraft(null); }}><ActionText>{t('common.confirm')}</ActionText></Action></Actions>
      </Card></Overlay>
    </Modal> : null}
  </>;
}

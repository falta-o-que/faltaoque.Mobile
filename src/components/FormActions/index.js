import { CancelButton, CancelLabel, Container, SaveButton, SaveLabel } from './styles';

export default function FormActions({
  onSave,
  onCancel,
  saveText,
  cancelText,
  savingText,
  isSaving = false,
  saveDisabled = false,
  cancelDisabled = false,
}) {
  return (
    <Container>
      <SaveButton accessibilityRole="button" disabled={saveDisabled || isSaving} onPress={onSave}>
        <SaveLabel>{isSaving ? savingText : saveText}</SaveLabel>
      </SaveButton>
      <CancelButton accessibilityRole="button" disabled={cancelDisabled || isSaving} onPress={onCancel}>
        <CancelLabel>{cancelText}</CancelLabel>
      </CancelButton>
    </Container>
  );
}

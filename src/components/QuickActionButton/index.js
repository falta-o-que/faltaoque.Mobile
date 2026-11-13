import { useState } from 'react';
import { ActionButton, IconArea, MeasurementText, NotificationBadge, TextButton } from './styles';

export function QuickActionButton({
  Icon,
  accessibilityLabel,
  onPress,
  selected = false,
  showBadge = false,
  text,
}) {
  const [overflows, setOverflows] = useState(false);
  return (
    <ActionButton
      $selected={selected}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
    >
      <IconArea>
        <Icon color="#FFFFFF" size={24} />
        {showBadge ? <NotificationBadge /> : null}
      </IconArea>
      {text === 'Despensa' && <MeasurementText accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onTextLayout={({nativeEvent}) => setOverflows(nativeEvent.lines.length > 1)}>{text}</MeasurementText>}
      <TextButton numberOfLines={1} ellipsizeMode="tail">{text === 'Despensa' && overflows ? 'Desp.' : text}</TextButton>
    </ActionButton>
  );
}

export default QuickActionButton;

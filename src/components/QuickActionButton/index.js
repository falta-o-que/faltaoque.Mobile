import {useState} from 'react';
import {
    ActionButton, ActionWrapper, ActiveIndicator, IconArea, MeasurementText, NotificationBadge, TextButton
} from './styles';

export function QuickActionButton({
                                      Icon, accessibilityLabel, onPress, selected = false, showBadge = false, text,
                                  }) {
    const [overflows, setOverflows] = useState(false);
    return (<ActionWrapper>
        <ActionButton
            $selected={selected}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{selected}}
            onPress={onPress}
        >
            <IconArea>
                <Icon color="#FFFFFF" size={26}/>
                {showBadge ? <NotificationBadge/> : null}
            </IconArea>
            {text === 'Despensa' &&
                <MeasurementText accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                                 onTextLayout={({nativeEvent}) => setOverflows(nativeEvent.lines.length > 1)}>{text}</MeasurementText>}
            <TextButton numberOfLines={1}
                        ellipsizeMode="tail">{text === 'Despensa' && overflows ? 'Desp.' : text}</TextButton>
        </ActionButton>
        {selected && <ActiveIndicator/>}
    </ActionWrapper>);
}

export default QuickActionButton;

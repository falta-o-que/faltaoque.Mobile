import styled from 'styled-components/native';

export const ActionWrapper = styled.View`
    width: 64px;
    height: 72px;
    align-items: center;
`;

export const ActionButton = styled.TouchableOpacity.attrs({
    activeOpacity: 0.72, hitSlop: {top: 6, right: 6, bottom: 6, left: 6},
})`
    width: 64px;
    height: 64px;
    gap: 4px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    border-radius: 21px;
    background-color: ${({theme}) => theme.colors.primary.Green};
`;

export const ActiveIndicator = styled.View`
    position: absolute;
    bottom: 0;
    width: 44px;
    height: 4px;
    border-radius: 2px;
    background-color: ${({theme}) => theme.colors.primary.Green};
`;

export const TextButton = styled.Text`
    width: 100%;
    text-align: center;
    color: ${({theme}) => theme.colors.white[100]};
    font-family: ${({theme}) => theme.fonts.families.inter.medium};
    font-size: ${({theme}) => 10.7 * theme.fonts.scale}px;
    font-style: normal;
    font-weight: 500;
    line-height: ${({theme}) => 12.8 * theme.fonts.scale}px;
    letter-spacing: 0.2px;
`;

export const MeasurementText = styled(TextButton)`
    position: absolute;
    opacity: 0;
`;

export const IconArea = styled.View`
    width: 26px;
    height: 26px;
    align-items: center;
    justify-content: center;
`;

export const NotificationBadge = styled.View`
    position: absolute;
    top: -3px;
    right: -4px;
    width: 9px;
    height: 9px;
    border: 1px solid ${({theme}) => theme.colors.white[100]};
    border-radius: 5px;
    background-color: ${({theme}) => theme.colors.danger[500]};
`;

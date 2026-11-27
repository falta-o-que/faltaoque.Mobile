import styled from 'styled-components/native';
import {SafeAreaView} from 'react-native-safe-area-context';

export const Screen = styled(SafeAreaView)`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background-color: ${({theme}) => theme.colors.white[100]};
`;

export const Content = styled.View`
    width: 100%;
    max-width: 420px;
    align-items: center;
`;

export const Title = styled.Text`
    color: ${({theme}) => theme.colors.black.Black};
    font-family: ${({theme}) => theme.fonts.families.poppins.bold};
    font-size: ${({theme}) => theme.fonts.sizes[5]}px;
    text-align: center;
`;

export const Description = styled.Text`
    margin-top: 12px;
    color: ${({theme}) => theme.colors.black[500]};
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => theme.fonts.sizes[2]}px;
    line-height: ${({theme}) => theme.fonts.sizes[2] * 1.5}px;
    text-align: center;
`;

export const Action = styled.View`
    width: 100%;
    margin-top: 28px;
`;

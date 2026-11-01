import styled from 'styled-components/native';

export const Overlay = styled.View`flex: 1; justify-content: center; padding: 20px; background-color: rgba(0, 0, 0, 0.4);`;
export const Card = styled.View`background-color: ${({ theme }) => theme.colors.white[100]}; border-radius: 16px; padding: 16px;`;
export const Actions = styled.View`flex-direction: row; justify-content: flex-end; gap: 16px;`;
export const Action = styled.TouchableOpacity`min-height: 44px; justify-content: center; padding: 8px;`;
export const ActionText = styled.Text`color: ${({ theme }) => theme.colors.primary.Green}; font-family: ${({ theme }) => theme.fonts.families.inter.medium}; font-size: ${({ theme }) => 14 * theme.fonts.scale}px;`;

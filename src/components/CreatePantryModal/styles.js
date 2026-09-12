import styled from 'styled-components/native';
import { Animated } from 'react-native';

export const Overlay = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.35);
`;

export const Card = styled.View`
  width: 100%;
  max-width: 350px;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const Heading = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
`;

export const ColorField = styled.View`
  gap: 12px;
`;

export const ColorHeader = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 56px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid ${({ $hasError, theme }) =>
    $hasError ? theme.colors.danger[600] : theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const FieldLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const InlineError = styled.Text`
  margin-top: -6px;
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 11px;
`;

export const ColorPanel = styled(Animated.View)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const ColorChevron = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const ColorGrid = styled.View`
  gap: 10px;
`;

export const ColorRow = styled.View`
  height: 32px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ColorOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 32px;
  height: 32px;
  border-width: ${({ $selected }) => ($selected ? 3 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  border-radius: 16px;
  background-color: ${({ $color }) => $color};
`;

export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 12px;
`;

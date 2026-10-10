import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Overlay = styled(SafeAreaView).attrs({
  edges: ['top', 'right', 'bottom', 'left'],
})`
  flex: 1;
`;

export const KeyboardArea = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : undefined,
})`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.4);
`;

export const Card = styled.View`
  width: 100%;
  max-width: 350px;
  max-height: 90%;
  overflow: hidden;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 5;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
`;

export const Scroll = styled.ScrollView.attrs({
  keyboardShouldPersistTaps: 'handled',
  showsVerticalScrollIndicator: false,
})`
  flex-shrink: 1;
`;

export const Content = styled.View`
  gap: 16px;
  padding: 22px;
`;

export const Header = styled.View`
  min-height: 40px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const Heading = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['2']}px;
  text-align: center;
`;

export const CloseButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  position: absolute;
  right: 0;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.danger[500]};
`;

export const ProductName = styled.Text.attrs({ numberOfLines: 2 })`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 22px;
  line-height: 29px;
  text-align: center;
`;

export const Summary = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  line-height: 21px;
  text-align: center;
`;

export const Details = styled.View`
  gap: 12px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const DetailRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
`;

export const DetailLabel = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

export const DetailValue = styled.Text`
  flex: 1.5;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
  text-align: right;
`;

export const ListPrompt = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
`;

export const ListOptions = styled.View`
  gap: 8px;
`;

export const ListOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  min-height: 52px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.black[200]};
  border-radius: 10px;
  background-color: ${({ $selected, theme }) => $selected ? theme.colors.white[200] : theme.colors.white[100]};
`;

export const RadioOuter = styled.View`
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.black[300]};
  border-radius: 9px;
`;

export const RadioInner = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.primary.Green};
`;

export const ListOptionText = styled.Text.attrs({ numberOfLines: 2 })`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
`;

export const EmptyLists = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
  line-height: 19px;
  text-align: center;
`;

export const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
  text-align: center;
`;

export const Actions = styled.View`
  gap: 10px;
`;

export const ActionButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 14px;
  background-color: ${({ $secondary, theme }) => $secondary ? theme.colors.white[200] : theme.colors.primary.Green};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;

export const ActionText = styled.Text`
  color: ${({ $secondary, theme }) => $secondary ? theme.colors.black.Black : theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
  text-align: center;
`;

export const BusyArea = styled.View`
  min-height: 24px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const BusyText = styled.Text`
  color: ${({ $inverse, theme }) => $inverse ? theme.colors.white[100] : theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

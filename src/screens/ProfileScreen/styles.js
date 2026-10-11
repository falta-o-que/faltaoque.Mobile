import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const GradientBackground = styled(LinearGradient)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

export const KeyboardArea = styled.KeyboardAvoidingView.attrs({
  behavior: 'padding',
})`
  flex: 1;
`;

export const Content = styled.View`
  flex: 1;
  align-items: center;
  padding: 42px 20px 0;
`;

export const GreetingGroup = styled.View`
  align-items: center;
`;

export const Avatar = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: ${({ $color }) => $color ?? '#1E2B5E'};
`;

export const Greeting = styled.Text`
  margin-top: 10px;
  max-width: 100%;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => 24 * theme.fonts.scale}px;
`;

export const Subtitle = styled.Text`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

export const QuickSection = styled.View`
  width: 100%;
  margin-top: 30px;
`;

export const Question = styled.Text`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => 16 * theme.fonts.scale}px;
  text-align: center;
`;

export const QuickActions = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

export const Form = styled.View`
  width: 100%;
  gap: 10px;
`;

export const ProfileSection = styled.View`
  width: 100%;
  flex: 1;
  margin-top: 30px;
`;

export const FormScroll = styled.ScrollView.attrs({
  contentContainerStyle: {
    gap: 10,
    paddingTop: 20,
    paddingBottom: 24,
  },
  keyboardShouldPersistTaps: 'handled',
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  width: 100%;
`;

export const ColorField = styled.View`
  width: 100%;
  gap: 10px;
`;

export const ColorFieldHeader = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  width: 100%;
  height: 56px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const FieldLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

export const Chevron = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const ColorPanel = styled.View`
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const ColorGrid = styled.View`
  width: 100%;
  gap: 10px;
`;

export const ColorRow = styled.View`
  width: 100%;
  height: 32px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ColorOption = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-width: ${({ $selected }) => ($selected ? 3 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  border-radius: 16px;
  background-color: ${({ $color }) => $color};
`;

export const InlineError = styled.Text`
  margin-top: 6px;
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

export const SaveButton = styled.TouchableOpacity.attrs(({ disabled }) => ({
  activeOpacity: 0.72,
  disabled,
}))`
  width: 100%;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 20px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;

export const SaveLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

export const CancelButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 100%;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 20px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ theme }) => theme.colors.danger[500]};
`;

export const CancelLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

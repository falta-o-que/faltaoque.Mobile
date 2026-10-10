import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const GradientBackground = styled(LinearGradient).attrs({
  colors: ['#ffffff', '#f9f9f9'],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  pointerEvents: 'none',
})`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
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
  background-color: ${({ $color }) => $color ?? '#202e67'};
`;

export const Greeting = styled.Text`
  margin-top: 10px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => theme.fonts.sizes['4']}px;
`;

export const Subtitle = styled.Text`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const QuickSection = styled.View`
  width: 100%;
  margin-top: 30px;
`;

export const Question = styled.Text`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 16px;
  text-align: center;
`;

export const QuickActions = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

export const NotificationSection = styled.View`
  width: 100%;
  flex: 1;
  margin-top: 30px;
`;

export const NotificationHeading = styled.View`
  align-items: center;
  gap: 10px;
`;

export const ClearAction = styled.View`
  width: 100%;
  align-items: flex-end;
  margin-top: 8px;
`;

export const ClearButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 36px;
  justify-content: center;
  padding: 0 12px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.white[200]};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;

export const ClearText = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 12px;
`;

export const PermissionHint = styled.Text`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
  text-align: center;
`;

export const HeadingMarker = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ $color }) => $color ?? '#202e67'};
`;

export const SectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 20px;
`;

export const NotificationList = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 10, paddingTop: 20, paddingBottom: 16 },
  keyboardShouldPersistTaps: 'handled',
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  width: 100%;
`;

export const NotificationRow = styled.TouchableOpacity.attrs({ activeOpacity: 0.76 })`
  width: 100%;
  height: 41px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  padding: 0 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.primary.Green};
`;

export const NotificationDot = styled.View`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const NotificationText = styled.Text.attrs({ numberOfLines: 1, ellipsizeMode: 'tail' })`
  flex: 1;
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
`;

export const StatusArea = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const StatusText = styled.Text`
  color: ${({ theme, $error }) => $error ? theme.colors.danger[600] : theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  text-align: center;
`;

export const RetryButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;

export const RetryText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
`;

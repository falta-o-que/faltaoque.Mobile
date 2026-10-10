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
  padding: 30px 20px 0;
`;

export const Header = styled.View`
  width: 100%;
`;

export const TitleRow = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

export const Avatar = styled.View`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 20px;
  background-color: ${({ $color }) => $color ?? '#202e67'};
`;

export const PantryTitle = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 24px;
`;

export const SearchArea = styled.View`
  width: 100%;
  margin-top: 30px;
`;

export const PantrySection = styled.View`
  width: 100%;
  flex: 1;
  position: relative;
  margin-top: 40px;
`;

export const PantryList = styled.ScrollView.attrs({
  contentContainerStyle: {
    gap: 20,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 24,
    paddingLeft: 8,
  },
  keyboardShouldPersistTaps: 'handled',
  removeClippedSubviews: false,
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  align-self: stretch;
  margin: 0 -8px;
  overflow: hidden;
`;

export const EmptyText = styled.Text`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 16px;
  text-align: center;
`;

export const LoadError = styled.Text`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const RetryButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  align-self: center;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;

export const RetryText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
`;

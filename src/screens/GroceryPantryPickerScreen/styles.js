import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f9f9f9;
`;
export const Content = styled.View`
  flex: 1;
  padding: 28px 20px 0;
  gap: 16px;
`;
export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 24px;
`;
export const Subtitle = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  text-align: center;
`;
export const List = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 12, padding: 4, paddingBottom: 24 },
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
`;
export const Card = styled.TouchableOpacity.attrs({ activeOpacity: 0.75 })`
  min-height: 64px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.white[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 2;
`;
export const ColorCircle = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ $color }) => $color || '#1e2b5e'};
`;
export const PantryName = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 16px;
`;
export const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  text-align: center;
`;
export const StatusText = styled(EmptyText)`
  color: ${({ theme }) => theme.colors.danger[600]};
`;
export const RetryButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  align-self: center;
  padding: 10px 14px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;
export const RetryText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
`;

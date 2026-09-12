import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;
export const Content = styled.View`
  flex: 1;
  padding: 20px 20px 0;
`;
export const Header = styled.View`
  gap: 16px;
`;
export const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
export const ColorCircle = styled.View`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 20px;
  background-color: ${({ $color }) => $color};
`;
export const Title = styled.Text.attrs({ numberOfLines: 1, ellipsizeMode: 'tail' })`
  flex-shrink: 1;
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 24px;
  color: ${({ theme }) => theme.colors.black.Black};
`;
export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 14px;
  margin-top: 14px;
`;
export const Categories = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 10, alignItems: 'center' },
})`
  flex-grow: 0;
`;
export const CategorySection = styled.View`
  width: 100%;
  margin-bottom: 10px;
  padding: 6px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.white[400]};
`;
export const EmptyText = styled.Text`
  max-width: 260px;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.black.Black};
  text-align: center;
`;
export const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-bottom: 120px;
`;
export const StatusArea = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;
export const ErrorText = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  color: ${({ theme }) => theme.colors.danger[600]};
  text-align: center;
`;
export const Retry = styled.TouchableOpacity`
  padding: 12px;
`;
export const RetryText = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  color: ${({ theme }) => theme.colors.primary[700]};
`;

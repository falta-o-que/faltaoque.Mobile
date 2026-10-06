import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f9f9f9;
`;

export const Content = styled.View`
  flex: 1;
  padding-top: 28px;
`;

export const Header = styled.View`
  padding: 0 20px;
  gap: 30px;
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
  border-radius: 20px;
  background-color: ${({ $color }) => $color || '#1e2b5e'};
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 24px;
`;

export const TitleBlock = styled.View`
  justify-content: center;
`;

export const PantryIndicator = styled.Text`
  max-width: 245px;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

export const CategoryScroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: 10, paddingRight: 20 },
})`
  flex-grow: 0;
  margin-right: -20px;
`;

export const HeaderActions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 14px;
`;

export const RoundButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.75 })`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: #95e880;
  opacity: ${({ $disabled }) => $disabled ? 0.5 : 1};
`;

export const ListScroll = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,
  removeClippedSubviews: false,
  contentContainerStyle: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 28, gap: 20 },
})`
  flex: 1;
`;

export const ListSection = styled.View`
  gap: 16px;
`;

export const ListHeading = styled.View`
  min-height: 31px;
  margin-horizontal: 15px;
  padding-bottom: 6px;
  border-bottom-width: 1px;
  border-bottom-color: #c1c1c1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const ListName = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 16px;
`;

export const ListActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 20px;
`;

export const IconButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const Chevron = styled(Animated.View)``;

export const ItemStack = styled.View`
  gap: 9px;
`;

export const SelectionBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-horizontal: 15px;
`;
export const SelectionButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  min-height: 34px;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 10px;
  background-color: ${({ $confirm, theme }) => $confirm ? theme.colors.danger[600] : theme.colors.white[200]};
`;
export const SelectionButtonText = styled.Text`
  color: ${({ $confirm, theme }) => $confirm ? theme.colors.white[100] : theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 12px;
`;
export const SelectionHint = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

export const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`;

export const StatusText = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  text-align: center;
  margin-top: 20px;
`;

export const RetryButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  align-self: center;
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;

export const RetryText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
`;

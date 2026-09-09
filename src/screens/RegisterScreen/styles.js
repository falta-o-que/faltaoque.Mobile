import styled from 'styled-components/native';
import { Animated } from 'react-native';

export const Form = styled.ScrollView.attrs({
  contentContainerStyle: { rowGap: 20 },
  nestedScrollEnabled: true,
  showsVerticalScrollIndicator: false,
})`
  width: 100%;
  height: ${({ $expanded }) => ($expanded ? 350 : 360)}px;
`;

export const ColorField = styled.View`
  gap: 10px;
`;

export const ColorFieldHeader = styled.TouchableOpacity.attrs({
  activeOpacity: 0.7,
})`
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

export const ColorPanel = styled(Animated.View)`
  width: 100%;
  min-height: 106px;
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

export const FieldLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
`;

export const InlineError = styled.Text`
  margin-top: 6px;
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 11px;
`;

export const ColorChevron = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const ColorOption = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 16px;
  border-width: ${({ $selected }) => ($selected ? 3 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  background-color: ${({ $color }) => $color};
`;

export const Terms = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 4px 0;
`;

export const Checkbox = styled.View`
  width: 23px;
  height: 23px;
  align-items: center;
  justify-content: center;
`;

export const EmptyCheckbox = styled.View`
  width: 21px;
  height: 21px;
  border: 2px solid ${({ theme }) => theme.colors.primary.Green};
  border-radius: 11px;
`;

export const TermsText = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black[200]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
  line-height: 18px;
`;

export const PrimaryButton = styled.Pressable.attrs(({ $active }) => ({
  style: {
    transform: [{ scale: $active ? 0.98 : 1 }],
  },
}))`
  height: 47px;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
  border-radius: 20px;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary[300] : theme.colors.primary[200]};
`;

export const PrimaryLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 16px;
`;

export const BackLink = styled.TouchableOpacity`
  align-self: center;
  padding: 14px;
`;

export const BackText = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
`;

export const Muted = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
`;

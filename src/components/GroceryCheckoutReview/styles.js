import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ModalRoot = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;
export const Header = styled.View`
  padding: 14px 20px 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.white[200]};
`;
export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
export const Title = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 22px;
`;
export const Content = styled.ScrollView.attrs({ keyboardShouldPersistTaps: 'handled' })`
  flex: 1;
`;
export const ContentInner = styled.View`
  padding: 16px 20px 28px;
  gap: 16px;
`;
export const Section = styled.View`
  gap: 8px;
`;
export const SectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 18px;
`;
export const StepHeader = styled.View`
  padding: 14px;
  gap: 8px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;
export const ProgressTrack = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;
export const ProgressChip = styled.View`
  min-height: 30px;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-width: 1px;
  border-color: ${({ $active, $complete, theme }) => ($active || $complete ? theme.colors.primary.Green : theme.colors.black[200])};
  border-radius: 16px;
  background-color: ${({ $active, $complete, theme }) => ($active ? theme.colors.primary.Green : $complete ? theme.colors.primary[200] : theme.colors.white[100])};
`;
export const ProgressChipText = styled.Text`
  color: ${({ $active, $complete, theme }) => ($active ? theme.colors.white[100] : $complete ? theme.colors.primary[700] : theme.colors.black[400])};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 11px;
`;
export const StepCounter = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 11px;
  letter-spacing: 0.8px;
`;
export const StepTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 18px;
`;
export const Label = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
`;
export const Muted = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
  line-height: 19px;
`;
export const DateSummary = styled.View`
  min-height: 64px;
  justify-content: center;
  padding: 10px 14px;
  gap: 2px;
  border: 1px solid ${({ theme }) => theme.colors.white[200]};
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;
export const DateValue = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 16px;
`;
export const PurchaseContext = styled.View`
  padding: 14px;
  gap: 10px;
  border: 1px solid ${({ theme }) => theme.colors.white[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;
export const ContextHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;
export const ContextEyebrow = styled.Text`
  color: ${({ theme }) => theme.colors.primary[700]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 11px;
  letter-spacing: 0.7px;
`;
export const ContextRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;
export const ContextLabel = styled.Text`
  flex: 0 0 78px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;
export const ContextValue = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
  text-align: right;
`;
export const LinkRoute = styled.View`
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.white[200]};
`;
export const LinkRouteLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 10px;
  letter-spacing: 0.6px;
`;
export const LinkRouteValue = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
`;
export const DecisionList = styled.View`
  gap: 8px;
`;
export const DecisionOption = styled.TouchableOpacity`
  min-height: 62px;
  justify-content: center;
  padding: 11px 13px;
  gap: 3px;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary.Green : theme.colors.black[200])};
  border-radius: 12px;
  background-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[200] : theme.colors.white[100])};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;
export const DecisionTitle = styled.Text`
  color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[700] : theme.colors.black.Black)};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
`;
export const DecisionHint = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
  line-height: 17px;
`;
export const SummaryBanner = styled.View`
  padding: 14px;
  gap: 5px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;
export const SummaryBannerTitle = styled.Text`
  color: ${({ theme }) => theme.colors.primary[700]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 15px;
`;
export const SummaryBannerText = styled.Text`
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
  line-height: 19px;
`;
export const ChoiceRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;
export const Choice = styled.TouchableOpacity`
  min-height: 44px;
  padding: 9px 12px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.black[200]};
  border-radius: 10px;
  background-color: ${({ $selected, theme }) => $selected ? theme.colors.primary[200] : theme.colors.white[100]};
`;
export const ChoiceText = styled.Text`
  color: ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
`;
export const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
`;
export const Footer = styled.View`
  padding: 12px 20px;
  gap: 10px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.black[200]};
  background-color: ${({ theme }) => theme.colors.white[100]};
`;
export const SummaryRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
export const SummaryValue = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 18px;
`;

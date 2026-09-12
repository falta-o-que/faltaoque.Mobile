import { Animated, KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components/native';

export const Overlay = styled(KeyboardAvoidingView)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.35);
`;

export const Card = styled.View`
  width: 100%;
  max-width: 350px;
  max-height: 92%;
  overflow: hidden;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;

export const Scroller = styled.ScrollView`
  flex-shrink: 1;
`;

export const Content = styled.View`
  gap: 20px;
  padding: 20px;
`;

export const TitleGroup = styled.View`
  align-items: center;
  gap: 6px;
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

export const ProductName = styled.Text.attrs({ numberOfLines: 2 })`
  width: 100%;
  text-align: center;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 24px;
  line-height: 31px;
`;

export const ReadonlyPanel = styled.View`
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.black[50] ?? theme.colors.white[100]};
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
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
  text-align: right;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
`;

export const DeleteButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 100%;
  height: 45px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.danger[600]};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export const DeleteLabel = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
`;

export const FormContent = styled.View`
  gap: 12px;
`;

export const Fields = styled.View`
  gap: 12px;
`;

export const WeightGroup = styled.View`
  gap: 8px;
`;

export const UnitOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

export const UnitOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-width: 43px;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border: 1px solid ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.black[200]};
  border-radius: 999px;
  background-color: ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : theme.colors.white[100]};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export const UnitLabel = styled.Text`
  color: ${({ $selected, theme }) => $selected ? theme.colors.black.Black : theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const PriceTypeOptions = styled(UnitOptions)``;

export const PriceTypeOption = styled(UnitOption)`
  min-width: 0;
`;

export const PriceTypeLabel = styled(UnitLabel)``;

export const Accordion = styled.View`
  gap: 8px;
`;

export const AccordionHeader = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 56px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid ${({ $hasError, theme }) => $hasError ? theme.colors.danger[600] : theme.colors.black[200]};
  border-radius: 12px;
`;

export const AccordionLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const Chevron = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const CategoryOptions = styled(Animated.View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
`;

export const InlineError = styled.Text`
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 11px;
`;

export const SubmitError = styled(InlineError)`
  margin-top: -8px;
  text-align: right;
`;

export const BusyStatus = styled.View`
  min-height: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

export const BusyIndicator = styled.ActivityIndicator.attrs(({ theme }) => ({ color: theme.colors.primary.Green, size: 'small' }))``;

export const BusyText = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 12px;
`;

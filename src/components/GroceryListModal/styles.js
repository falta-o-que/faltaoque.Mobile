import { Animated } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components/native';

export const KeyboardFrame = styled(KeyboardAvoidingView)`
  flex: 1;
`;

export const Overlay = styled.View`
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

export const Body = styled.ScrollView`
  flex-shrink: 1;
`;

export const Content = styled.View`
  gap: 20px;
  padding: 20px;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const Heading = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[2]}px;
  text-align: center;
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
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary.Green : theme.colors.black[200]};
  border-radius: 999px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary.Green : theme.colors.white[100]};
`;

export const UnitLabel = styled.Text`
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.black.Black : theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export const Accordion = styled.View`
  gap: 12px;
`;

export const AccordionHeader = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const AccordionLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export const Chevron = styled(Animated.View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

export const CategoryOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const FilterSection = styled.View`
  gap: 18px;
  padding: 0 10px;
`;

export const FilterSectionTitle = styled.View`
  width: 100%;
  padding: 6px 0;
  border-bottom-width: 0.5px;
  border-bottom-color: ${({ theme }) => theme.colors.black[400]};
`;

export const FilterSectionLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export const SortOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

export const SortOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-width: ${({ $selected }) => ($selected ? 2 : 0)}px;
  border-color: ${({ theme }) => theme.colors.black.Black};
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.tags.organicos};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export const SortOptionLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export const HelpText = styled.Text`
  margin-top: -8px;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 11px;
  line-height: 15px;
`;

export const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

export const CompactAction = styled.TouchableOpacity.attrs(({ disabled }) => ({
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
  background-color: ${({ $tone, theme }) =>
    $tone === 'danger' ? theme.colors.danger[600] : theme.colors.primary[200]};
`;

export const CompactActionLabel = styled.Text`
  color: ${({ $tone, theme }) =>
    $tone === 'danger' ? theme.colors.white[100] : theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 14px;
`;

export const CheckoutList = styled.View`
  gap: 14px;
`;

export const CheckoutItem = styled.View`
  gap: 6px;
`;

export const CheckoutItemName = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
`;

export const CheckoutItemMeta = styled.Text`
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
`;

export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 12px;
`;

import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Content = styled.ScrollView.attrs(({ $embedded }) => ({
  contentContainerStyle: {
    paddingHorizontal: $embedded ? 0 : 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled',
}))`
  flex: 1;
`;

export const SettingsSection = styled.View`
  width: 100%;
  flex: 1;
  margin-top: 30px;
`;

export const Section = styled.View`
  width: 100%;
  gap: 14px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const SectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => 16 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 22 * theme.fonts.scale}px;
`;

export const Description = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 20 * theme.fonts.scale}px;
`;

export const LanguageRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const LanguageOption = styled.TouchableOpacity.attrs({ activeOpacity: 0.75 })`
  flex: 1;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  border: 1px solid ${({ $selected, theme }) => ($selected ? theme.colors.primary.Green : theme.colors.white[300])};
  border-radius: 12px;
  background-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[200] : theme.colors.white[100])};
`;

export const LanguageLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme, $selected }) => theme.fonts.families.inter[$selected ? 'medium' : 'regular']};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 18 * theme.fonts.scale}px;
  text-align: center;
`;

export const FontControls = styled.View`
  min-height: 56px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 8px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const FontButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 21px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  background-color: ${({ theme }) => theme.colors.primary[200]};
`;

export const FontValue = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 22 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 26 * theme.fonts.scale}px;
`;

export const PreferenceRow = styled.View`
  min-height: 44px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const LinkRow = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  min-height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const LinkLabel = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 20 * theme.fonts.scale}px;
`;

export const LinkArrow = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 24 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 26 * theme.fonts.scale}px;
`;

export const AboutRow = styled.View`
  min-height: 28px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const AboutLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 20 * theme.fonts.scale}px;
`;

export const AboutValue = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 20 * theme.fonts.scale}px;
  text-align: right;
`;

export const TeamList = styled.View`
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const TeamMember = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 19 * theme.fonts.scale}px;
`;

export const ActionRow = styled.View`
  gap: 10px;
  margin-top: 4px;
`;

export const SaveButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
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

export const ModalBackdrop = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.4);
`;

export const ModalCard = styled.View`
  width: 100%;
  max-width: 420px;
  max-height: 80%;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
`;

export const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
`;

export const ModalTitle = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => 20 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 26 * theme.fonts.scale}px;
`;

export const ModalBody = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 22 * theme.fonts.scale}px;
`;

import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Content = styled.View`
  flex: 1;
  align-items: center;
  padding: 42px 20px 0;
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

export const Section = styled.View`
  width: 100%;
  margin-top: 30px;
`;

export const PantrySection = styled.View`
  width: 100%;
  flex: 1;
  position: relative;
  margin-top: 30px;
`;

export const CreateAction = styled.View`
  position: absolute;
  right: 0;
  bottom: 20px;
  align-items: flex-end;
  z-index: 1;
  elevation: 4;
`;

export const PantryList = styled.ScrollView.attrs({
  contentContainerStyle: {
    gap: 16,
    paddingTop: 16,
    paddingRight: 8,
    paddingBottom: 84,
    paddingLeft: 8,
  },
  removeClippedSubviews: false,
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  align-self: stretch;
  margin: 0 -8px;
  overflow: hidden;
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
    justify-content: space-between;
    align-items: center;
    padding-inline: 16px;
`;

export const PantryTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 20px;
`;

export const EmptyText = styled.Text`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 16px;
`;

export const LoadError = styled.Text`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.danger[600]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
`;

import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Content = styled.View`
  flex: 1;
  align-items: center;
  padding: 42px 20px 20px;
`;

export const Avatar = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #202e67;
`;

export const Greeting = styled.Text`
  margin-top: 10px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: 24px;
  font-weight: ${({ theme }) => theme.fonts.weights.medium};
`;

export const Subtitle = styled.Text`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 14px;
`;

export const Section = styled.View`
  width: 100%;
  margin-top: 30px;
`;

export const Question = styled.Text`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fonts.weights.bold};
  text-align: center;
`;

export const QuickActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const QuickAction = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border-radius: 21px;
  background-color: ${({ theme }) => theme.colors.primary.Green};
`;

export const QuickLabel = styled.Text`
  color: ${({ theme }) => theme.colors.white[100]};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 10px;
`;

export const PantryTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins};
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fonts.weights.medium};
`;

export const EmptyText = styled.Text`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 16px;
`;

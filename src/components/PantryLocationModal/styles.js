import styled from 'styled-components/native';

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
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
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

export const HelpText = styled.Text`
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes['1']}px;
  line-height: 20px;
`;

export const Actions = styled.View`
  flex-direction: row;
  align-self: flex-end;
  gap: 12px;
`;

import styled from 'styled-components/native';

export const Wrapper = styled.View`
  width: 100%;
  align-items: center;
`;

export const TitleGroup = styled.View`
  align-items: center;
  gap: 10px;
`;

export const Marker = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ $color }) => $color ?? '#202e67'};
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => 20 * theme.fonts.scale}px;
  text-align: center;
`;

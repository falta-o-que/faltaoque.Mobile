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
  max-width: 390px;
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

export const Content = styled.View`
  flex-shrink: 1;
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

export const Scroll = styled.ScrollView`
  flex-shrink: 1;
`;

export const HistoryCard = styled.View`
  gap: 10px;
  margin: 2px 2px 16px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.white[300]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 2;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 1px;
  shadow-opacity: 0.12;
  shadow-radius: 3px;
`;

export const ListName = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[2]}px;
  line-height: 22px;
`;

export const DateRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const DateLabel = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
`;

export const DateText = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
  text-align: right;
`;

export const SectionLabel = styled.Text`
  margin-top: 2px;
  padding-top: 10px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.white[300]};
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
`;

export const Items = styled.View`
  gap: 8px;
`;

export const ItemRow = styled.View`
  min-height: 28px;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ItemName = styled.Text`
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.black[500]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
  line-height: 20px;
`;

export const ItemMeta = styled.Text`
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => theme.fonts.sizes[0]}px;
  line-height: 20px;
`;

export const EmptyText = styled.Text`
  flex: 1;
  padding: 16px 4px;
  color: ${({ theme }) => theme.colors.black[300]};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
  line-height: 20px;
  text-align: center;
`;

export const RepeatButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding: 10px 16px;
  border-radius: 12px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: #95e880;
`;

export const RepeatButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => theme.fonts.sizes[1]}px;
  text-align: center;
`;

export const Actions = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

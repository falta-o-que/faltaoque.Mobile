import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Content = styled.ScrollView.attrs({
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 24, gap: 14 },
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 4px;
`;

export const HeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 20px;
  background-color: ${({ $color }) => $color ?? '#202e67'};
`;

export const TitleArea = styled.View`
  align-items: flex-start;
  flex-shrink: 1;
`;

export const HeaderTitle = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: ${({ theme }) => 24 * theme.fonts.scale}px;
`;

export const SummaryLabel = styled.Text`
  color: ${({ $selected, theme }) => $selected ? theme.colors.primary.Green : '#708077'};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 12 * theme.fonts.scale}px;
`;

export const FilterLabel = styled.Text`
  margin-bottom: -8px;
  color: ${({ theme }) => theme.colors.black[400]};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 12 * theme.fonts.scale}px;
`;

export const PeriodLabel = styled.View`
  flex-direction: row;
  gap: 6px;
  padding: 4px;
  border-radius: 14px;
  background-color: #f2f8f3;
`;

export const PeriodButton = styled.Pressable`
  min-height: 34px;
  max-width: 210px;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 10px;
  background-color: ${({ $selected }) => $selected ? '#ffffff' : 'transparent'};
`;

export const MarketFilterButton = styled.Pressable`
  max-width: 210px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid ${({ $selected }) => $selected ? '#b4e8b4' : '#e3ece5'};
  border-radius: 18px;
  background-color: ${({ $selected }) => $selected ? '#f2f8f3' : '#ffffff'};
`;

export const FilterScroll = styled.ScrollView.attrs({ contentContainerStyle: { gap: 8 }, showsHorizontalScrollIndicator: false })``;

export const MetricRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const MetricCard = styled.View`
  min-height: 82px;
  flex: 1;
  gap: 5px;
  justify-content: center;
  padding: 10px;
  border-radius: 14px;
  background-color: ${({ $primary }) => $primary ? '#00DD00' : '#f2f8f3'};
`;

export const MetricMain = styled.View`
  gap: 5px;
`;

export const MetricLabel = styled.Text`
  color: ${({ $light }) => $light ? '#ecffec' : '#708077'};
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 10 * theme.fonts.scale}px;
`;

export const MetricValue = styled.Text`
  color: ${({ $light }) => $light ? '#ffffff' : '#111111'};
  font-family: ${({ theme }) => theme.fonts.families.poppins.bold};
  font-size: ${({ theme }) => 15 * theme.fonts.scale}px;
`;

export const Card = styled.View`
  padding: 14px 12px 12px;
  border: 1px solid #e3ece5;
  border-radius: 16px;
  background-color: #ffffff;
`;

export const CardHeader = styled.View`
  min-height: 22px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const ChartTitle = styled.Text`
  flex-shrink: 1;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.poppins.bold};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
`;

export const SummaryValue = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.poppins.bold};
  font-size: ${({ theme }) => 12 * theme.fonts.scale}px;
`;

export const ChartHint = styled.Text`
  margin-top: 4px;
  color: #708077;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

export const Chart = styled.View`
  align-items: center;
  width: 100%;
  margin-top: 8px;
`;

export const ChartEmpty = styled.Text`
  padding: 22px 10px;
  color: #708077;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 12 * theme.fonts.scale}px;
  text-align: center;
`;

export const Summary = styled.View`
  width: 100%;
  min-height: 104px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 8px 0 14px;
`;

export const CategoryDonut = styled.View.attrs({ accessible: true })`
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

export const CategoryDonutOverlay = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  align-items: center;
  justify-content: center;
`;

export const CategoryDonutPercent = styled.Text`
  include-font-padding: false;
  color: #00AA00;
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
  line-height: ${({ theme }) => 16 * theme.fonts.scale}px;
  text-align: center;
  text-align-vertical: center;
  transform: translateY(-1px);
`;

export const CategoryOverviewText = styled.View`
  flex: 1;
  min-width: 0;
  gap: 4px;
`;

export const CategoryLegendList = styled.View`
  width: 100%;
  gap: 10px;
`;

export const Section = styled.View`
  flex-shrink: 1;
  gap: 6px;
`;

export const CategoryLegend = styled.View`
  width: 100%;
  gap: 5px;
`;

export const CategoryLegendTop = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const CategoryLegendDot = styled.View`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 4px;
  background-color: ${({ $color }) => $color};
`;

export const CategoryLegendName = styled.Text`
  flex: 1;
  min-width: 0;
  color: #708077;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

export const CategoryLegendValue = styled.Text`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

export const CategoryPercent = styled.Text`
  width: 34px;
  flex-shrink: 0;
  color: #708077;
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
  text-align: right;
`;

export const CategoryProgress = styled.View`
  height: 5px;
  overflow: hidden;
  border-radius: 3px;
  background-color: #f2f8f3;
`;

export const CategoryProgressFill = styled.View`
  width: ${({ $percent }) => `${Math.max(0, Math.min(1, $percent)) * 100}%`};
  height: 100%;
  border-radius: 3px;
  background-color: ${({ $color }) => $color};
`;

export const PriceFilters = styled.ScrollView.attrs({ contentContainerStyle: { gap: 8 }, showsHorizontalScrollIndicator: false })`
  margin-top: 10px;
`;

export const PriceFilterItem = styled.Pressable`
  max-width: 180px;
  min-height: 34px;
  justify-content: center;
  padding: 0 12px;
  border-radius: 18px;
  border: 1px solid ${({ $selected }) => $selected ? '#00DD00' : '#e3ece5'};
  background-color: ${({ $selected }) => $selected ? '#f2f8f3' : '#ffffff'};
`;

export const InsightCard = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  background-color: #dff8e7;
`;

export const InsightName = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.poppins.bold};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
`;

export const InsightText = styled.Text`
  color: #708077;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 11 * theme.fonts.scale}px;
`;

export const InsightPrice = styled.Text`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.poppins.bold};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
`;

export const StateText = styled.Text`
  width: 100%;
  padding: 24px 8px;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: ${({ theme }) => 14 * theme.fonts.scale}px;
  text-align: center;
`;

export const StateContent = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

export const RetryButton = styled.Pressable`
  padding: 8px 14px;
  border-radius: 20px;
  background-color: #f2f8f3;
`;

export const RetryLabel = styled.Text`
  color: ${({ theme }) => theme.colors.primary.Green};
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: ${({ theme }) => 13 * theme.fonts.scale}px;
`;

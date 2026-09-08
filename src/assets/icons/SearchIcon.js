import Svg, { Path } from 'react-native-svg';

export default function SearchIcon({ size = 24, color = '#15803D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18.5 18.5L22 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M6.75 3.27093C8.14732 2.46262 9.76964 2 11.5 2C16.7467 2 21 6.25329 21 11.5C21 16.7467 16.7467 21 11.5 21C6.25329 21 2 16.7467 2 11.5C2 9.76964 2.46262 8.14764 3.27093 6.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

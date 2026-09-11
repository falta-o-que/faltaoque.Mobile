import Svg, { Path } from 'react-native-svg';

export default function aCheckIcon({ width = 17, height = 18, color = '#00B83E' }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 17 18" fill="none">
      <Path d="M5.375 9.375L6.875 10.875L10.625 7.125" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.25 2.50337C5.35315 1.86523 6.63392 1.5 8 1.5C12.1421 1.5 15.5 4.85786 15.5 9C15.5 13.1421 12.1421 16.5 8 16.5C3.85786 16.5 0.5 13.1421 0.5 9C0.5 7.63392 0.865229 6.35315 1.50337 5.25" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

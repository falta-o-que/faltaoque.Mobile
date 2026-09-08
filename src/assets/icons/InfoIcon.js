import Svg, { Circle, Path } from 'react-native-svg';

export default function InfoIcon({ size = 24, color = '#494949' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 17V11" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={1} fill={color} />
      <Path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.46262 8.14715 3.33782 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

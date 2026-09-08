import Svg, { Path, Rect } from 'react-native-svg';

export default function SelectIcon({ size = 20, color = '#303030' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect x={0.5} y={0.5} width={19} height={19} rx={5.5} stroke={color} />
      <Path d="M6.5 10.5L8.5 12.5L13.5 7.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

import Svg, { Rect } from 'react-native-svg';

export default function ColorProdutoCategoryIcon({ width = 4, height = 20, color = '#5CFF5C' }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 4 20" fill="none">
      <Rect width={4} height={20} rx={2} fill={color} />
    </Svg>
  );
}

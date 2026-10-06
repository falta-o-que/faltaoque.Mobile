import Svg, { Path } from 'react-native-svg';

/**
 * Small standalone checkmark used by compact list controls.
 *
 * The default dimensions and stroke match the supplied Figma Vector asset;
 * width, height and color remain configurable for the native layout.
 */
export default function SimpleCheckIcon({ width = 9, height = 7, color = '#303030' }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 9 7" fill="none">
      <Path
        d="M0.75 3.75L2.75 5.75L7.75 0.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

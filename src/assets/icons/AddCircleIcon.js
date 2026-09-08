import Svg, { Path } from 'react-native-svg';

export default function AddCircleIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 12H9M12 9V15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

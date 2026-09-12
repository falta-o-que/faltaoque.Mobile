import Svg, { Circle, Path } from 'react-native-svg';

export default function AddUserIcon({ size = 20, color = '#000000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="8.33333" cy="4.99996" r="3.33333" stroke={color} strokeWidth={1.5} />
      <Path d="M17.5 8.33331H15.8334M15.8334 8.33331H14.1667M15.8334 8.33331L15.8334 6.66663M15.8334 8.33331L15.8334 9.99996" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M14.9979 15C15 14.8632 15 14.7242 15 14.5834C15 12.5123 12.0153 10.8334 8.33335 10.8334C4.65146 10.8334 1.66669 12.5123 1.66669 14.5834C1.66669 16.6544 1.66669 18.3334 8.33335 18.3334C10.1925 18.3334 11.5332 18.2028 12.5 17.9696" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

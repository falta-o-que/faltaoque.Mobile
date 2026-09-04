import Svg, { Path } from 'react-native-svg';

export default function ShoppingListIcon({ size = 24, color = '#00DD00' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2H9C5.22876 2 3.34315 2 2.17157 3.17157C1 4.34315 1 6.22876 1 10V14C1 17.7712 1 19.6569 2.17157 20.8284C3.34315 22 5.22876 22 9 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8 14.5L8.42105 12.3947C8.50073 11.9963 8.69991 11.6314 8.98715 11.3442L17.5 2.83137C18.0523 2.27908 18.9477 2.27908 19.5 2.83137L20.1686 3.5C20.7209 4.05228 20.7209 4.94772 20.1686 5.5L11.6558 14.0128C11.3686 14.3001 11.0037 14.4993 10.6053 14.5789L8.5 15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

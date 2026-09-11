import Svg, { Path } from 'react-native-svg';

export default function CancelCircleIcon({ size = 20, color = '#000000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M12.0832 7.91667L7.9165 12.0833M7.91649 7.91666L12.0831 12.0833"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M5.83317 2.78152C7.05889 2.07248 8.48197 1.66667 9.99984 1.66667C14.6022 1.66667 18.3332 5.39763 18.3332 10C18.3332 14.6024 14.6022 18.3333 9.99984 18.3333C5.39746 18.3333 1.6665 14.6024 1.6665 10C1.6665 8.48214 2.07231 7.05906 2.78136 5.83334"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

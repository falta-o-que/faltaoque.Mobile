import Svg, { Path } from 'react-native-svg';

export default function AngleIcon({
  width = 19,
  height = 12,
  color = '#00DD00',
  direction = 'down',
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 21 13" fill="none">
      <Path
        d="M19.3703 0L10.8956 10.577C10.7325 10.7724 10.5152 10.8815 10.2891 10.8815C10.063 10.8815 9.8457 10.7724 9.68259 10.577L1.213 0.00535342L0 1.51927L8.46959 12.091C8.96015 12.6745 9.61184 13 10.2895 13C10.9672 13 11.6189 12.6745 12.1095 12.091L20.5833 1.51391L19.3703 0Z"
        fill={color}
        transform={direction === 'up' ? 'rotate(180 10.5 6.5)' : undefined}
      />
    </Svg>
  );
}

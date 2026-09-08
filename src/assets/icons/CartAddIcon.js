import Svg, { Path } from 'react-native-svg';

export default function CartAddIcon({ size = 24, color = '#494949' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7.5 18A1.5 1.5 0 1 1 7.5 21A1.5 1.5 0 0 1 7.5 18Z" stroke={color} strokeWidth={1.5} />
      <Path d="M16.5 18A1.5 1.5 0 1 1 16.5 21A1.5 1.5 0 0 1 16.5 18Z" stroke={color} strokeWidth={1.5} />
      <Path d="M13 13V9M11 11H15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M2 3L2.26121 3.09184C3.5628 3.54945 4.2136 3.77826 4.58584 4.32298C4.95808 4.86771 4.95808 5.59126 4.95808 7.03836V9.76C4.95808 12.7016 5.02132 13.6723 5.88772 14.5862C6.75412 15.5 8.14857 15.5 10.9375 15.5H12M16.2404 15.5C17.8014 15.5 18.5819 15.5 19.1336 15.0504C19.6853 14.6008 19.8429 13.8364 20.158 12.3075L20.6578 9.88275C21.0049 8.14369 21.1784 7.27417 20.7345 6.69708C20.2906 6.12 18.7738 6.12 17.0888 6.12H11.0235M4.95808 6.12H7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

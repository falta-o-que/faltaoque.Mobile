import { Marker, Title, TitleGroup, Wrapper } from './styles';

export default function ScreenSectionHeading({ title, color, showMarker = true }) {
  return (
    <Wrapper>
      <TitleGroup>
        {showMarker ? <Marker $color={color} /> : null}
        <Title>{title}</Title>
      </TitleGroup>
    </Wrapper>
  );
}

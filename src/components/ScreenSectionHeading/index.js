import { Marker, Title, TitleGroup, Wrapper } from './styles';

export default function ScreenSectionHeading({ title, color }) {
  return (
    <Wrapper>
      <TitleGroup>
        <Marker $color={color} />
        <Title>{title}</Title>
      </TitleGroup>
    </Wrapper>
  );
}

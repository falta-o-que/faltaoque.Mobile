import { useTheme } from 'styled-components/native';

import { DespensaIconEspecifico, SettingsIcon } from '../../assets/icons/export';
import {
  Card,
  ColorCircle,
  Details,
  DetailRow,
  Footer,
  IconButton,
  Label,
  QuantityBadge,
  QuantityText,
  Title,
  TitleGroup,
} from './styles';

const formatProductCount = (count) => `${count} ${count === 1 ? 'Produto' : 'Produtos'}`;
const formatShoppingListCount = (count) => `${count} ${count === 1 ? 'Lista' : 'Listas'}`;

export function PantryCard({
  color,
  name,
  onPress,
  onSettingsPress,
  productCount = 0,
  shoppingListCount = 0,
}) {
  const theme = useTheme();

  return (
    <Card accessibilityRole="button" onPress={onPress}>
      <TitleGroup>
        <DespensaIconEspecifico size={24} />
        <Title>{name}</Title>
      </TitleGroup>
      <Details>
        <DetailRow>
          <Label>Despensa:</Label>
          <QuantityBadge>
            <QuantityText>{formatProductCount(productCount)}</QuantityText>
          </QuantityBadge>
        </DetailRow>
        <DetailRow>
          <Label>Listas:</Label>
          <QuantityBadge>
            <QuantityText>{formatShoppingListCount(shoppingListCount)}</QuantityText>
          </QuantityBadge>
        </DetailRow>
      </Details>
      <Footer>
        <ColorCircle $color={color} />
        <IconButton
          accessibilityLabel={`Configurar ${name}`}
          accessibilityRole="button"
          onPress={onSettingsPress}
        >
          <SettingsIcon color={theme.colors.black[400]} size={24} />
        </IconButton>
      </Footer>
    </Card>
  );
}

export default PantryCard;

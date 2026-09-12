import { useTheme } from 'styled-components/native';

import { InfoIcon } from '../../assets/icons/export';
import {
  Card,
  Expiration,
  InfoButton,
  InfoLabel,
  ProductDetails,
  ProductHeader,
  ProductImage,
  ProductMeasure,
  ProductName,
  Quantity,
  QuantityButton,
  QuantityButtonLabel,
  QuantityControl,
} from './styles';

const productImage = require('../../assets/grocery/legumesGrocery.png');

export function ProductCard({
  name,
  quantity = 0,
  weight,
  unit,
  expirationLabel,
  onInfoPress,
  onIncrement,
  onDecrement,
  disabled = false,
}) {
  const theme = useTheme();
  const hasInfoAction = typeof onInfoPress === 'function';
  const canDecrement = !disabled && quantity > 1 && typeof onDecrement === 'function';
  const canIncrement = !disabled && typeof onIncrement === 'function';
  const measure = [weight, unit].filter(Boolean).join(' ');

  return (
    <Card>
      <ProductDetails>
        <ProductImage accessibilityLabel={`Imagem de ${name}`} source={productImage} />
        <ProductHeader>
          <ProductName>{name}</ProductName>
          {measure ? <ProductMeasure>{measure}</ProductMeasure> : null}
        </ProductHeader>
        {expirationLabel ? <Expiration>{expirationLabel}</Expiration> : null}
        <InfoButton
          accessibilityLabel={`Informações sobre ${name}`}
          accessibilityRole="button"
          disabled={!hasInfoAction}
          onPress={hasInfoAction ? onInfoPress : undefined}
        >
          <InfoIcon color={theme.colors.black[400]} size={24} />
          <InfoLabel>Info</InfoLabel>
        </InfoButton>
      </ProductDetails>
      <QuantityControl>
        <QuantityButton
          $disabled={!canDecrement}
          $variant="minus"
          accessibilityLabel={`Diminuir quantidade de ${name}`}
          accessibilityRole="button"
          disabled={!canDecrement}
          onPress={canDecrement ? onDecrement : undefined}
        >
          <QuantityButtonLabel>-</QuantityButtonLabel>
        </QuantityButton>
        <Quantity accessibilityLabel={`Quantidade: ${quantity}`}>{String(quantity)}</Quantity>
        <QuantityButton
          $disabled={!canIncrement}
          $variant="plus"
          accessibilityLabel={`Aumentar quantidade de ${name}`}
          accessibilityRole="button"
          disabled={!canIncrement}
          onPress={canIncrement ? onIncrement : undefined}
        >
          <QuantityButtonLabel>+</QuantityButtonLabel>
        </QuantityButton>
      </QuantityControl>
    </Card>
  );
}

export default ProductCard;

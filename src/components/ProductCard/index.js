import { useTheme } from 'styled-components/native';

import { InfoIcon } from '../../assets/icons/export';
import CategoryTag, { CATEGORY_LABELS } from '../CategoryTag';
import {
  Card,
  CategoryIndicator,
  Expiration,
  InfoButton,
  InfoLabel,
  ProductDetails,
  ProductHeader,
  ProductImage,
  ProductMeasure,
  ProductName,
  ProductPrice,
  Quantity,
  QuantityButton,
  QuantityButtonLabel,
  QuantityControl,
} from './styles';

const productImage = require('../../assets/grocery/legumesGrocery.png');

export function ProductCard({
  name,
  quantity = 0,
  unitPrice,
  weight,
  unit,
  expirationLabel,
  category,
  showCategory = false,
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
  const categoryKey = CATEGORY_LABELS[category] ? category : 'organicos';
  const price = Number(unitPrice);
  const priceLabel = Number.isFinite(price) ? `R$ ${price.toFixed(2).replace('.', ',')}` : null;

  return (
    <Card>
      <ProductDetails>
        <ProductImage accessibilityLabel={`Imagem de ${name}`} source={productImage} />
        <ProductHeader>
          <CategoryIndicator accessibilityLabel={`Categoria: ${CATEGORY_LABELS[categoryKey]}`} $category={categoryKey} />
          <ProductName>{name}</ProductName>
          {measure ? <ProductMeasure>{measure}</ProductMeasure> : null}
        </ProductHeader>
        {priceLabel ? <ProductPrice>{priceLabel}</ProductPrice> : null}
        {expirationLabel ? <Expiration>{expirationLabel}</Expiration> : null}
        {showCategory && category ? <CategoryTag category={categoryKey} disabled variant="product" /> : null}
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

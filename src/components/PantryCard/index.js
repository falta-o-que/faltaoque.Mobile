import { useTheme } from 'styled-components/native';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

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

export function PantryCard({
  color,
  name,
  onPress,
  onSettingsPress,
  productCount = 0,
  shoppingListCount = 0,
}) {
  const theme = useTheme();
  const { t } = useAppPreferences();

  return (
    <Card accessibilityRole="button" onPress={onPress}>
      <TitleGroup>
        <DespensaIconEspecifico size={24} />
        <Title>{name}</Title>
      </TitleGroup>
      <Details>
        <DetailRow>
          <Label>{t('pantryCard.pantry')}:</Label>
          <QuantityBadge>
            <QuantityText>{t(productCount === 1 ? 'pantryCard.productOne' : 'pantryCard.productMany', { count: productCount })}</QuantityText>
          </QuantityBadge>
        </DetailRow>
        <DetailRow>
          <Label>{t('pantryCard.lists')}:</Label>
          <QuantityBadge>
            <QuantityText>{t(shoppingListCount === 1 ? 'pantryCard.listOne' : 'pantryCard.listMany', { count: shoppingListCount })}</QuantityText>
          </QuantityBadge>
        </DetailRow>
      </Details>
      <Footer>
        <ColorCircle $color={color} />
        <IconButton
          accessibilityLabel={t('pantryCard.configure', { name })}
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

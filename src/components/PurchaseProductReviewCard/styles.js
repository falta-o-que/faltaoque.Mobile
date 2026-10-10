import styled from 'styled-components/native';

export const Card = styled.View`
  padding: 16px;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.white[200]};
  background-color: ${({ theme }) => theme.colors.white[100]};
  elevation: 4;
  shadow-color: ${({ theme }) => theme.colors.black.Black};
  shadow-offset: 0px 1px;
  shadow-opacity: 0.12;
  shadow-radius: 4px;
  opacity: ${({ $selected }) => $selected ? 1 : 0.65};
`;
export const CardActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;
export const CategoryButton = styled.TouchableOpacity`
  min-height: 44px;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.colors.primary.Green};
`;
export const CategoryButtonText = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary[700]};
`;
export const Editor = styled.View`
  gap: 12px;
  padding-top: 16px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.white[200]};
`;
export const EditorTitle = styled.Text`
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.poppins.medium};
  font-size: 18px;
`;
export const FieldGroup = styled.View`
  gap: 8px;
`;
export const EditorError = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger[600]};
`;
export const Group = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;
export const Label = styled.Text`
  flex-shrink: 1;
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.black.Black};
`;
export const Muted = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 14px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.black[400]};
`;
export const Name = styled.Text.attrs({ numberOfLines: 2 })`
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 18px;
  color: ${({ theme }) => theme.colors.black[500]};
`;
export const Price = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.bold};
  font-size: 18px;
  color: ${({ theme }) => theme.colors.primary.Green};
`;
export const ProductBody = styled.View`
  flex: 1;
  min-width: 0;
  gap: 4px;
`;
export const ProductImage = styled.Image`
  width: 50px;
  height: 50px;
`;
export const ProductRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;
export const ReceiptLabel = styled.Text`
  font-family: ${({ theme }) => theme.fonts.families.inter.medium};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.black[400]};
`;
export const Selection = styled.TouchableOpacity`
  min-height: 48px;
  padding: 12px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
`;
export const SelectionStatus = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.white[200]};
`;
export const SelectionText = styled(Label)``;

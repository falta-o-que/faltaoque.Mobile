import styled from 'styled-components/native';

export const Card = styled.View`
    padding: 16px;
    gap: 12px;
    border-radius: 12px;
    border: 1px solid ${({theme}) => theme.colors.white[200]};
    background-color: ${({theme}) => theme.colors.white[100]};
    elevation: 4;
    shadow-color: ${({theme}) => theme.colors.black.Black};
    shadow-offset: 0px 1px;
    shadow-opacity: 0.12;
    shadow-radius: 4px;
    opacity: ${({$selected}) => $selected ? 1 : 0.65};
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
    border: 1px dashed ${({theme}) => theme.colors.primary.Green};
`;
export const CategoryButtonText = styled.Text`
    font-family: ${({theme}) => theme.fonts.families.inter.medium};
    font-size: ${({theme}) => 13 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.primary[700]};
`;
export const Editor = styled.View`
    gap: 12px;
    padding-top: 16px;
    border-top-width: 1px;
    border-top-color: ${({theme}) => theme.colors.white[200]};
`;
export const EditorTitle = styled.Text`
    color: ${({theme}) => theme.colors.black.Black};
    font-family: ${({theme}) => theme.fonts.families.poppins.medium};
    font-size: ${({theme}) => 18 * theme.fonts.scale}px;
`;
export const FieldGroup = styled.View`
    gap: 8px;
`;
export const FinishEditButton = styled.TouchableOpacity.attrs({activeOpacity: 0.72})`
    min-height: 48px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    background-color: ${({theme}) => theme.colors.primary[300]};
    opacity: ${({disabled}) => disabled ? 0.5 : 1};
`;
export const EditButton = styled.TouchableOpacity.attrs({activeOpacity: 0.72})`
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background-color: ${({theme}) => theme.colors.primary[300]};
    opacity: ${({disabled}) => disabled ? 0.5 : 1};
`;
export const FinishEditText = styled.Text`
    color: ${({theme}) => theme.colors.black.Black};
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
`;
export const EditorError = styled.Text`
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => 13 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.danger[600]};
`;
export const Group = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
`;
export const Label = styled.Text`
    flex-shrink: 1;
    font-family: ${({theme}) => theme.fonts.families.inter.medium};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.black.Black};
`;
export const Muted = styled.Text`
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
    line-height: ${({theme}) => 21 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.black[400]};
`;
export const Name = styled.Text.attrs({numberOfLines: 2})`
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 18 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.black[500]};
`;
export const Price = styled.Text`
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 18 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.primary.Green};
`;
export const ProductBody = styled.View`
    flex: 1;
    min-width: 0;
    gap: 4px;
`;
export const DuplicateNotice = styled.View`
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-width: 1px;
    border-color: ${({theme}) => theme.colors.warning[400]};
    border-radius: 10px;
    background-color: ${({theme}) => theme.colors.tertiary[200]};
`;
export const DuplicateNoticeCopy = styled.View`
    flex: 1;
    min-width: 0;
    gap: 2px;
`;
export const DuplicateNoticeTitle = styled.Text`
    color: ${({theme}) => theme.colors.warning[600]};
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 13 * theme.fonts.scale}px;
`;
export const DuplicateNoticeText = styled.Text`
    color: ${({theme}) => theme.colors.black[500]};
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => 12 * theme.fonts.scale}px;
    line-height: ${({theme}) => 17 * theme.fonts.scale}px;
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
    font-family: ${({theme}) => theme.fonts.families.inter.medium};
    font-size: ${({theme}) => 12 * theme.fonts.scale}px;
    color: ${({theme}) => theme.colors.black[400]};
`;
export const Selection = styled.TouchableOpacity`
    min-height: 48px;
    padding: 12px;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid ${({theme}) => theme.colors.black[200]};
`;
export const SelectionStatus = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom-width: 1px;
    border-bottom-color: ${({theme}) => theme.colors.white[200]};
`;
export const SelectionText = styled(Label)``;

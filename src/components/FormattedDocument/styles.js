import styled from 'styled-components/native';

export const DocumentContainer = styled.View`
    gap: 12px;
    padding-bottom: 4px;
`;

export const DocumentBrand = styled.Text`
    color: ${({theme}) => theme.colors.black.Black};
    font-family: ${({theme}) => theme.fonts.families.poppins.medium};
    font-size: ${({theme}) => 17 * theme.fonts.scale}px;
    line-height: ${({theme}) => 23 * theme.fonts.scale}px;
`;

export const DocumentSectionTitle = styled.Text`
    color: ${({theme}) => theme.colors.black.Black};
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 15 * theme.fonts.scale}px;
    line-height: ${({theme}) => 21 * theme.fonts.scale}px;
`;

export const DocumentParagraph = styled.Text`
    color: ${({theme}) => theme.colors.black[400]};
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
    line-height: ${({theme}) => 22 * theme.fonts.scale}px;
`;

export const DocumentLink = styled.Text`
    color: ${({theme}) => theme.colors.primary.Green};
    text-decoration-line: underline;
`;

export const DocumentBulletList = styled.View`
    gap: 7px;
    padding-left: 4px;
`;

export const DocumentBulletRow = styled.View`
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
`;

export const DocumentBulletMarker = styled.Text`
    width: 12px;
    color: ${({theme}) => theme.colors.black[400]};
    font-family: ${({theme}) => theme.fonts.families.inter.bold};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
    line-height: ${({theme}) => 22 * theme.fonts.scale}px;
`;

export const DocumentBulletText = styled.Text`
    flex: 1;
    color: ${({theme}) => theme.colors.black[400]};
    font-family: ${({theme}) => theme.fonts.families.inter.regular};
    font-size: ${({theme}) => 14 * theme.fonts.scale}px;
    line-height: ${({theme}) => 22 * theme.fonts.scale}px;
`;

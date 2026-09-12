import styled from 'styled-components/native';

export const Container = styled.View`
  width: 100%;
  min-height: 37px;
  flex-direction: row;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.colors.white[600]};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Input = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.white[600],
}))`
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-family: ${({ theme }) => theme.fonts.families.inter.regular};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.black[500]};
`;

export const SearchButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.72 })`
  width: 60px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary[400]};
`;

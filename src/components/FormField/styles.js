import styled from 'styled-components/native';

export const Container = styled.View`
  min-height: 56px;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.black[200]};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.white[100]};
`;

export const Input = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.primary.Green,
}))`
  flex: 1;
  padding: 0;
  color: ${({ theme }) => theme.colors.black.Black};
  font-family: ${({ theme }) => theme.fonts.families.inter};
  font-size: 14px;
`;

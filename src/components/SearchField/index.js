import { useRef } from 'react';
import { SearchIcon } from '../../assets/icons/export';
import { Container, Input, SearchButton } from './styles';

export function SearchField({ value, onChangeText, onSearch, placeholder = 'Pesquisa', ...props }) {
  const inputRef = useRef(null);
  const handleSearch = () => {
    if (onSearch) onSearch(value);
    else inputRef.current?.focus();
  };

  return (
    <Container>
      <Input
        ref={inputRef}
        accessibilityLabel="Pesquisar produtos"
        autoCorrect={false}
        returnKeyType="search"
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onSubmitEditing={handleSearch}
      />
      <SearchButton accessibilityRole="button" accessibilityLabel="Pesquisar" onPress={handleSearch}>
        <SearchIcon size={24} />
      </SearchButton>
    </Container>
  );
}

export default SearchField;

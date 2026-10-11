import { useRef } from 'react';
import { SearchIcon } from '../../assets/icons/export';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { Container, Input, SearchButton } from './styles';

export function SearchField({ value, onChangeText, onSearch, placeholder, ...props }) {
  const { t } = useAppPreferences();
  const inputRef = useRef(null);
  const handleSearch = () => {
    if (onSearch) onSearch(value);
    else inputRef.current?.focus();
  };

  return (
    <Container>
      <Input
        ref={inputRef}
        accessibilityLabel={t('search.products')}
        autoCorrect={false}
        returnKeyType="search"
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('search.placeholder')}
        onSubmitEditing={handleSearch}
      />
      <SearchButton accessibilityRole="button" accessibilityLabel={t('search.submit')} onPress={handleSearch}>
        <SearchIcon size={24} />
      </SearchButton>
    </Container>
  );
}

export default SearchField;

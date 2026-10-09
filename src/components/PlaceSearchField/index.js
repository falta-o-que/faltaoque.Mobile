import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import FormField from '../FormField';
import { createPlacesSessionToken, getPlaceDetails, searchPlaces } from '../../services/googlePlacesService';
import { getUserErrorMessage } from '../../utils/userErrors';
import { Attribution, GoogleLetter, Helper, Option, OptionSubtitle, OptionTitle, Options, Status } from './styles';

export default function PlaceSearchField({ value, selected, onChangeText, onSelect, disabled, error, accessibilityLabel = 'Endereço ou mercado', placeholder = 'Busque um endereço ou mercado', Icon }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasNoResults, setHasNoResults] = useState(false);
  const sequence = useRef(0);
  const token = useRef(createPlacesSessionToken());

  useEffect(() => {
    const query = String(value ?? '').trim();
    const requestId = ++sequence.current;
    if (selected || query.length < 3) {
      setPredictions([]);
      setLoading(false);
      setMessage('');
      setHasNoResults(false);
      return undefined;
    }
    setMessage('');
    setHasNoResults(false);
    setPredictions([]);
    setLoading(false);
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(query, token.current);
        if (sequence.current === requestId) {
          setPredictions(results);
          setHasNoResults(results.length === 0);
        }
      } catch (requestError) {
        if (sequence.current === requestId) {
          setPredictions([]);
          setHasNoResults(false);
          setMessage(getUserErrorMessage(requestError, 'Não foi possível buscar endereços agora. Tente novamente.'));
        }
      } finally {
        if (sequence.current === requestId) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      if (sequence.current === requestId) sequence.current += 1;
    };
  }, [value, selected]);

  async function choose(prediction) {
    setLoading(true);
    setMessage('');
    setHasNoResults(false);
    try {
      const details = await getPlaceDetails(prediction.placeId, token.current);
      onSelect({ ...details, localName: prediction.title, displayName: prediction.title });
      token.current = createPlacesSessionToken();
      setPredictions([]);
    } catch (requestError) {
      setMessage(getUserErrorMessage(requestError, 'Não foi possível selecionar este endereço. Escolha outro resultado e tente novamente.'));
    } finally { setLoading(false); }
  }

  return <>
    <FormField accessibilityLabel={accessibilityLabel} autoCapitalize="words" editable={!disabled} error={error} Icon={Icon} onChangeText={onChangeText} placeholder={placeholder} value={value} />
    {loading ? <Status><ActivityIndicator size="small" /><Helper>Buscando endereço…</Helper></Status> : null}
    {predictions.length ? <Options keyboardShouldPersistTaps="handled">
      {predictions.map((prediction) => <Option key={prediction.placeId} accessibilityRole="button" disabled={disabled} onPress={() => choose(prediction)}>
        <OptionTitle>{prediction.title}</OptionTitle>{prediction.subtitle ? <OptionSubtitle>{prediction.subtitle}</OptionSubtitle> : null}
      </Option>)}
      <Attribution>Powered by <GoogleLetter $color="#4285F4">G</GoogleLetter><GoogleLetter $color="#EA4335">o</GoogleLetter><GoogleLetter $color="#FBBC05">o</GoogleLetter><GoogleLetter $color="#4285F4">g</GoogleLetter><GoogleLetter $color="#34A853">l</GoogleLetter><GoogleLetter $color="#EA4335">e</GoogleLetter></Attribution>
    </Options> : null}
    {message ? <Helper $error accessibilityLiveRegion="polite" accessibilityRole="alert">{message}</Helper> : null}
    {!message && hasNoResults ? (
      <Helper $error accessibilityLiveRegion="polite" accessibilityRole="alert">
        Não encontramos esse endereço. Digite um endereço válido e selecione uma sugestão do Google.
      </Helper>
    ) : null}
  </>;
}

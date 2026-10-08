import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import FormField from '../FormField';
import { formatCepInput } from '../../domain/locationValidation';
import { createPlacesSessionToken, getPlaceDetails, searchPlaces } from '../../services/googlePlacesService';
import { Attribution, GoogleLetter, Helper, Option, OptionSubtitle, OptionTitle, Options, Status } from './styles';

export default function PlaceSearchField({ value, selected, selectedPlace, onChangeText, onSelect, disabled, error, accessibilityLabel = 'Endereço ou mercado', placeholder = 'Busque um endereço ou mercado', Icon }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const sequence = useRef(0);
  const token = useRef(createPlacesSessionToken());

  useEffect(() => {
    const query = String(value ?? '').trim();
    const requestId = ++sequence.current;
    if (selected || query.length < 3) {
      setPredictions([]);
      setLoading(false);
      setMessage('');
      return undefined;
    }
    setMessage('');
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(query, token.current);
        if (sequence.current === requestId) setPredictions(results);
      } catch (requestError) {
        if (sequence.current === requestId) { setPredictions([]); setMessage(requestError.message); }
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
    try {
      const details = await getPlaceDetails(prediction.placeId, token.current);
      onSelect({ ...details, localName: prediction.title, displayName: prediction.subtitle ? `${prediction.title} · ${prediction.subtitle}` : prediction.title });
      token.current = createPlacesSessionToken();
      setPredictions([]);
    } catch (requestError) {
      setMessage(requestError.message);
    } finally { setLoading(false); }
  }

  return <>
    <FormField accessibilityLabel={accessibilityLabel} autoCapitalize="words" editable={!disabled} error={error} Icon={Icon} onChangeText={onChangeText} placeholder={placeholder} value={value} />
    {selected && selectedPlace?.cep ? <Helper>CEP que será salvo: {formatCepInput(selectedPlace.cep)}</Helper> : null}
    {loading ? <Status><ActivityIndicator size="small" /><Helper>Buscando endereço…</Helper></Status> : null}
    {predictions.length ? <Options keyboardShouldPersistTaps="handled">
      {predictions.map((prediction) => <Option key={prediction.placeId} accessibilityRole="button" disabled={disabled} onPress={() => choose(prediction)}>
        <OptionTitle>{prediction.title}</OptionTitle>{prediction.subtitle ? <OptionSubtitle>{prediction.subtitle}</OptionSubtitle> : null}
      </Option>)}
      <Attribution>Powered by <GoogleLetter $color="#4285F4">G</GoogleLetter><GoogleLetter $color="#EA4335">o</GoogleLetter><GoogleLetter $color="#FBBC05">o</GoogleLetter><GoogleLetter $color="#4285F4">g</GoogleLetter><GoogleLetter $color="#34A853">l</GoogleLetter><GoogleLetter $color="#EA4335">e</GoogleLetter></Attribution>
    </Options> : null}
    {message ? <Helper accessibilityRole="alert">{message}</Helper> : null}
  </>;
}

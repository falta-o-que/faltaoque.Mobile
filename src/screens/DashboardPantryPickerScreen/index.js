import {useCallback, useState} from 'react';
import {ActivityIndicator, Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import Navbar from '../../components/Navbar';
import SearchField from '../../components/SearchField';
import {useAuth} from '../../contexts/AuthContext';
import {useAppPreferences} from '../../contexts/AppPreferencesContext';
import {AUTHENTICATED_ROUTES} from '../../navigation/routes';
import {listPantries} from '../../services/pantryService';
import {
    Avatar,
    Card,
    ColorCircle,
    Content,
    EmptyText,
    GradientBackground,
    Header,
    List,
    PantryName,
    SearchArea,
    TitleRow,
    RetryButton,
    RetryText,
    Screen,
    StatusText,
    Subtitle,
    Title,
} from './styles';

export default function GroceryPantryPickerScreen({navigation}) {
    const {account} = useAuth();
    const {t} = useAppPreferences();
    const [pantries, setPantries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const filteredPantries = pantries.filter((pantry) => normalize(pantry.name).includes(normalize(searchQuery)));

    useFocusEffect(useCallback(() => {
        let active = true;
        setLoading(true);
        Promise.resolve().then(() => listPantries(account?.id))
            .then((items) => {
                if (active) {
                    setPantries(items);
                    setError(null);
                }
            })
            .catch(() => {
                if (active) setError(t('shopping.loadPantriesError'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [account?.id, reloadKey, t]));

    const handleNavbar = (key, item) => {
        if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME); else if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES); else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER); else if (key !== 'dashboard') Alert.alert(t('shopping.upcoming'), t('shopping.availableSoon', {label: item.label}), [{text: t('common.ok')}]);
    };

    return (<Screen edges={['top', 'right', 'left']}>
        <GradientBackground/>
        <Content>
            <Header>
                <TitleRow><Avatar $color={account?.avatarColor}/><Title>{t('dashboard.title')}</Title></TitleRow>
                <SearchArea><SearchField accessibilityLabel={t('pantries.searchA11y')}
                                         placeholder={t('pantries.search')} value={searchQuery}
                                         onChangeText={setSearchQuery}/></SearchArea>
            </Header>
            <Subtitle>{t('dashboard.choosePantry')}</Subtitle>
            {loading ? <ActivityIndicator accessibilityLabel={t('shopping.loadingPantries')}/> : error ? (<>
                <StatusText accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</StatusText>
                <RetryButton accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)}>
                    <RetryText>{t('shopping.retry')}</RetryText>
                </RetryButton>
            </>) : pantries.length === 0 ? (
                <EmptyText>{t('shopping.noPantries')}</EmptyText>) : filteredPantries.length === 0 ? (
                <EmptyText>{t('pantries.noneFound')}</EmptyText>) : (<List>
                {filteredPantries.map((pantry) => (<Card key={pantry.id} accessibilityRole="button"
                                                         accessibilityLabel={t('dashboard.openPantry', {name: pantry.name})}
                                                         onPress={() => navigation.navigate(AUTHENTICATED_ROUTES.DASHBOARD, {
                                                             pantryId: pantry.id, pantryName: pantry.name
                                                         })}>
                    <ColorCircle $color={pantry.color}/>
                    <PantryName numberOfLines={1} ellipsizeMode="tail">{pantry.name}</PantryName>
                </Card>))}
            </List>)}
        </Content>
        <Navbar activeItem="dashboard" onItemChange={handleNavbar}/>
    </Screen>);
}

import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Modal, useWindowDimensions} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import Svg, {Circle, Line, Path, Polyline, Rect, Text as SvgText} from 'react-native-svg';

import Navbar from '../../components/Navbar';
import SearchField from '../../components/SearchField';
import ModalActionButton from '../../components/ModalActionButton';
import {CancelCircleIcon} from '../../assets/icons/export';
import {useAuth} from '../../contexts/AuthContext';
import {useAppPreferences} from '../../contexts/AppPreferencesContext';
import {AUTHENTICATED_ROUTES} from '../../navigation/routes';
import {DASHBOARD_PERIODS} from '../../domain/dashboardAnalytics';
import {IS_DEMO_VARIANT} from '../../config/appVariant';
import {loadDashboard, buildDashboard} from '../../services/dashboardService';
import {
    Card,
    CardHeader,
    CategoryDonut,
    CategoryDonutOverlay,
    CategoryDonutPercent,
    CategoryLegend,
    CategoryLegendDot,
    CategoryLegendName,
    CategoryLegendValue,
    CategoryLegendList,
    CategoryLegendTop,
    CategoryOverviewText,
    CategoryPercent,
    CategoryProgress,
    CategoryProgressFill,
    MarketFilterButton,
    Chart,
    ChartEmpty,
    ChartHint,
    ChartTitle,
    Content,
    FilterLabel,
    FilterScroll,
    Header,
    HeaderAvatar,
    HeaderTitle,
    HighlightIntro,
    HighlightHint,
    InsightCard,
    InsightName,
    InsightPrice,
    InsightText,
    InsightHeader,
    InsightBadge,
    InsightBadgeText,
    InsightValues,
    InsightValueGroup,
    MetricCard,
    MetricMain,
    MetricLabel,
    MetricRow,
    MetricValue,
    PeriodButton,
    PeriodLabel,
    ProductSelect,
    ProductSelectText,
    ProductModalBackdrop,
    ProductModalSheet,
    ProductModalHeader,
    ProductModalTitle,
    ProductOption,
    ProductOptionText,
    RetryButton,
    RetryLabel,
    Screen,
    Section,
    StateContent,
    StateText,
    Summary,
    SummaryLabel,
    SummaryValue,
    TitleArea,
} from './styles';

const PERIOD_KEYS = {'30d': '30d', '3m': '3m', '6m': '6m', '12m': '12m'};

function categoryColor(name, colors) {
    if (name === 'limpezaHigiene') return colors.white[300];
    return colors.tags[name] || colors.tags.outros;
}

function formatMoney(value, language, compact = false) {
    return new Intl.NumberFormat(language, {
        style: 'currency', currency: 'BRL', maximumFractionDigits: compact ? 0 : 2,
    }).format(Number(value) || 0);
}

function formatDate(date, language) {
    if (!date) return '—';
    return new Intl.DateTimeFormat(language, {day: '2-digit', month: 'short'}).format(date).replace('.', '');
}

function productLabel(product) {
    return product?.contentValue ? `${product.name} · ${product.contentValue} ${product.unit || ''}`.trim() : product?.name;
}

function polarPoint(cx, cy, radius, angle) {
    const radians = ((angle - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

function donutPath(start, end, outer = 40, inner = 26) {
    const [x1, y1] = polarPoint(48, 48, outer, end);
    const [x2, y2] = polarPoint(48, 48, outer, start);
    const [x3, y3] = polarPoint(48, 48, inner, start);
    const [x4, y4] = polarPoint(48, 48, inner, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 0 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 1 ${x4} ${y4} Z`;
}

function ExpenseChart({data, width, language, money, emptyLabel}) {
    if (!data.length) return <ChartEmpty>{emptyLabel}</ChartEmpty>;
    const chartWidth = Math.max(240, width - 48);
    const height = 144;
    const plotTop = 12;
    const plotHeight = 98;
    const labelY = 132;
    const max = Math.max(...data.map((item) => item.total), 1);
    const gap = 8;
    const itemWidth = (chartWidth - gap * (data.length - 1)) / data.length;
    const barWidth = Math.min(26, itemWidth * 0.58);
    return (<Chart accessible accessibilityLabel={`${data.length} expense periods`}>
        <Svg width={chartWidth} height={height}>
            {[0, 0.5, 1].map((step) => (<Line key={step} x1="0" x2={chartWidth} y1={plotTop + plotHeight * step}
                                              y2={plotTop + plotHeight * step} stroke="#E7EEE8"
                                              strokeDasharray="3 4"/>))}
            {data.map((item, index) => {
                const barHeight = Math.max(4, (item.total / max) * plotHeight);
                const x = index * (itemWidth + gap) + (itemWidth - barWidth) / 2;
                const y = plotTop + plotHeight - barHeight;
                return (<React.Fragment key={item.key}>
                    <Rect x={x} y={y} width={barWidth} height={barHeight} rx="6"
                          fill={index === data.length - 1 ? '#00DD00' : '#DFF8E7'}/>
                    <SvgText x={x + barWidth / 2} y={labelY} fill="#708077" fontSize="10"
                             textAnchor="middle">{item.label}</SvgText>
                    <SvgText x={x + barWidth / 2} y={Math.max(10, y - 5)} fill="#494949" fontSize="9"
                             textAnchor="middle">{money(item.total, language, true)}</SvgText>
                </React.Fragment>);
            })}
        </Svg>
    </Chart>);
}

function CategoryChart({data, total, emptyLabel, t, language, colors}) {
    if (!data.length || total <= 0) return <ChartEmpty>{emptyLabel}</ChartEmpty>;
    const chartData = data.filter((item) => item.value > 0);
    const topCategory = chartData[0];
    let angle = 0;
    return (<Section>
        <Summary>
            <CategoryDonut accessibilityLabel="Gastos distribuídos por categoria">
                <Svg width={96} height={96}>
                    {chartData.length === 1 && chartData[0].percent >= 0.999 ?
                        <Circle cx="48" cy="48" r="36" fill="none" stroke={categoryColor(chartData[0].name, colors)}
                                strokeWidth="15"/> : null}
                    {chartData.length > 1 ? chartData.map((item) => {
                        const nextAngle = angle + item.percent * 360;
                        const path = donutPath(angle, nextAngle, 44, 29);
                        angle = nextAngle;
                        return <Path key={item.name} d={path} fill={categoryColor(item.name, colors)}/>;
                    }) : null}
                </Svg>
                <CategoryDonutOverlay pointerEvents="none">
                    <CategoryDonutPercent>{Math.round((topCategory?.percent || 0) * 100)}%</CategoryDonutPercent>
                </CategoryDonutOverlay>
            </CategoryDonut>
            <CategoryOverviewText>
                <ChartHint>{t('dashboard.topCategory')}</ChartHint>
                <InsightName numberOfLines={2}>{t(`product.category.${topCategory.name}`)}</InsightName>
                <CategoryLegendValue>{formatMoney(topCategory.value, language)} · {Math.round(topCategory.percent * 100)}%</CategoryLegendValue>
            </CategoryOverviewText>
        </Summary>
        <CategoryLegendList>
            {data.map((item) => (<CategoryLegend key={item.name}>
                <CategoryLegendTop>
                    <CategoryLegendDot $color={categoryColor(item.name, colors)}/>
                    <CategoryLegendName
                        numberOfLines={1}>{t(`product.category.${item.name}`)}</CategoryLegendName>
                    <CategoryLegendValue>{formatMoney(item.value, language)}</CategoryLegendValue>
                    <CategoryPercent>{Math.round(item.percent * 100)}%</CategoryPercent>
                </CategoryLegendTop>
                <CategoryProgress><CategoryProgressFill $color={categoryColor(item.name, colors)}
                                                        $percent={item.percent}/></CategoryProgress>
            </CategoryLegend>))}
        </CategoryLegendList>
    </Section>);
}

function PriceChart({data, width, emptyLabel, money}) {
    if (data.length < 2) return <ChartEmpty>{emptyLabel}</ChartEmpty>;
    const chartWidth = Math.max(240, width - 48);
    const chartHeight = 140;
    const values = data.map((item) => item.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || max * 0.12 || 1;
    const plotInset = 40;
    const firstTime = data[0].date.getTime();
    const timeSpan = data[data.length - 1].date.getTime() - firstTime || 1;
    const points = data.map((item, index) => {
        const x = plotInset + ((item.date.getTime() - firstTime) / timeSpan) * (chartWidth - plotInset * 2);
        const y = chartHeight - 30 - ((item.price - min) / span) * (chartHeight - 54);
        return {...item, x, y};
    });
    const valueLabelIndexes = new Set([0, points.length - 1]);
    [values.indexOf(min), values.indexOf(max)].forEach((index) => {
        if ([...valueLabelIndexes].every((other) => Math.abs(points[index].x - points[other].x) >= 56)) valueLabelIndexes.add(index);
    });
    const dateLabelIndexes = new Set([0, points.length - 1]);
    const middleIndex = Math.floor((points.length - 1) / 2);
    if ([...dateLabelIndexes].every((index) => Math.abs(points[index].x - points[middleIndex].x) >= 50)) dateLabelIndexes.add(middleIndex);
    return (<Chart accessible accessibilityLabel={`Histórico de ${data.length} preços`}>
        <Svg width={chartWidth} height={chartHeight}>
            {[0, 0.5, 1].map((step) => <Line key={step} x1="0" x2={chartWidth} y1={14 + step * 82}
                                             y2={14 + step * 82} stroke="#E7EEE8" strokeDasharray="3 4"/>)}
            <Polyline points={points.map((item) => `${item.x},${item.y}`).join(' ')} fill="none" stroke="#00BB00"
                      strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
            {points.map((point, index) => (<React.Fragment key={`${point.date.toISOString()}-${index}`}>
                <Circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#00BB00" strokeWidth="2.5"/>
                {valueLabelIndexes.has(index) ? (() => {
                    const label = money(point.price);
                    const adjacentPoints = [points[index - 1], points[index + 1]].filter(Boolean);
                    const labelHalfWidth = label.length * 2.6;
                    const lineTouchesLabel = adjacentPoints.some((adjacentPoint) => {
                        if (adjacentPoint.y >= point.y) return false;
                        const horizontalReach = Math.min(labelHalfWidth, Math.abs(adjacentPoint.x - point.x));
                        const lineYAtLabelEdge = point.y + (adjacentPoint.y - point.y) * horizontalReach / Math.abs(adjacentPoint.x - point.x);
                        return lineYAtLabelEdge <= point.y - 8;
                    });
                    const labelY = lineTouchesLabel ? point.y + 14 : point.y - 10;
                    return <SvgText x={point.x} y={labelY} fill="#494949" fontSize="9"
                                    textAnchor="middle">{label}</SvgText>;
                })() : null}
                {dateLabelIndexes.has(index) ? <SvgText x={point.x} y={chartHeight - 6} fill="#708077" fontSize="9"
                                                        textAnchor="middle">{point.label}</SvgText> : null}
            </React.Fragment>))}
        </Svg>
    </Chart>);
}

export default function DashboardScreen({navigation, route}) {
    const {account} = useAuth();
    const {t, language} = useAppPreferences();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const {width: screenWidth} = useWindowDimensions();
    const contentWidth = Math.max(240, screenWidth - 40);
    const [period, setPeriod] = useState('30d');
    const [marketId, setMarketId] = useState(null);
    const [productId, setProductId] = useState(null);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [productQuery, setProductQuery] = useState('');
    const [source, setSource] = useState({records: [], filters: {markets: [], products: []}});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const money = useCallback((amount, locale = language, compact = false) => formatMoney(amount, locale, compact), [language]);

    useFocusEffect(useCallback(() => {
        let active = true;
        setLoading(true);
        setError(false);
        loadDashboard(account?.id, route.params?.pantryId)
            .then((result) => {
                if (!active) return;
                setSource(result);
                setProductId((current) => current && result.filters.products.some((product) => product.key === current) ? current : result.filters.products[0]?.key ?? null);
                setMarketId((current) => current && !result.filters.markets.some((market) => market.id === current) ? null : current);
            })
            .catch((loadError) => {
                if (!active) return;
                if (loadError?.message === 'PANTRY_NOT_FOUND') {
                    navigation.navigate(AUTHENTICATED_ROUTES.DASHBOARD_PANTRY_PICKER);
                    return;
                }
                setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [account?.id, navigation, reloadKey, route.params?.pantryId]));

    const dashboard = useMemo(() => buildDashboard(source.records, {
        period, marketId, productId, locale: language
    }), [source.records, period, marketId, productId, language]);
    const handleNavigation = (key) => {
        if (key === 'dashboard') {
            navigation.navigate(AUTHENTICATED_ROUTES.DASHBOARD_PANTRY_PICKER);
            return;
        }
        if (key === 'pantry') navigation.navigate(AUTHENTICATED_ROUTES.PANTRIES); else if (key === 'shopping-list') navigation.navigate(AUTHENTICATED_ROUTES.GROCERY_PANTRY_PICKER); else if (key === 'profile') navigation.navigate(AUTHENTICATED_ROUTES.HOME, {section: 'pantry'});
    };

    const periodLabel = (key) => t(`dashboard.period.${PERIOD_KEYS[key]}`);
    const periodOptions = IS_DEMO_VARIANT ? DASHBOARD_PERIODS : DASHBOARD_PERIODS.filter((item) => item !== '12m');
    const percentText = dashboard.monthChangePercent == null ? t('dashboard.noComparison') : Math.abs(dashboard.monthChangePercent) < 0.5 ? t('dashboard.noChange') : t(dashboard.monthChangePercent > 0 ? 'dashboard.increased' : 'dashboard.decreased', {percent: Math.abs(dashboard.monthChangePercent).toFixed(0)});
    const priceChangeText = dashboard.priceChangePercent == null ? t('dashboard.noPriceComparison') : Math.abs(dashboard.priceChangePercent) < 0.5 ? t('dashboard.priceNoChange') : t(dashboard.priceChangePercent > 0 ? 'dashboard.priceIncreased' : 'dashboard.priceDecreased', {percent: Math.abs(dashboard.priceChangePercent).toFixed(0)});
    const priceProduct = source.filters.products.find((item) => item.key === productId);
    const filteredProducts = useMemo(() => {
        const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const query = normalize(productQuery.trim());
        return source.filters.products.filter((product) => normalize(productLabel(product)).includes(query));
    }, [source.filters.products, productQuery]);

    return (<Screen edges={['top', 'right', 'left']}>
        <Content>
            <Header>
                <HeaderAvatar $color={account?.avatarColor}/>
                <TitleArea>
                    <HeaderTitle>{t('dashboard.title')}</HeaderTitle>
                    <SummaryLabel>{route.params?.pantryName || t('dashboard.subtitle')}</SummaryLabel>
                </TitleArea>
            </Header>

            <FilterLabel>{t('dashboard.periodLabel')}</FilterLabel>
            <PeriodLabel>
                {periodOptions.map((item) => (<PeriodButton key={item} accessibilityRole="button"
                                                                accessibilityState={{selected: period === item}}
                                                                $selected={period === item}
                                                                onPress={() => setPeriod(item)}>
                    <SummaryLabel $selected={period === item}>{periodLabel(item)}</SummaryLabel>
                </PeriodButton>))}
            </PeriodLabel>

            <FilterLabel>{t('dashboard.marketLabel')}</FilterLabel>
            <FilterScroll horizontal showsHorizontalScrollIndicator={false}>
                <MarketFilterButton accessibilityRole="button" accessibilityState={{selected: marketId === null}}
                                    $selected={marketId === null} onPress={() => setMarketId(null)}>
                    <SummaryLabel $selected={marketId === null}>{t('dashboard.allMarkets')}</SummaryLabel>
                </MarketFilterButton>
                {source.filters.markets.map((market) => (<MarketFilterButton key={market.id} accessibilityRole="button"
                                                                             accessibilityState={{selected: marketId === market.id}}
                                                                             $selected={marketId === market.id}
                                                                             onPress={() => setMarketId(market.id)}>
                    <SummaryLabel $selected={marketId === market.id}
                                  numberOfLines={1}>{market.name}</SummaryLabel>
                </MarketFilterButton>))}
            </FilterScroll>
            {loading ?
                <StateContent><ActivityIndicator/><StateText>{t('dashboard.loading')}</StateText></StateContent> : null}
            {!loading && error ? <StateContent
                accessibilityRole="alert"><StateText>{t('dashboard.loadError')}</StateText><RetryButton
                accessibilityRole="button"
                onPress={() => setReloadKey((value) => value + 1)}><RetryLabel>{t('common.retry')}</RetryLabel></RetryButton></StateContent> : null}

            {!loading && !error ? <>
                <MetricRow>
                    <MetricCard $primary>
                        <MetricMain>
                            <MetricLabel $light>{t('dashboard.thisMonth')}</MetricLabel>
                            <MetricValue $light numberOfLines={1}
                                         adjustsFontSizeToFit>{money(dashboard.monthTotal)}</MetricValue>
                        </MetricMain>
                        <MetricLabel $light>{percentText}</MetricLabel>
                    </MetricCard>
                    <MetricCard>
                        <MetricMain>
                            <MetricLabel>{t('dashboard.latestPurchase')}</MetricLabel>
                            <MetricValue numberOfLines={1}
                                         adjustsFontSizeToFit>{dashboard.latest ? money(dashboard.latest.total) : '—'}</MetricValue>
                        </MetricMain>
                        <MetricLabel>{dashboard.latest ? formatDate(dashboard.latest.date, language) : t('dashboard.noPurchase')}</MetricLabel>
                    </MetricCard>
                    <MetricCard>
                        <MetricMain>
                            <MetricLabel>{t('dashboard.purchases')}</MetricLabel>
                            <MetricValue>{dashboard.purchaseCount}</MetricValue>
                        </MetricMain>
                        <MetricLabel>{periodLabel(period)}</MetricLabel>
                    </MetricCard>
                </MetricRow>

                <Card>
                    <CardHeader><ChartTitle>{t('dashboard.expensesTitle')}</ChartTitle><SummaryValue>{money(dashboard.total, language, true)}</SummaryValue></CardHeader>
                    <ChartHint>{t('dashboard.expensesHint', {period: periodLabel(period).toLowerCase()})}</ChartHint>
                    <ExpenseChart data={dashboard.expenses} width={contentWidth} language={language} money={money}
                                  emptyLabel={t('dashboard.emptyChart')}/>
                </Card>

                <Card>
                    <CardHeader><ChartTitle>{t('dashboard.categoriesTitle')}</ChartTitle><SummaryValue>{money(dashboard.categoryTotal, language, true)}</SummaryValue></CardHeader>
                    <CategoryChart data={dashboard.categories} total={dashboard.categoryTotal}
                                   emptyLabel={t('dashboard.emptyCategories')} t={t} language={language}
                                   colors={theme.colors}/>
                </Card>

                <Card>
                    <CardHeader><ChartTitle>{t('dashboard.priceTitle')}</ChartTitle></CardHeader>
                    <ChartHint>{t('dashboard.priceHint')}</ChartHint>
                    <ProductSelect accessibilityRole="button" accessibilityLabel={t('dashboard.selectProduct')}
                                   disabled={!source.filters.products.length} onPress={() => {
                        setProductQuery('');
                        setProductPickerOpen(true);
                    }}>
                        <ProductSelectText
                            numberOfLines={1}>{priceProduct ? productLabel(priceProduct) : t('dashboard.noProducts')}</ProductSelectText>
                        <ProductSelectText>⌄</ProductSelectText>
                    </ProductSelect>
                    {priceProduct ?
                        <ChartHint>{priceProduct.contentValue ? `${priceProduct.contentValue}${priceProduct.unit || ''} · ` : ''}{priceChangeText}</ChartHint> : null}
                    <PriceChart data={dashboard.prices} width={contentWidth} emptyLabel={t('dashboard.emptyPrices')}
                                money={money}/>
                </Card>

                {dashboard.priceHighlights.length > 0 ? <Section>
                    <HighlightIntro>
                        <ChartTitle>{t('dashboard.highlightsTitle')}</ChartTitle>
                        <HighlightHint>{t('dashboard.highlightsHint')}</HighlightHint>
                    </HighlightIntro>
                    {dashboard.priceHighlights.map((item) => (<InsightCard key={item.key}>
                        <InsightHeader><InsightName $flex
                                                    numberOfLines={2}>{productLabel(item)}</InsightName><InsightBadge
                            $increase={item.changePercent > 0}><InsightBadgeText
                            $increase={item.changePercent > 0}>{t(item.changePercent > 0 ? 'dashboard.highlightUp' : 'dashboard.highlightDown', {percent: Math.abs(item.changePercent).toFixed(0)})}</InsightBadgeText></InsightBadge></InsightHeader>
                        <InsightValues>
                            <InsightValueGroup><InsightText>{t('dashboard.firstPrice')}</InsightText><InsightPrice>{money(item.firstPrice)}</InsightPrice></InsightValueGroup>
                            <InsightValueGroup><InsightText>{t('dashboard.latestPrice')}</InsightText><InsightPrice>{money(item.latestPrice)}</InsightPrice></InsightValueGroup>
                        </InsightValues>
                    </InsightCard>))}
                </Section> : null}
            </> : null}
        </Content>
        <Modal visible={productPickerOpen} transparent animationType="slide"
               onRequestClose={() => setProductPickerOpen(false)}>
            <ProductModalBackdrop $bottomInset={insets.bottom}><ProductModalSheet>
                <ProductModalHeader><ProductModalTitle>{t('dashboard.selectProduct')}</ProductModalTitle><ModalActionButton
                    Icon={CancelCircleIcon} variant="cancel" accessibilityLabel={t('dashboard.close')}
                    onPress={() => setProductPickerOpen(false)}/></ProductModalHeader>
                <SearchField value={productQuery} onChangeText={setProductQuery}
                             placeholder={t('dashboard.searchProduct')}/>
                <FlatList data={filteredProducts} keyExtractor={(item) => item.key}
                          keyboardShouldPersistTaps="handled"
                          ListEmptyComponent={<ChartEmpty>{t('dashboard.noProductResults')}</ChartEmpty>}
                          renderItem={({item}) => <ProductOption accessibilityRole="button"
                                                                 accessibilityState={{selected: item.key === productId}}
                                                                 $selected={item.key === productId} onPress={() => {
                              setProductId(item.key);
                              setProductPickerOpen(false);
                          }}><ProductOptionText
                              numberOfLines={2}>{productLabel(item)}</ProductOptionText>{item.key === productId ?
                              <ProductSelectText>✓</ProductSelectText> : null}</ProductOption>}/>
            </ProductModalSheet></ProductModalBackdrop>
        </Modal>
        <Navbar activeItem="dashboard" onItemChange={handleNavigation}/>
    </Screen>);
}

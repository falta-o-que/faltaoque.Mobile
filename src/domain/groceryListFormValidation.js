import {isTodayOrFutureDate} from './dateValidation';

export function validateGroceryListForm({name, plannedDate, marketQuery, selectedMarket}) {
    if (!String(name ?? '').trim()) return {field: 'name', messageKey: 'shoppingModal.listNameError'};
    if (plannedDate && !isTodayOrFutureDate(plannedDate)) return {field: 'plannedDate', messageKey: 'shoppingModal.dateError'};
    if (String(marketQuery ?? '').trim() && !selectedMarket) return {field: 'market', messageKey: 'shoppingModal.marketError'};
    return null;
}

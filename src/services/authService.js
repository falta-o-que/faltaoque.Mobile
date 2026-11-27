import {clearSession, getSession, saveSession} from '../repositories/sessionRepository';

function normalizeAvatarColor(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function apiUrl() {
    const url = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('API_NOT_CONFIGURED');
    return url;
}

async function request(path, {method = 'GET', body, token} = {}) {
    const response = await fetch(`${apiUrl()}${path}`, {
        method,
        headers: {'Accept': 'application/json', ...(body ? {'Content-Type': 'application/json'} : {}),
            ...(token ? {Authorization: `Bearer ${token}`} : {})},
        ...(body ? {body: JSON.stringify(body)} : {}),
    });
    if (!response.ok) {
        const error = new Error('API_REQUEST_FAILED');
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function validUser(user) {
    return user && typeof user.id === 'string' && user.id && typeof user.name === 'string' &&
        typeof user.email === 'string' && user.isActive !== false;
}

function normalizeExpiration(value) {
    if (typeof value !== 'string') return null;
    const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        const utc = Date.UTC(+year, +month - 1, +day, +hour + 3, +minute, +second);
        const local = new Date(utc - 3 * 60 * 60 * 1000);
        if (local.getUTCFullYear() !== +year || local.getUTCMonth() !== +month - 1 ||
            local.getUTCDate() !== +day || local.getUTCHours() !== +hour ||
            local.getUTCMinutes() !== +minute || local.getUTCSeconds() !== +second) return null;
        return new Date(utc).toISOString();
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
    const utc = Date.parse(value);
    return Number.isFinite(utc) ? new Date(utc).toISOString() : null;
}

async function publicAccount(user) {
    if (!validUser(user)) throw new Error('INVALID_API_RESPONSE');
    const colors = await request('/colors');
    if (!Array.isArray(colors)) throw new Error('COLOR_CATALOG_UNAVAILABLE');
    const matches = colors.filter((color) => color?.id === user.avatar && /^#[0-9a-f]{6}$/i.test(color.hexCode));
    if (matches.length !== 1) throw new Error('AVATAR_COLOR_UNAVAILABLE');
    return {id: user.id, name: user.name, email: user.email, avatarColor: matches[0].hexCode.toUpperCase()};
}

export async function login({email, password}) {
    let result;
    try {
        result = await request('/auth/login', {method: 'POST', body: {email: email.trim().toLowerCase(), password}});
    } catch (error) {
        if (error.status === 401) throw new Error('INVALID_CREDENTIALS');
        if (error.status === 404) throw new Error('LOGIN_ENDPOINT_UNAVAILABLE');
        throw error;
    }
    const expiration = normalizeExpiration(result?.expiration);
    if (typeof result?.token !== 'string' || !result.token || !validUser(result.user) ||
        !expiration || Date.parse(expiration) <= Date.now()) throw new Error('INVALID_API_RESPONSE');
    const account = await publicAccount(result.user);
    await saveSession({token: result.token, account, expiration});
    return account;
}

export async function register({name, email, avatarColor, password}) {
    const colors = await request('/colors');
    if (!Array.isArray(colors)) throw new Error('COLOR_CATALOG_UNAVAILABLE');
    const matches = colors.filter((color) => Number.isInteger(color?.id) && color.id > 0 &&
        normalizeAvatarColor(color.hexCode) && normalizeAvatarColor(color.hexCode) === normalizeAvatarColor(avatarColor));
    if (matches.length !== 1) throw new Error('AVATAR_COLOR_UNAVAILABLE');
    let user;
    try {
        user = await request('/auth/sign-up', {method: 'POST', body: {
            name: name.trim(), email: email.trim().toLowerCase(), password, avatar: matches[0].id,
        }});
    } catch (error) {
        if (error.status === 409) throw new Error('EMAIL_ALREADY_EXISTS');
        throw error;
    }
    if (!validUser(user)) throw new Error('ACCOUNT_CREATED_SESSION_FAILED');
    try {
        return await login({email, password});
    } catch {
        throw new Error('ACCOUNT_CREATED_SESSION_FAILED');
    }
}

export async function restoreSession() {
    const session = await getSession();
    if (!session) return null;
    if (Date.parse(session.expiration) <= Date.now()) {
        await clearSession();
        return null;
    }
    let user;
    try {
        user = await request(`/users/${encodeURIComponent(session.account.id)}`, {token: session.token});
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            await clearSession();
            return null;
        }
        throw error;
    }
    if (!validUser(user) || user.id !== session.account.id) throw new Error('INVALID_API_RESPONSE');
    return publicAccount(user);
}

export async function updateProfile() {
    // The API requires a password on every update; profile integration is a separate flow.
    throw new Error('PROFILE_API_UNAVAILABLE');
}

export async function logout() {
    await clearSession();
}

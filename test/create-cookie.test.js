import { expect, test } from 'vitest'
import {encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {Narvik} from "../src/index.ts";
import {defaultDeleteSession, defaultFetchSession, defaultUpdateSessionExpiry} from "./data/config/defaultSessionFunctions.js";

test('Create cookie from session with default config', async () => {

    const defaultSessionExpiryMs = 2592000000; // 30 days

    const sessionToken = 'session-token';

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.createCookie(sessionToken);
    expect(result.name).toBe(narvik.cookieName);
    expect(result.value).toBe(sessionToken);
    expect(result.attributes.httpOnly).toBe(true);
    expect(result.attributes.secure).toBe(true);
    expect(result.attributes.domain).toBeUndefined
    expect(result.attributes.path).toBeUndefined
    expect(result.attributes.sameSite).toBe('lax')
    expect(result.attributes.maxAge).greaterThan((defaultSessionExpiryMs / 1000) - 10000);
    expect(result.attributes.maxAge).lessThanOrEqual(defaultSessionExpiryMs / 1000);

    const serializedValue = result.serialize()
    expect(serializedValue).toBe(`narvik_session=session-token; Max-Age=2592000; Path=/; SameSite=Lax; Secure; HttpOnly`)
})

test('Create cookie from session with custom configuration', async () => {

    const sessionToken = 'session-token';

    const config = {
        data: {
            saveSession: defaultFetchSession,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        },
        session: {
            sessionExpiresInMs: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
        cookie: {
            name: 'example-cookie',
            attributes: {
                secure: false,
                domain: 'example.com',
                path: '/example',
                sameSite: 'lax'
            }
        }
    }

    const narvik = new Narvik(config);

    let result = await narvik.createCookie(sessionToken);
    expect(result.name).toBe(narvik.cookieName);
    expect(result.name).toBe(config.cookie.name);
    expect(result.value).toBe(sessionToken);
    expect(result.attributes.httpOnly).toBe(true);
    expect(result.attributes.secure).toBe(config.cookie.attributes.secure);
    expect(result.attributes.domain).toBe(config.cookie.attributes.domain)
    expect(result.attributes.path).toBe(config.cookie.attributes.path)
    expect(result.attributes.sameSite).toBe(config.cookie.attributes.sameSite)
    expect(result.attributes.maxAge).greaterThan((config.session.sessionExpiresInMs / 1000) - 10000);
    expect(result.attributes.maxAge).lessThanOrEqual(config.session.sessionExpiresInMs / 1000);

    const serializedValue = result.serialize()
    expect(serializedValue).toBe(`example-cookie=session-token; Domain=example.com; Max-Age=604800; Path=/example; SameSite=Lax; HttpOnly`)
})

test('Serialize cookies after modifying cookie values to cover edge cases', async () => {

    const sessionToken = 'session-token';

    const config = {
        data: {
            saveSession: defaultFetchSession,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        },
        session: {
            sessionExpiresInMs: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
        cookie: {
            name: 'example-cookie',
            attributes: {
                secure: false,
                domain: 'example.com',
                path: '/example',
                sameSite: 'lax'
            }
        }
    }

    const narvik = new Narvik(config);

    let result = await narvik.createCookie(sessionToken);

    const serializedValue = result.serialize()
    expect(serializedValue).toBe(`example-cookie=session-token; Domain=example.com; Max-Age=604800; Path=/example; SameSite=Lax; HttpOnly`)

    result.attributes.httpOnly = false;
    const serializedValueWithModifiedHttpOnlyValue = result.serialize()
    expect(serializedValueWithModifiedHttpOnlyValue).toBe(`example-cookie=session-token; Domain=example.com; Max-Age=604800; Path=/example; SameSite=Lax`)

    result.attributes.sameSite = undefined;
    const serializedValueWithModifiedSameSiteValue = result.serialize()
    expect(serializedValueWithModifiedSameSiteValue).toBe(`example-cookie=session-token; Domain=example.com; Max-Age=604800; Path=/example`)

})

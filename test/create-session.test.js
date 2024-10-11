import { expect, test } from 'vitest'
import {encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {Narvik} from "../src/index.ts";
import {defaultDeleteSession, defaultFetchSession, defaultUpdateSessionExpiry} from "./data/config/defaultSessionFunctions.js";

test('Create session with default session expiry configuration', async () => {
    const userId = 'userId';
    let sessionExpiry = 2592000000; // 30 days - default

    let sessionId = '';
    let expiresAt = undefined

    const saveSessionFunction = async (session) => {
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        sessionId = session.id;
        expect(session.userId).toBe(userId);
        expect(session.expiresAt).toBeDefined();
        expect(session.expiresAt - Date.now()).toBeGreaterThan(sessionExpiry - 10000);
        expect(session.expiresAt - Date.now()).toBeLessThanOrEqual(sessionExpiry);
        expiresAt = session.expiresAt;

        /*
        These are undefined because they are not saved in the session.
        They are only used to indicate the state of the session as it is created or updated.
         */
        expect(session.new).toBeUndefined();
        expect(session.extended).toBeUndefined();
    }

    const narvik = new Narvik({
        data: {
            saveSession: saveSessionFunction,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.createSession(userId);
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.session.new).toBe(true);
    expect(result.session.id).toBe(encodeHexLowerCase(sha256(new TextEncoder().encode(result.token))));
    expect(result.session.userId).toBe(userId);
    expect(result.session.expiresAt).toBe(expiresAt);
})

test('Create session with custom session expiry configuration', async () => {
    const userId = 'userId';
    const sessionExpiry = 1000 * 60 * 60 * 24 * 7; // 7 days

    let sessionId = '';
    let expiresAt = undefined

    const saveSessionFunction = async (session) => {
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        sessionId = session.id;
        expect(session.userId).toBe(userId);
        expect(session.expiresAt).toBeDefined();
        expect(session.expiresAt - Date.now()).toBeGreaterThan(sessionExpiry - 10000);
        expect(session.expiresAt - Date.now()).toBeLessThanOrEqual(sessionExpiry);
        expiresAt = session.expiresAt;

        /*
        These are undefined because they are not saved in the session.
        They are only used to indicate the state of the session as it is created or updated.
         */
        expect(session.new).toBeUndefined();
        expect(session.extended).toBeUndefined();
    }

    const narvik = new Narvik({
        data: {
            saveSession: saveSessionFunction,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        },
        session: {
            sessionExpiresInMs: sessionExpiry
        }
    });

    const result = await narvik.createSession(userId);
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.session.new).toBe(true);
    expect(result.session.id).toBe(encodeHexLowerCase(sha256(new TextEncoder().encode(result.token))));
    expect(result.session.userId).toBe(userId);
    expect(result.session.expiresAt).toBe(expiresAt);
})
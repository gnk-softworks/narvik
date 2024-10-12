import { expect, test } from 'vitest'
import {encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {Narvik, Session} from "../src";
import {
    defaultDeleteSession,
    defaultFetchSession,
    defaultSaveSession,
    defaultUpdateSessionExpiry
} from "./data/config/defaultSessionFunctions.js";

test('Create session with default session expiry configuration', async () => {
    const userId = 'userId';
    let sessionExpiry = 2592000000; // 30 days - default

    let sessionId = '';
    let expiresAt = undefined

    const saveSessionFunction = async (session: Session): Promise<void> => {
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        sessionId = session.id;
        expect(session.userId).toBe(userId);
        expect(session.expiresAt).toBeDefined();
        expect(session.expiresAt.getTime() - Date.now()).toBeGreaterThan(sessionExpiry - 10000);
        expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(sessionExpiry);
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

    const saveSessionFunction = async (session: Session): Promise<void> => {
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        sessionId = session.id;
        expect(session.userId).toBe(userId);
        expect(session.expiresAt).toBeDefined();
        expect(session.expiresAt.getTime() - Date.now()).toBeGreaterThan(sessionExpiry - 10000);
        expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(sessionExpiry);
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


test('Validate Session - not renewed as over half of length left', async () => {

    const testSessionToken = 'testSessionToken';
    const testSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testSessionToken)));
    const testUserId = 'testUserId';
    const testExpiresAt = new Date(Date.now() + 1728000000); // 20 days in the future

    function fetchSession(sessionId: string): Promise<Session | null> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve({
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        })
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultSaveSession,
            fetchSession: fetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.validateSession(testSessionToken);
    expect(result).toBeDefined();

    expect(result.id).toBe(testSessionId);
    expect(result.userId).toBe(testUserId);
    expect(result.expiresAt).toBe(testExpiresAt);
    expect(result.extended).toBeUndefined();
    expect(result.new).toBeUndefined();
})

test('Validate Session - not renewed as less half of session length left', async () => {
    const defaultSessionExpiry = 2592000000; // 30 days

    const testSessionToken = 'testSessionToken';
    const testSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testSessionToken)));
    const testUserId = 'testUserId';
    const testExpiresAt = new Date(Date.now() + 864000000); // 10 days in the future

    let extendedExpiresAt = undefined
    function fetchSession(sessionId: string): Promise<Session | null> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve({
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        })
    }

    function updateSessionExpiry(sessionId: String, updatedExpiresAt: Date): Promise<void> {
        expect(sessionId).toBe(testSessionId);
        expect(updatedExpiresAt.getTime() - Date.now()).toBeGreaterThan(defaultSessionExpiry - 10000);
        expect(updatedExpiresAt.getTime() - Date.now()).toBeLessThanOrEqual(defaultSessionExpiry);
        extendedExpiresAt = updatedExpiresAt;
        return Promise.resolve();
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultSaveSession,
            fetchSession: fetchSession,
            updateSessionExpiry: updateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.validateSession(testSessionToken);
    expect(result).toBeDefined();

    expect(result.id).toBe(testSessionId);
    expect(result.userId).toBe(testUserId);
    expect(result.expiresAt).toBe(extendedExpiresAt);
    expect(result.extended).toBe(true);
    expect(result.new).toBeUndefined();
})

test('Validate Session - null as session expired', async () => {
    const testSessionToken = 'testSessionToken';
    const testSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testSessionToken)));
    const testUserId = 'testUserId';
    const testExpiresAt = new Date(Date.now() - 1000); // 1 second in the past

    function fetchSession(sessionId: string): Promise<Session | null> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve({
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        })
    }

    function deleteSession(sessionId: string): Promise<void> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve();
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultSaveSession,
            fetchSession: fetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: deleteSession
        }
    });

    const result = await narvik.validateSession(testSessionToken);
    expect(result).toBeNull();
})

test('Validate Session - null as no session found', async () => {
    const testSessionToken = 'testSessionToken';
    const testSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testSessionToken)));

    function fetchSession(sessionId: string): Promise<Session | null> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve(null);
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultSaveSession,
            fetchSession: fetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.validateSession(testSessionToken);
    expect(result).toBeNull();
})


test('Invalidate Session', async () => {
    const testSessionId = "session-id"

    function deleteSession(sessionId:string): Promise<void> {
        expect(sessionId).toBe(testSessionId);
        return Promise.resolve();
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultSaveSession,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: deleteSession
        }
    });

    await narvik.invalidateSession(testSessionId);
})

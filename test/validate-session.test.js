import { expect, test } from 'vitest'
import {encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {Narvik} from "../src/index.ts";
import {defaultDeleteSession, defaultFetchSession, defaultUpdateSessionExpiry} from "./data/config/defaultSessionFunctions.js";

test('Validate Session - not renewed as over half of length left', async () => {

    const testSessionToken = 'testSessionToken';
    const testSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testSessionToken)));
    const testUserId = 'testUserId';
    const testExpiresAt = new Date(Date.now() + 1728000000); // 20 days in the future

    function fetchSession(sessionId){
        expect(sessionId).toBe(testSessionId);
        return {
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        }
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
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
    function fetchSession(sessionId){
        expect(sessionId).toBe(testSessionId);
        return {
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        }
    }

    function updateSessionExpiry(sessionId, updatedExpiresAt) {
        expect(sessionId).toBe(testSessionId);
        expect(updatedExpiresAt - Date.now()).toBeGreaterThan(defaultSessionExpiry - 10000);
        expect(updatedExpiresAt - Date.now()).toBeLessThanOrEqual(defaultSessionExpiry);
        extendedExpiresAt = updatedExpiresAt;
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
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

    function fetchSession(sessionId){
        expect(sessionId).toBe(testSessionId);
        return {
            id: testSessionId,
            userId: testUserId,
            expiresAt: testExpiresAt
        }
    }

    function deleteSession(sessionId) {
        expect(sessionId).toBe(testSessionId);
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
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

    function fetchSession(sessionId){
        expect(sessionId).toBe(testSessionId);
        return null;
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
            fetchSession: fetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const result = await narvik.validateSession(testSessionToken);
    expect(result).toBeNull();
})
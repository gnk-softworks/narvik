import { expect, test } from 'vitest'
import {Narvik, Session} from "../src";
import {
    defaultDeleteSession,
    defaultUpdateSessionExpiry
} from "./data/config/defaultSessionFunctions.js";

declare module '../src' {
    interface Session {
        customField?: string;
    }
}

test('Create and validate custom session with default session expiry', async () => {
    const userId = 'userId';
    let sessionExpiry = 2592000000; // 30 days - default
    let customSession: Session | undefined = undefined;

    const saveSessionFunction = async (session: Session): Promise<void> => {
        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        expect(session.userId).toBe(userId);
        expect(session.expiresAt).toBeDefined();
        expect(session.expiresAt.getTime() - Date.now()).toBeGreaterThan(sessionExpiry - 10000);
        expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(sessionExpiry);

        /*
        These are undefined because they are not saved in the session.
        They are only used to indicate the state of the session as it is created or updated.
         */
        expect(session.new).toBeUndefined();
        expect(session.extended).toBeUndefined();

        /*
        This is a custom field that is saved in the session as part of the saveSessionFunction.
         */
        session.customField = 'customValue';
        expect(session.customField).toBe('customValue');
        customSession = session;
    }

    const fetchSessionFunction = async (sessionId: string): Promise<Session | null> => {
        expect(sessionId).toBe(sessionId);
        return customSession;
    }

    const narvik = new Narvik({
        data: {
            saveSession: saveSessionFunction,
            fetchSession: fetchSessionFunction,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: defaultDeleteSession
        }
    });

    const createSessionResult = await narvik.createSession(userId);
    expect(createSessionResult.session).toBe(customSession);
    // This is the custom field that was saved in the session.
    expect(createSessionResult.session.customField).toBe('customValue');

    const validateSessionResult = await narvik.validateSession(createSessionResult.token);
    expect(validateSessionResult).toBeDefined();
    expect(validateSessionResult).toBe(customSession);
    expect(validateSessionResult.customField).toBe('customValue');
})

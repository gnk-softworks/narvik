/*
This test serves as an example of how to create an adapter for the Narvik
library. The adapter is designed to store session data in memory and implements
the NarvikDataConfiguration interface, which defines the required methods for
interacting with the session data store. A Map is used by the adapter to manage
session data in memory. The `numberOfSessions` method is only used for testing purposes.
 */

import {assert, expect, test} from 'vitest'
import {Narvik, NarvikDataConfiguration, Session} from "../src";

class TestInMemoryDatastoreAdapter implements NarvikDataConfiguration {
    private sessions: Map<string, Session> = new Map<string, Session>();

    saveSession = async (session: Session): Promise<void> => {
        this.sessions.set(session.id, session);
    }

    fetchSession = async (sessionId: string): Promise<Session | null> => {
        return this.sessions.get(sessionId) ?? null;
    }

    updateSessionExpiry = async (sessionId: string, updatedExpiresAt: Date): Promise<void> =>{
        const session = this.sessions.get(sessionId);
        if (session) {
            session.expiresAt = updatedExpiresAt;
        }
    }

    deleteSession = async (sessionId: string): Promise<void> =>{
        this.sessions.delete(sessionId);
    }

    fetchSessionsForUser = async (userId: string): Promise<Session[]> =>{
        return Array.from(this.sessions.values()).filter(session => session.userId === userId);
    }

    deleteSessionsForUser = async (userId: string): Promise<void> => {
        const sessions = Array.from(this.sessions.values()).filter(session => session.userId === userId);
        sessions.forEach(session => this.sessions.delete(session.id));
    }

    deleteAllExpiredSessions = async (): Promise<void> => {
        const now = new Date();
        const sessions = Array.from(this.sessions.values()).filter(session => session.expiresAt < now);
        sessions.forEach(session => this.sessions.delete(session.id));
    }

    //helper functions for testing
    numberOfSessions(): number {
        return this.sessions.size;
    }
}

const adapter = new TestInMemoryDatastoreAdapter();
const narvik = new Narvik({
    data: adapter,
    session: {
        sessionExpiresInMs: 7 * 24 * 60 * 60 * 1000
    }
});


test('Validate basic functions', async () => {

    const authenticatedUser = {
        id: 'userId',
    }

    expect(narvik).toBeDefined();
    expect(adapter.numberOfSessions()).toBe(0);

    const createResult = await narvik.createSession(authenticatedUser.id);
    expect(adapter.numberOfSessions()).toBe(1);
    expect(createResult.token).toBeDefined();
    expect(createResult.session).toBe(await adapter.fetchSession(createResult.session.id));

    const validateSession = await narvik.validateSession(createResult.token);
    assert(validateSession !== null);
    expect(validateSession).toBe(await adapter.fetchSession(validateSession.id));

    const updatedExpiry = new Date();
    updatedExpiry.setDate(updatedExpiry.getDate() + 1);
    await adapter.updateSessionExpiry(validateSession.id, updatedExpiry);

    const revalidateSession = await narvik.validateSession(createResult.token);
    assert(revalidateSession !== null);
    expect(revalidateSession).toBe(await adapter.fetchSession(revalidateSession.id));
    expect(revalidateSession.expiresAt.getTime()).toBeGreaterThan( Date.now() + 7 * 24 * 60 * 60 * 1000 - 10000);
    expect(revalidateSession.expiresAt.getTime()).toBeLessThanOrEqual( Date.now() + 7 * 24 * 60 * 60 * 1000);

    await narvik.invalidateSession(createResult.session.id);
    expect(adapter.numberOfSessions()).toBe(0);
})

test('Validate Fetch and Delete all sessions for users', async () => {

    const authenticatedUser = {
        id: 'userId',
    }

    expect(narvik).toBeDefined();
    expect(adapter.numberOfSessions()).toBe(0);

    await narvik.createSession(authenticatedUser.id);
    await narvik.createSession(authenticatedUser.id);
    await narvik.createSession(authenticatedUser.id);

    expect(adapter.numberOfSessions()).toBe(3);
    const userSessions = await narvik.fetchSessionsForUser(authenticatedUser.id);
    expect(userSessions.length).toBe(3);

    await narvik.deleteSessionsForUser(authenticatedUser.id);
    expect(adapter.numberOfSessions()).toBe(0);
})

test('Validate delete all expired sessions', async () => {

    const authenticatedUser = {
        id: 'userId',
    }

    expect(narvik).toBeDefined();
    expect(adapter.numberOfSessions()).toBe(0);

    let sessionToExpire = await narvik.createSession(authenticatedUser.id);
    await narvik.createSession(authenticatedUser.id);
    await narvik.createSession(authenticatedUser.id);

    expect(adapter.numberOfSessions()).toBe(3);

    sessionToExpire.session.expiresAt = new Date(Date.now() - 1000);
    await adapter.saveSession(sessionToExpire.session);

    await narvik.deleteAllExpiredSessions();
    expect(adapter.numberOfSessions()).toBe(2);
})

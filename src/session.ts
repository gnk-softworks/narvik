import {encodeHexLowerCase} from "@oslojs/encoding";
import {sha256} from "@oslojs/crypto/sha2";
import {Session} from "./index.js";

async function create(
    token: string,
    userId: string,
    sessionExpiresInMs: number,
    saveSession: (session: Session) => Promise<void>
): Promise<Session> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + sessionExpiresInMs)
    };
    await saveSession(session);
    session.new = true;
    return session;
}

async function validate(
    token: string,
    sessionExpiresInMs: number,
    fetchSession: (sessionId: string) => Promise<Session | null>,
    updateSessionExpiry: (sessionId: string, updateExpiresAt: Date) => Promise<void>,
    deleteSession: (sessionId: string) => Promise<void>
): Promise<Session | null> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session = await fetchSession(sessionId);

    if (session === null) {
        return null;
    }

    if (Date.now() >= session.expiresAt.getTime()) {
        await deleteSession(sessionId);
        return null;
    }
    if (Date.now() >= session.expiresAt.getTime() - (sessionExpiresInMs / 2)) {
        session.expiresAt = new Date(Date.now() + sessionExpiresInMs);
        await updateSessionExpiry(sessionId, session.expiresAt);
        session.extended = true;
    }
    return session;
}

async function invalidate(
    sessionId: string,
    deleteSession: (sessionId: string) => Promise<void>
): Promise<void> {
    await deleteSession(sessionId);
}

export default {create, validate, invalidate};
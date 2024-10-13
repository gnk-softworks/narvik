import {Session} from "../../../src";

export function defaultSaveSession(session: Session): Promise<void> {
    throw new Error('Function not expected.');
}

export function defaultFetchSession(sessionId: string): Promise<Session | null> {
    throw new Error('Function not expected.');
}

export function defaultUpdateSessionExpiry(sessionId: string, updateExpiresAt: Date): Promise<void> {
    throw new Error('Function not expected.');
}

export function defaultDeleteSession(sessionId: string): Promise<void> {
    throw new Error('Function not expected.');
}

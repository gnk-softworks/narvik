import sessions from "./session.js";
import cookies from "./cookie.js";
import {generateRandomToken} from "./token.js";

export interface NarvikConfiguration {
    data: NarvikDataConfiguration;
    session?: NarvikSessionConfiguration;
    cookie?: NarvikCookieConfiguration;
}

export interface NarvikDataConfiguration {
    saveSession: (session: Session) => Promise<void>;
    fetchSession: (sessionId: string) => Promise<Session | null>;
    updateSessionExpiry: (sessionId: string, updateExpiresAt: Date) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    fetchSessionsForUser?: (userId: string) => Promise<Session[]>;
    deleteSessionsForUser?: (userId: string) => Promise<void>;
    deleteAllExpiredSessions?: () => Promise<void>;
}

export interface NarvikSessionConfiguration {
    sessionExpiresInMs?: number;
}
export interface NarvikCookieConfiguration {
    name?: string;
    cookieExpiresInMs?: number;
    attributes?: NarvikCookieAttributesConfiguration;
}

export interface NarvikCookieAttributesConfiguration {
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
}

export interface AdditionalSessionData {}

export interface Session extends AdditionalSessionData {
    id: string;
    userId: string;
    expiresAt: Date;
    new?: boolean;
    extended?: boolean;
}

export class Cookie {
    public name: string;
    public value: string;
    public attributes: CookieAttributes;

    constructor(name: string, value: string, attributes: CookieAttributes) {
        this.name = name;
        this.value = value;
        this.attributes = attributes;
    }

    public serialize(): string {
        return cookies.serialize(this.name, this.value, this.attributes);
    }
}

export interface CookieAttributes {
    httpOnly?: boolean;
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: "none" | "lax" | "strict";
    maxAge?: number;
}

export interface CreateSessionResult {
    token: string;
    session: Session;
}

export class Narvik {

    private data: NarvikDataConfiguration;

    private readonly sessionExpiresInMs: number;
    private readonly cookieExpiresInMs: number;
    public readonly cookieName: string;
    private readonly coreCookieAttributes: CookieAttributes;

    constructor(config: NarvikConfiguration) {
        this.data = config.data;
        this.sessionExpiresInMs = config?.session?.sessionExpiresInMs ?? 2592000000;
        this.cookieExpiresInMs = config?.cookie?.cookieExpiresInMs ?? this.sessionExpiresInMs;
        this.cookieName = config?.cookie?.name ?? "narvik_session";
        this.coreCookieAttributes = {
            httpOnly: true,
            secure: true,
            path: "/",
            sameSite: "lax",
            ...config?.cookie?.attributes
        };
    }

    public async createSession(userId: string, additionalData?: AdditionalSessionData): Promise<CreateSessionResult> {
        const sessionToken = generateRandomToken();
        const session = await sessions.create(sessionToken, userId, this.sessionExpiresInMs, this.data.saveSession, additionalData);
        return { token: sessionToken, session };
    }

    public async validateSession(token: string): Promise<Session | null> {
        return await sessions.validate(token, this.sessionExpiresInMs, this.data.fetchSession, this.data.updateSessionExpiry, this.data.deleteSession);
    }

    public async invalidateSession(sessionId: string): Promise<void> {
        return await sessions.invalidate(sessionId, this.data.deleteSession);
    }

    public async fetchSessionsForUser(userId: string): Promise<Session[]> {
        if (!this.data.fetchSessionsForUser) {
            throw new Error("fetchSessionsForUser callback provided in configuration");
        }
        return await this.data.fetchSessionsForUser(userId);
    }

    public async deleteSessionsForUser(userId: string): Promise<void> {
        if (!this.data.deleteSessionsForUser) {
            throw new Error("deleteSessionsForUser callback provided in configuration");
        }
        return await this.data.deleteSessionsForUser(userId);
    }

    public async deleteAllExpiredSessions(): Promise<void> {
        if (!this.data.deleteAllExpiredSessions) {
            throw new Error("deleteAllExpiredSessions callback provided in configuration");
        }
        return await this.data.deleteAllExpiredSessions();
    }

    public createCookie(sessionToken: string): Cookie {
        return cookies.create(this.cookieName, sessionToken, this.coreCookieAttributes, this.cookieExpiresInMs);
    }

    public createBlankCookie(): Cookie {
        return cookies.createBlank(this.cookieName, this.coreCookieAttributes);
    }
}

---
title: "Getting Started - Setup"
---

# Getting Started - Setup

## Installation

To install Narvik from NPM, run:

```bash
npm i narvik
```

## Configuration

### Data Management Callbacks

The basic configuration requires only that you provide functions for managing basic session operations in your data store.

```ts
export const narvik = new Narvik({
    data: {
        saveSession: async (session: Session): Promise<void> => {
            // Save the session to your database
        },
        fetchSession: async (sessionId: string): Promise<Session | null>  => {
            // Fetch the session from your database
        },
        updateSessionExpiry: async (sessionId: string, updateExpiresAt: Date): Promise<void>  => {
            // Update the session expiry in your database
        },
        deleteSession: async (sessionId: string): Promise<void>  => {
            // Delete the session from your database
        }
    },
});
```
You can also provide three additional "optional" callbacks that enable you to perform additional session management functions:

```ts
export const narvik = new Narvik({
    data: {
        //as above
        fetchSessionsForUser: async (userId: string): Promise<Session[]> => {
            // Enables the 'fetchSessionsForUser' on Narvik - Used to Fetch all sessions for a user from your database
        },
        deleteSessionsForUser: async (userId: string): Promise<void> => {
            // Enables the 'deleteSessionsForUser' on Narvik - Used to Delete all sessions for a user from your database
        },
        deleteAllExpiredSessions: (): Promise<void> => {
            // Enables the 'deleteAllExpiredSessions' on Narvik - Used to Delete all expired sessions from your database. Some databases offer built-in TTL functionality that can handle this automatically which may be preferable.
        }
    }
});
```
For more information on these callbacks, see the [Session Storage](/documentation/session-storage) page.

### Session & Cookie Configuration

You can also provide additional configuration options for sessions and cookies.
```ts
export const narvik = new Narvik({
    data: {
        //as above
    },
    session: { //Optional - Session configuration
        sessionExpiresInMs: 1000 * 60 * 60 * 24 * 7, //Optional - Desired session length in ms. Default is 30 Days - here value is 1 week
    },
    cookie: { //Optional - Cookie configuration
        name: "your-app-session", //Optional - Session cookie name. Default is "narvik_session"
        cookieExpiresInMs: 1000 * 60 * 60 * 24 * 7, //Optional - Desired cookie length in ms. Default is same as "sessionExpiresInMs" - here value is 1 week
        attributes: {
            secure: true, //Optional - Default true - set to true for https, set to false for http
            domain: "example.com", //Optional - Domain attribute. Default is not set
            path: "/", //Optional - Path attribute. Default is "/"
            sameSite: "lax", //Optional - SameSite attribute. Default is "lax"
        }
    }
});
```

#### [Next Section: Usage](/getting-started/usage)

---
title: "Session Storage"
---

# Session Storage
Rather than forcing specific data storage technologies and schemas, Narvik requires you to define your own data storage callbacks meaning you use a data storage solution that suits you.

The callbacks required are:
- `saveSession`: Save a session to your data store.
- `fetchSession`: Fetch a session from your data store using the session ID.
- `updateSessionExpiry`: Update the expiry of a session (by session ID) in your data store.
- `deleteSession`: Delete a session from your data store using the session ID.

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

You can also provide three additional "optional" callbacks that enable you to perform additional session management functions. These are:
- `fetchSessionsForUser`: Fetch all sessions for a user (by user ID) from your data store.
- `deleteSessionsForUser`: Delete all sessions for a user (by user ID) from your data store.
- `deleteAllExpiredSessions`: Delete all expired sessions from your data store.

Although optional, these features are valuable for managing sessions within your database. They help maintain session security across your application by removing outdated sessions and keeping your database organized and clean.

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

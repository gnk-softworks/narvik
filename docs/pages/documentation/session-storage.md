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

## Other functions you may want to implement
As outlined on the Sessions page, it’s important to implement the following additional session management functions for use throughout your application:
- Get all sessions for a user – Useful for displaying a list of all active sessions to the user. 
- Delete sessions for a user – Helpful when a user changes their password and needs to end previous sessions. 
- Delete all expired sessions – Useful for database maintenance, though some databases offer built-in TTL functionality that can handle this automatically.
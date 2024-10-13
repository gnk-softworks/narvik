---
title: "Guide: Community Datastore Adapters"
---

# Community Data Adapters

Unlike Lucia, which required the use of a database specific adapter, Narvik uses callbacks to manage data allowing the framework to remain flexible and lightweight and you to provide your own implementation easily in a technology you are already using.

That said some users are looking to get started quickly using a standard datastore and implementation. To enable this on this page we will provide details on how to create an adapter and list any community supported adapters.

## Community Datastore Adapters
- Nothing here yet - If you have created a data adapter for Narvik and want it to be included on this page please submit a PR to add it here and we will review it.

> Note: We can't guarantee the quality of these adapters, please review the code and use at your own risk.

## Creating a Datastore Adapter

This section will guide you through creating a datastore adapter for Narvik.

### Before you start
If you are going to create an adapter please consider the following:
- You should have a good understanding of how Narvik works at a code level and how what you are creating will fit into the framework.
- Check if an adapter already exists for the datastore you are using, if so consider contributing to that project rather than creating a new one.
- The adapter should be well documented - This includes stating which version of Narvik it is compatible with and which optional functions it supports.
- The adapter should be well tested - Narvik has a commitment to 100% test coverage in the core library and we would expect any adapters to have sufficient test coverage to ensure they are reliable.
- The adapter should be well maintained - Narvik is a fast moving project and we expect any adapters to be kept up to date with the latest version of Narvik. If we find an adapter is not being maintained we may remove it from this page.

[//]: # (//instructions to build the below adapter)

### Create your adapter

To create a datastore adapter for Narvik, you need to implement the `NarvikDataConfiguration` interface. This interface has the following methods:
- `saveSession` - Saves a session to the datastore.
- `fetchSession` - Fetches a session from the datastore.
- `updateSessionExpiry` - Updates the expiry date of a session in the datastore.
- `deleteSession` - Deletes a session from the datastore.
- `fetchSessionsForUser` - OPTIONAL: Fetches all sessions for a user from the datastore.
- `deleteSessionsForUser` - OPTIONAL: Deletes all sessions for a user from the datastore.
- `deleteAllExpiredSessions` - OPTIONAL: Deletes all expired sessions from the datastore.

It is recommended to implement all methods in the interface, though the last three methods are optional. If the datastore you’re developing the adapter for supports TTL (time-to-live) expiry, it is advised to use that instead of the deleteAllExpiredSessions method. If you decide not to implement the optional methods, be sure to notify users in your adapter’s documentation.

Here is an example of an in-memory datastore adapter:
```ts
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
}
```

### Using your adapter

To use your adapter, you can pass an instance of it to the `Narvik` constructor. Here is an example of how to use the `TestInMemoryDatastoreAdapter` implemented above:
```ts
const adapter = new TestInMemoryDatastoreAdapter();

export const narvik = new Narvik({
    data: adapter
});
```

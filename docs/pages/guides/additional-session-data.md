---
title: "Guide: Additional Session Data"
---

# Additional Session Data

Narvik uses the session object to track and validate requests made by authenticated users. The session object is created and stored on login, validated on every request, and then deleted on log out. The session object has the following interface:

```ts
interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    new?: boolean;
    extended?: boolean;
}
```

## Extending the Session Object

To use add additional data to the session, you must extend the `AdditionalSessionData` interface using Declaration Merging. This allows you to add additional properties to the AdditionalSessionData interface which is extended by the session interface. For example, if you wanted to store the timestamp of when the session was created, you could extend the interface like this:

```ts
declare module 'narvik' {
    interface AdditionalSessionData {
        createdAt?: Date;
    }
}
```

## Populating Custom Session Data in the 'createSession' call

You can populate the custom session data directly in the `createSession` call. For example, if you had extended the interface to include the users username, you could populate the `username` property like this:

```ts

const authenticatedUser = {
    id: "123",
    name: "John Smith",
    username: "johnsmith"
};

//Create a new session for the authenticated user
const createSessionResult = await narvik.createSession(authenticatedUser.id, {
    username: authenticatedUser.username
});
```

## Populating Custom Session Data in the data callbacks
Because you have control over the data management callbacks, you can populate the additional session data directly within them. For example, if you wanted to store the timestamp of when the session was created, you could populate the `createdAt` property in the `saveSession` callback like this:

```ts
        async function saveSession (session: Session): Promise<void> {
            session.createdAt = new Date();
            // Save the session to your database
        }
```

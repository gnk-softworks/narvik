---
title: "Sessions"
---

# Sessions
Narvik uses the session object track and validate requests made by authenticated users. They should be created and stored on login, validated on every request, and then deleted on log out.

```ts
interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    new?: boolean;
    extended?: boolean;
}
```

> Note: For information on how to extend the session object with additional data, see the [Additional Session Data](/guides/additional-session-data) guide.

## Creating Sessions
To create a session, call the `createSession()` function with the authenticated user’s ID. This will generate a session object and a token, the session is then saved to your database via the saveSession callback provided in your configuration. The `createSession()` function returns a CreateSessionResult object containing both the session object and the token. The token can be stored as a cookie ([see the cookies section](/documentation/cookies)) or be passed in as a token on subsequent requests to identify the user .
```ts
export interface CreateSessionResult {
    token: string;
    session: Session;
}

const authenticatedUser = {
id: "123",
name: "John Smith",
email: "john.smith@your-app-name.com"
};

//Create a new session for the authenticated user
const createSessionReult: CreateSessionResult = await narvik.createSession(authenticatedUser.id);

//Set the session cookie
```

## Session Length
The session’s expiresAt field is automatically extended with each use, ensuring that active users stay signed in while inactive users are logged out after a set period. By default, sessions expire after 30 days, though this can be customized using the sessionExpiresIn configuration. When the session reaches less than half of its remaining time, the expiration is extended by the full session duration.
```ts
export const narvik = new Narvik({
    data: {}, //data configuration
    session: { //Optional - Session configuration
        sessionExpiresInMs: 1000 * 60 * 60 * 24 * 7, //Optional - Desired session length in ms. Default is 30 Days - here value is 1 week
    },
    cookie: {} //Optional cookie configuration
});
```

## Validate sessions
To validate a session, use `validateSession()` function passing in the session token. This will return the session object if the token is valid, or `null` if it is not.

```ts
const validatedSession = await narvik.validateSession(sessionToken); //Returns Session if valid or null if session is invalid
```

When 'Session.extended' is 'true', the session expiration has been extended and you should set a new session cookie.
Some frameworks may not allow you to set a new session cookie every time. In future we will add the ability to make the session cookie not expire in configuration.

```ts
const validatedSession = await narvik.validateSession(sessionToken);

if (session && (session.new || session.extended)) {
	// set session cookie
}
```

## Invalidate sessions

When signing out users call the `invalidateSession()` function with the session id to invalidate a session.

To get the session id you will need to extract it from the session returned by `validateSession()`.

```ts
await narvik.invalidateSession(sessionId);
```

## Other useful session functions you should implement outside of Narvik
For management of sessions in your database, you should implement the following functions for use in other places in your application:
- Get all sessions for a user - Useful for showing a user all of their active sessions
- Delete sessions for a user - Useful for when a user changes their password
- Delete all expired sessions - Useful for cleaning up your database although some databases have built-in TTL functionality which can be used instead.

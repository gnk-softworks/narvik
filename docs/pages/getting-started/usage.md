---
title: "Getting Started - Usage"
---

# Getting Started - Usage

## Usage

### Authenticating a User and Creating a Session
```ts
//Your user who has passed authentication
const authenticatedUser = {
    id: "123",
    name: "John Smith",
    email: "john.smith@your-app-name.com"
};

//Create a new session for the authenticated user
const createSessionResult = await narvik.createSession(authenticatedUser.id);

//Create a cookie to store the session
const cookie = narvik.createCookie(createSessionResult.token);

//TODO: Set the cookie to store the session. Use thecookie name stored in narvik.cookieName
```


### Validating a Session
```ts
//Fetch the session cookie from the request. Use the cookie name stored in narvik.cookieName
if(!sessionToken) {
    // Do something if the session token is not found in cookie
}
const validatedSession = await narvik.validateSession(sessionToken); //Returns Session if valid or null if session is invalid
```

### Invalidating a Session and Clearing the Cookie
```ts
//Fetch the session cookie from the request. Use the cookie name stored in narvik.cookieName
const sessionId = validatedSession.id;

//Invalidate the session
await narvik.invalidateSession(sessionId);

//Create a blank cookie to clear the session
const blankCookie = narvik.createBlankCookie();

//TODO: Set the cookie to clear the session
```

## Using functions enabled by optional callbacks
As outlined on the setup page, you can enable additional session management functions by providing optional callbacks in your configuration. These callbacks are directly accessible on the Narvik instance and can be used throughout your application.

### Fetching all sessions for a user
This function should be used to fetch all sessions for a user (by user id) from your datastore. An example use case is displaying a list of all active sessions to the user.

```ts
const sessions = await narvik.fetchSessionsForUser(userId);
```

### Deleting all sessions for a user
This function should be used to delete all sessions for a user (by user id) from your datastore. An example use case is when a user changes their password and needs to end previous sessions to ensure security.

```ts
await narvik.deleteSessionsForUser(userId);
```

### Deleting all expired sessions
This function should be used to delete all expired sessions from your datastore. You may want to run this to remove old sessions and keep your database clean.

> Note: It is important to note that some databases offer built-in TTL functionality that can handle this automatically, which may be preferable to calling this function.

```ts
await narvik.deleteAllExpiredSessions();
```

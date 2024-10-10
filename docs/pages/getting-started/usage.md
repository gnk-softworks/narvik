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
const createSessionReult = await narvik.createSession(authenticatedUser.id);

//Create a cookie to store the session
const cookie = narvik.createSessionCookie(createSessionReult.token);

//TODO: Set the cookie to store the session. Use thecookie name stored in narvik.cookieName
```


### Validating a Session
```ts
//Fetch the session cookie from the request. Use the cookie name stored in narvik.cookieName
if(!sessionToken) {
    // Do something if the session is not found
}
const validatedSession = await narvik.validateSession(sessionToken); //Returns Session if valid or null if session is invalid
```

### Invalidating a Session and Clearing the Cookie
```ts
//Invalidate the session
narvik.invalidateSession(sessionId);

//Create a blank cookie to clear the session
const blankCookie = narvik.createBlankSessionCookie();

//TODO: Set the cookie to clear the session
```
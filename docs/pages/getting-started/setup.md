---
title: "Getting Started - Setup"
---

# Getting Started - Setup

## Installation
```bash
npm i narvik
```

## Usage

### Configuration

The basic configuration requires only that you provide functions for managing session data in you data store.
```ts
const narvik = new Narvik({
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

You can also provide additional configuration options for sessions and cookies.
```ts
const narvik = new Narvik({
    data: {
        //as above
    },
    session: { //Optional - Session configuration 
        sessionExpiresInMs: 1000 * 60 * 60 * 24 * 7, //Optional - Desired session lenth in ms. Default is 30 Days - here value is 1 week
    },
    cookie: { //Optional - Cookie configuration
        name: "your-app-session", //Optional - Session cookie name. Default is "narvik_session"
        attributes: {
            secure: true, //Optional - Secure attribute. Default is true
            domain: "example.com", //Optional - Domain attribute. Default is not set
            path: "/", //Optional - Path attribute. Default is "/"
            sameSite: "lax", //Optional - SameSite attribute. Default is "lax"
        }
    }
});
```




### Usage
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
cookies().set(cookie.name, cookie.value, cookie.attributes);

//Fetch the session from the database
const sessionToken = cookies().get(narvik.cookieName)?.value ?? null;
if(!sessionToken) {
    // Do something if the session is not found
}
const validatedSession = await narvik.validateSession(sessionToken); //Returns Session if valid or null if session is invalid

//Create a blank cookie to clear the session
const blankCookie = narvik.createBlankSessionCookie();
```
# Narvik Auth

[![npm version](https://badge.fury.io/js/narvik.svg)](https://badge.fury.io/js/narvik)
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0%201.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)

## Introduction
Narvik is a server side authentication library offering a simple API for managing sessions, independent of your chosen database setup. Built with TypeScript and released under the CC0 license, it provides flexibility and simplicity in handling authentication workflows.

Although developed from scratch, Narvik draws inspiration from version 3 of the Lucia authentication library (https://lucia-auth.com), incorporating several ideas and tools developed by @PilcrowOnPaper.

## Installation
```bash
npm i narvik
```

## Features
- [x] Simple, easy to understand configuration
- [x] Data store agnostic
- [x] Works in any runtime
- [x] Fully typed

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

## Further documentation an examples
We are working on further documentation and examples. Please check back soon.

## Features coming soon
- [ ] Extend session interface to allow for custom attributes

## Contributions
If you want to improve the library, please create a pull request.
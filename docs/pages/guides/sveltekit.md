---
title: "Guide: Sveltekit"
---

# Getting started in Sveltekit (Preview)

> Note: This guide is an early preview and may not have been fully tested. Please report any issues you find.

## Installation
Install the Narvik library from NPM by running:
```bash
npm install narvik
```

## Initialize Narvik
Import Narvik and initialize it with methods to access your session data. Refer to the docs to learn more about providing the functions to manage session data.

```ts
// src/lib/server/auth.ts
import { Narvik, Session } from "narvik";
import { dev } from "$app/environment";

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
        },

        // Optional - Additional session management functions
        fetchSessionsForUser: async (userId: string): Promise<Session[]> => {
            // Enables the 'fetchSessionsForUser' on Narvik - Used to Fetch all sessions for a user from your database
        },
        deleteSessionsForUser: async (userId: string): Promise<void> => {
            // Enables the 'deleteSessionsForUser' on Narvik - Used to Delete all sessions for a user from your database
        },
        deleteAllExpiredSessions: (): Promise<void> => {
            // Enables the 'deleteAllExpiredSessions' on Narvik - Used to Delete all expired sessions from your database. Some databases offer built-in TTL functionality that can handle this automatically which may be preferable.
        }
    },
    cookie: {
        attributes: {
            // Sets the cookie to be secure in production
            secure: !dev,
        }
    }
});
```

## Setup hooks
Next step is to setup a handle hook to validate requests. The validated user will be available as locals.user.
> NOTE: You need to provide you own get user implementation because user only stores the user id.

```ts
// src/hooks.server.ts
import { narvik } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    const sessionToken = event.cookies.get(narvik.sessionCookieName);
    if (!sessionToken) {
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }

    const session = await narvik.validateSession(sessionToken);
	if (session && session.fresh) {
		const sessionCookie = narvik.createCookie(sessionToken);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = narvik.createBlankCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}

	const user = await userService.getUser(session?.userId);

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

Make sure to type App.Locals as well.
// src/app.d.ts
declare global {
    namespace App {
    interface Locals {
    user: User | null; // User type should be imported from your project
    session: import("narvik").Session | null;
}
}
}
```


## Next steps
- You can read through the documentation & getting started guide to learn more about Narvik.
- If you spot any issues, please report them on the GitHub repository.
- If you have any questions, join our Discord server!

---
title: "Guide: Express"
---

# Guide: Express

The purpose of this guide is to help you get started with Narvik when building an Express.js project. We will walk through adding Narvik to a simple Express application that authenticates users using a username and password.

## Pre-requisite: Express Project
This guide assumes you already have an Express.js project set up with:
- A user store (e.g. a database) that you can use to store users details (id, username, password_hash).
- A method to validate a user's username and password.
- A method to fetch a user by their ID.
- The ability to create a database table to store sessions and the ability to write the code to save, fetch, update and delete sessions from your database.

> Note: If you don't have an Express project set up, you can follow the [Express.js Getting Started Guide](https://expressjs.com/en/starter/installing.html) to create a new project. After you have done this and met the pre-requisites above, you can continue with this guide.

## Installation
First up we need to add the Narvik package to our project along with `cookie-parser` middleware for parsing cookies. You can do this by running the following command in your terminal:

```bash
npm i narvik cookie-parser
```

> Note: The `cookie-parser` middleware is required to parse cookies from incoming requests in Express. Make sure to add it to your Express app with `app.use(cookieParser())`.

## Setup
Create a new file in your project called `auth.ts`. Within this file you will need to initialise a new instance of Narvik.

When initialising Narvik for use with Express you will need to provide a few bits of configuration:
1. Implementations of the required data management callbacks to save, fetch, update and delete sessions from your database.
2. OPTIONAL: Implementations of additional callbacks to fetch all sessions for a user, delete all sessions for a user and delete all expired sessions.
3. Configuration for the cookies that Narvik will use to store session tokens.

> Note: For more information on the data management callbacks, what the session object looks like and how to extend the session object with additional data, see the [Sessions](/documentation/sessions) and [Session Storage](/documentation/session-storage) pages.

Here is an example of what that file might look like:

```ts
// auth.ts
import { Narvik, Session } from "narvik";

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
        deleteAllExpiredSessions: async (): Promise<void> => {
            // Enables the 'deleteAllExpiredSessions' on Narvik - Used to Delete all expired sessions from your database. Some databases offer built-in TTL functionality that can handle this automatically which may be preferable.
        }
    },
    cookie: {
        attributes: {
            // Sets the cookie to be secure in production
            secure: process.env.NODE_ENV === "production"
        }
    }
});
```

Once you have set up your `auth.ts` file and implemented the required callbacks you can move on to the next step!

## Helper functions
To make validating a request and getting user data easier we recommend you implement and export the following helper functions from your `auth.ts` file.

### `getUser`
This function retrieves the session cookie from the request, validates it using Narvik, and fetches the corresponding user from your database. If a user is found it is returned, if not `null` is returned.

```ts
// Add these imports to auth.ts
import { Request, Response } from "express";

export const getUser = async (
    req: Request,
    res: Response
): Promise<YourUserObject | null> => {
    const sessionToken = req.cookies[narvik.cookieName] ?? null;
    if (!sessionToken) {
        return null;
    }

    let user: YourUserObject | null = null;

    const session = await narvik.validateSession(sessionToken);

    if (session && (session.new || session.extended)) {
        const cookie = narvik.createCookie(sessionToken);
        res.setHeader("Set-Cookie", cookie.serialize());
    }
    if (!session) {
        const cookie = narvik.createBlankCookie();
        res.setHeader("Set-Cookie", cookie.serialize());
        return null;
    }

    // Fetch the user from your database using your existing user fetching implementation
    user = await getUserById(session.userId) || null;

    return user;
};
```

### `startSession`
Creates a new session for a user and sets the session cookie. This function can be used during user sign-up or sign-in.

```ts
export const startSession = async (
    userId: string,
    res: Response
): Promise<void> => {
    const { token } = await narvik.createSession(userId, {});
    const cookie = narvik.createCookie(token);
    res.setHeader("Set-Cookie", cookie.serialize());
};
```

### `endSession`
Invalidates the user session and removes the session cookie. Use this when the user signs out.

```ts
export const endSession = async (
    req: Request,
    res: Response
): Promise<void> => {
    const sessionToken = req.cookies[narvik.cookieName] ?? null;
    if (sessionToken) {
        const session = await narvik.validateSession(sessionToken);
        if (session) {
            await narvik.invalidateSession(session.id);
        }
        const cookie = narvik.createBlankCookie();
        res.setHeader("Set-Cookie", cookie.serialize());
    }
};
```

## Usage
Now that you have set up Narvik and the helper functions you can use the `getUser`, `startSession` and `endSession` functions in your Express routes to create and manage sessions for authenticated users.

Lets go through a few examples of how you might use these functions:

### Sign In Route using `startSession`
An example of a route that you might use to authenticate a user and start a session for them. This route would be called from your sign-in form.

```ts
// routes/auth.ts
import express from "express";
import { startSession } from "../auth";

const router = express.Router();

router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    // Authenticate the user by comparing the username and password to the username and
    // password hash in your database.
    const authenticatedUser = await authenticateUser(username, password);
    if (!authenticatedUser) {
        return res.status(401).json({ error: "Incorrect username or password" });
    }

    await startSession(authenticatedUser.id, res);
    return res.status(200).json({ success: true });
});

export default router;
```

### Sign Out Route using `endSession`
An example of a route that you might use to sign out a user and end their session.

```ts
// routes/auth.ts
import express from "express";
import { endSession } from "../auth";

const router = express.Router();

router.post("/signout", async (req, res) => {
    await endSession(req, res);
    return res.status(200).json({ success: true });
});

export default router;
```

### Protected Route using `getUser`

The following is an example of how you might use the `getUser` function to authenticate a user and return their profile data.

> Note: It is important to check if the user is authenticated before returning any user data and return a 401 error if they are not authenticated.

```ts
// routes/profile.ts
import express from "express";
import { getUser } from "../auth";

const router = express.Router();

router.get("/profile", async (req, res) => {
    const user = await getUser(req, res);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email
    });
});

export default router;
```

### Protected Route with Permission Check using `getUser`

The following is an example of how you might use the `getUser` function to authenticate a user and get data that requires additional permission checks.

> Note: It is important to check not only if the user is authenticated but also if they have permission to view the data before returning it.
> In this example, we check if the user is authenticated and if they have permission to view the account before returning the number of sales.
> If the user is not authenticated we return a 401 error.
> Failure to check permissions could result in sensitive data being exposed to unauthorised users.

```ts
// routes/accounts.ts
import express from "express";
import { getUser } from "../auth";

const router = express.Router();

router.get("/accounts/:accountId/sales", async (req, res) => {
    // Get the user from the session, if the user is not authenticated return 401
    const user = await getUser(req, res);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { accountId } = req.params;

    // Check if the user has permission to view the account before returning the number of sales
    const account = await getAccount(accountId);
    if (!account.userIds.includes(user.id)) {
        return res.status(403).json({ error: "You do not have permission to view this account" });
    }

    return res.status(200).json({ salesCount: account.sales.length });
});

export default router;
```

## Authentication Middleware
Express makes it easy to create reusable middleware for common tasks. Here's how you can create an authentication middleware to protect multiple routes:

```ts
// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { getUser } from "../auth";

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: YourUserObject;
        }
    }
}

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = await getUser(req, res);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
};
```

You can then use this middleware to protect routes:

```ts
// routes/protected.ts
import express from "express";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Protect a single route
router.get("/dashboard", requireAuth, async (req, res) => {
    // req.user is guaranteed to be defined here
    return res.status(200).json({ message: `Welcome ${req.user!.name}` });
});

// Protect all routes in a router
router.use(requireAuth);

router.get("/settings", async (req, res) => {
    return res.status(200).json({ settings: req.user!.settings });
});

router.get("/notifications", async (req, res) => {
    return res.status(200).json({ notifications: req.user!.notifications });
});

export default router;
```

## A Note on CSRF Protection
Express doesn't provide built-in CSRF protection, so you'll need to implement it manually.

A simple approach is to validate the `Origin` header on state-changing requests (POST, PUT, DELETE, etc.):

```ts
// middleware/csrf.ts
import { Request, Response, NextFunction } from "express";

export const csrfProtection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Only check state-changing methods
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        const origin = req.headers.origin;
        const host = req.headers.host;

        // Verify the origin matches the host
        if (!origin || !host || new URL(origin).host !== host) {
            return res.status(403).json({ error: "Invalid origin" });
        }
    }

    next();
};

// Usage: Apply to your app or specific routes
// app.use(csrfProtection);
```

For more robust protection, consider implementing a double-submit cookie pattern or using a CSRF token library.

## Updates & Corrections
If you spot an error in this guide or have a suggestion for improvement, please get in touch by one of the following methods:
- Creating an issue on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Fix the issue and submit a pull request on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Let us know in the [Narvik Discord](https://discord.gg/y2WGpuwztV)

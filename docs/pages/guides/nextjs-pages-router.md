---
title: "Guide: NextJS (Pages Router)"
---

# Guide: NextJS (Pages Router)

The purpose of this guide is to help you get started with Narvik when building a NextJS (Pages Router) project. We will walk through adding Narvik to a simple NextJS application that authenticates users using a username and password.

## Pre-requisite: NextJS Pages Router Project
This guide assumes you already have a NextJS (Pages Router) project set up with:
- A user store (e.g. a database) that you can use to store users details (id, username, password_hash).
- A method to validate a user's username and password.
- A method to fetch a user by their ID.
- The ability to create a database table to store sessions and the ability to write the code to save, fetch, update and delete sessions from your database.

> Note: If you don't have a NextJS project set up, you can follow the "Getting Started" section on the [NextJS Documentation](https://nextjs.org/docs) to create a new project. After you have done this and met the pre-requisites above, you can continue with this guide.

## Installation
First up we need to add the Narvik package to our project. You can do this by running the following command in your terminal:

```bash
npm i narvik
```

## Setup
Create a new file in the `lib` directory of your project called `auth.ts`. Within this file you will need to initialise a new instance of Narvik.

When initialising Narvik for use with NextJS you will need to provide a few bits of configuration:
1. Implementations of the data required management callbacks to save, fetch, update and delete sessions from your database.
2. OPTIONAL: Implementations of additional callbacks to fetch all sessions for a user, delete all sessions for a user and delete all expired sessions.
3. Configuration for the cookies that Narvik will use to store session tokens.

> Note: For more information on the data management callbacks, what the session object looks like and how to extend the session object with additional data, see the [Session](/documentation/session) and [Session Storage](/documentation/session-storage) pages.

Here is an example of what that file might look like:

```ts
// lib/auth.ts
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
        /*
        This sets cookies to expire in 1 year. With a 1 year cookie expiry, the session can be extended
        for up to a year without the user needing to log in again. If the session itself expires
        (based on your session configuration), the user will still be logged out.
        */
        cookieExpiresInMs: 1000 * 60 * 60 * 24 * 365, // 1 year
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

> Note: Unlike the App Router which uses `cookies()` from `next/headers`, the Pages Router requires passing `req` and `res` objects to handle cookies. The helper functions below are designed to work with both API routes and `getServerSideProps`.

### `getUser`
This function retrieves the session cookie from the request, validates it using Narvik, and fetches the corresponding user from your database. If a user is found it is returned, if not `null` is returned.

```ts
import { NextApiRequest, NextApiResponse } from "next";
import { GetServerSidePropsContext } from "next";

type RequestWithCookies = NextApiRequest | GetServerSidePropsContext["req"];
type ResponseWithHeaders = NextApiResponse | GetServerSidePropsContext["res"];

export const getUser = async (
    req: RequestWithCookies,
    res: ResponseWithHeaders
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
    res: ResponseWithHeaders
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
    req: RequestWithCookies,
    res: ResponseWithHeaders
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
Now that you have set up Narvik and the helper functions you can use the `getUser`, `startSession` and `endSession` functions in your NextJS pages and API routes to create and manage sessions for authenticated users.

Lets go through a few examples of how you might use these functions:

### Sign In API Route using `startSession`
An example of an API route that you might use to authenticate a user and start a session for them. This route would be called from your sign-in form.

```ts
// pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { startSession } from "@/lib/auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { username, password } = req.body;

    // Authenticate the user by comparing the username and password to the username and
    // password hash in your database.
    const authenticatedUser = await authenticateUser(username, password);
    if (!authenticatedUser) {
        return res.status(401).json({ error: "Incorrect username or password" });
    }

    await startSession(authenticatedUser.id, res);
    return res.status(200).json({ success: true });
}
```

### Sign Out API Route using `endSession`
An example of an API route that you might use to sign out a user and end their session.

```ts
// pages/api/auth/signout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { endSession } from "@/lib/auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    await endSession(req, res);
    return res.status(200).json({ success: true });
}
```

### Page authentication using `getServerSideProps`

The following is an example of how you might use the `getUser` function to authenticate a user and display their name on a page using `getServerSideProps`.

> Note: It is important to check if the user is authenticated before displaying any user data and redirect them to the login page if they are not authenticated.

```tsx
// pages/index.tsx
import { GetServerSideProps } from "next";
import { getUser } from "@/lib/auth";

interface HomeProps {
    user: {
        name: string;
    };
}

export default function Home({ user }: HomeProps) {
    return (
        <div>
            <h1>Welcome {user.name}</h1>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const user = await getUser(context.req, context.res);

    if (!user) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    return {
        props: {
            user: {
                name: user.name,
            },
        },
    };
};
```

### API Route authentication using `getUser`

The following is an example of how you might use the `getUser` function to authenticate a user and get data in an API route.

> Note: It is important to check not only if the user is authenticated but also if they have permission to view the data before returning it.
> In this example, we check if the user is authenticated and if they have permission to view the account before returning the number of sales.
> If the user is not authenticated we return a 401 error.
> Failure to check permissions could result in sensitive data being exposed to unauthorised users.

```ts
// pages/api/accounts/[accountId]/sales.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUser } from "@/lib/auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Get the user from the session, if the user is not authenticated return 401
    const user = await getUser(req, res);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { accountId } = req.query;

    // Check if the user has permission to view the account before returning the number of sales
    const account = await getAccount(accountId as string);
    if (!account.userIds.includes(user.id)) {
        return res.status(403).json({ error: "You do not have permission to view this account" });
    }

    return res.status(200).json({ salesCount: account.sales.length });
}
```

## A Note on CSRF Protection
Unlike Server Actions in the App Router which provide built-in CSRF protection, API routes in the Pages Router require manual CSRF protection.

A simple approach is to validate the `Origin` header on state-changing requests (POST, PUT, DELETE, etc.):

```ts
// lib/csrf.ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

export function withCsrfProtection(handler: NextApiHandler): NextApiHandler {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        // Only check state-changing methods
        if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method || "")) {
            const origin = req.headers.origin;
            const host = req.headers.host;

            // Verify the origin matches the host
            if (!origin || !host || new URL(origin).host !== host) {
                return res.status(403).json({ error: "Invalid origin" });
            }
        }

        return handler(req, res);
    };
}

// Usage in an API route:
// export default withCsrfProtection(handler);
```

For more robust protection, consider using a CSRF token library or implementing a double-submit cookie pattern.

## Updates & Corrections
If you spot an error in this guide or have a suggestion for improvement, please get in touch by one of the following methods:
- Creating an issue on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Fix the issue and submit a pull request on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Let us know in the [Narvik Discord](https://discord.gg/y2WGpuwztV)

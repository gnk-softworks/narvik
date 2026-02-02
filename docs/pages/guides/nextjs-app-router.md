---
title: "Guide: NextJS (App Router)"
---

# Guide: NextJS (App Router)

The purpose of this guide is to help you get started with Narvik when building a NextJS (App router) project. We will walk through adding Narvik to a simple NextJS application that authenticates users using a username and password.

## Pre-requisite: NextJS App Router Project
This guide assumes you already have a NextJS (App Router) project set up with:
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
Create a new file in the `src` directory of your project called `auth.ts`. Within this file you will need to initialise a new instance of Narvik.

When initialising Narvik for use with NextJS you will need to provide a few bits of configuration:
1. Implementations of the required data management callbacks to save, fetch, update and delete sessions from your database.
2. OPTIONAL: Implementations of additional callbacks to fetch all sessions for a user, delete all sessions for a user and delete all expired sessions.
3. Configuration for the cookies that Narvik will use to store session tokens.

> Note: For more information on the data management callbacks, what the session object looks like and how to extend the session object with additional data, see the [Sessions](/documentation/sessions) and [Session Storage](/documentation/session-storage) pages.

Here is an example of what that file might look like:

```ts
// src/auth.ts
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
        This sets cookies to expire in 1 year as Next.js doesn't allow the setting of cookies when rendering pages.
        If this was left unchanged the session would be extended but the cookie would expire causing the user to be logged out.
        With a 1 year expiry, the session can be extended for up to a year without the user needing to log in again.
        If the session expires the user will still be logged out.
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

> Note: If you do not implement these functions you will need to export the `narvik` instance and use it directly in your pages, actions and routes. In the example config above the `narvik` instance is exported so you can use it directly.

### `getUser`
This function retrieves the session cookie, validates it using Narvik, and fetches the corresponding user from your database. If a user is found it is returned, if not `null` is returned.

```ts
export const getUser = cache(
    async (): Promise<YourUserObject | null> => {
        const sessionToken = cookies().get(narvik.cookieName)?.value ?? null;
        if (!sessionToken) {
            return null;
        }

        let user: YourUserObject | null = null;

        try {
            const session = await narvik.validateSession(sessionToken);

            if (session && (session.new || session.extended)) {
                const cookie = narvik.createCookie(sessionToken);
                cookies().set(cookie.name, cookie.value, cookie.attributes);
            }
            if (!session) {
                const cookie = narvik.createBlankCookie();
                cookies().set(cookie.name, cookie.value, cookie.attributes);
                return null;
            }

            // Fetch the user from your database using your existing user fetching implementation
            user = await getUserById(session.userId) || null;
        } catch {
            // Catch as Next.js doesn't allow the setting of cookies when rendering pages.
        }

        return user;
    }
);
```

### `createSession`
Creates a new session for a user and sets the session cookie. This function can be used during user sign-up or sign-in.

```ts
export const startSession = async (userId: string) =>{
    const {token} = await narvik.createSession(userId, {});
    const cookie = narvik.createCookie(token);
    cookies().set(cookie.name, cookie.value, cookie.attributes);
}
```

### `endSession`
Invalidates the user session and removes the session cookie. Use this when the user signs out.

```ts
export const endSession = async () => {
    const sessionToken = cookies().get(narvik.cookieName)?.value ?? null;
    if (sessionToken) {
        const session = await narvik.validateSession(sessionToken);
        if (session) {
            await narvik.invalidateSession(session.id);
        }
        const cookie = narvik.createBlankCookie();
        cookies().set(cookie.name, cookie.value, cookie.attributes);
    }
}
```

> Note: In NextJS v15 and above the cookies function has become async and you will need to use `await cookies()` instead of `cookies()`. You can read more about this in the [NextJS documentation](https://nextjs.org/blog/next-15#async-request-apis-breaking-change).

## Usage
Now that you have set up Narvik and the helper functions you can use the `getUser`, `startSession` and `endSession` functions in your NextJS pages to create and manage sessions for authenticated users.

Lets go through a few examples of how you might use these functions:

### Sign In Server Action using `startSession`
An example of a server action that you might use to authenticate a user and start a session for them. This action would be used to handle the sign-in form submission.

```tsx
async function signinAction(previousState: any, formData: FormData): Promise<any> {
    "use server";

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Authenticate the user by comparing the username and password to the username and
    // password hash in your database.
    const authenticatedUser = await authenticateUser(username, password as string);
    if (!authenticatedUser) {
        //return an error if the user is not authenticated to be displayed on the login form
        return {
            error: "Incorrect username or password"
        };
    }

    await startSession(authenticatedUser.id);
    return redirect("/");
}
```

### Sign Out Server Action using `endSession`
An example of a server action that you might use to sign out a user and end their session. This action would be used to handle the sign-out button click.

```tsx
async function logout(): Promise<void> {
    "use server";
    await endSession();
    redirect("/");
}
```

### Page authentication using `getUser`

The following is an example of how you might use the `getUser` function to authenticate a user and display their name on a page.

> Note: It is important to check if the user is authenticated before displaying any user data and redirect them to the login page if they are not authenticated.

```tsx
export default async function Home() {
    const user = await getUser();
    if (!user) {
        return redirect("/login");
    }

    return (
        <div>
            <h1>Welcome {user.name}</h1>
        </div>
    );
}
```

### Server Action authentication using `getUser`

The following is an example of how you might use the `getUser` function to authenticate a user and get data in a server action.

> Note: It is important to check not only if the user is authenticated but also if they have permission to view the data before returning it.
> In this example, we check if the user is authenticated and if they have permission to view the account before returning the number of sales.
> If the user is not authenticated we redirect them to the login page.
> Failure to check permissions could result in sensitive data being exposed to unauthorised users.

```tsx
async function getNumberOfSalesForAccount(accountId: string): Promise<number | { error: string }> {
    "use server";
    // Get the user from the session, if the user is not authenticated redirect to the login page
    const user = await getUser();
    if (!user) {
        redirect("/login");
    }

    // Check if the user has permission to view the account before returning the number of sales
    const account = await getAccount(accountId);
    if (account.userIds.includes(user.id)) {
        return account.sales.length;
    } else {
        return {
            error: "You do not have permission to view this account"
        };
    }
}
```

## A Note on CSRF Protection
In Next.js, Server Actions provide a level of protection against CSRF attacks. You can read more about this [here](https://nextjs.org/blog/security-nextjs-server-components-actions#csrf).

For Custom Route Handlers (route.tsx), CSRF protection needs to be implemented manually. Traditional methods like CSRF tokens or header validation should be used to secure these routes.

## Updates & Corrections
If you spot an error in this guide or have a suggestion for improvement, please get in touch by one of the following methods:
- Creating an issue on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Fix the issue and submit a pull request on the [Narvik GitHub repository](https://github.com/gnk-softworks/narvik)
- Let us know in the [Narvik Discord](https://discord.gg/y2WGpuwztV)


---
title: "Cookies"
---

# Cookies
Once a session is created, you may want to store the token in a session cookie. Narvik offers two helper functions to easily format session data for use in a session cookie:

### createSessionCookie()
The `createSessionCookie` function takes a session token and returns a cookie object that can be used to easily set a cookie in your framework of choice.
```ts
const cookie = narvik.createSessionCookie(sessionToken);
```

### createBlankSessionCookie()
The `createBlankSessionCookie` function returns a blank cookie object that can be used to easily clear a session cookie in your framework of choice.
```ts
const blankCookie = narvik.createBlankSessionCookie();
```

## Cookie Object
The cookie object is a straightforward structure containing a name, value, and attributes, which can be used to set a cookie. The attributes mirror those available when setting cookies.

Note: A serialize function will be added to the cookie object in the future, simplifying the process of setting cookies outside of your framework.

```ts
export interface Cookie {
    name: string;
    value: string;
    attributes: CookieAttributes;
}

export interface CookieAttributes {
    httpOnly?: boolean;
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: "none" | "lax" | "strict";
    maxAge?: number;
}
```
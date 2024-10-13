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

> Note: By default, the `Max Age` attribute is set to match the session expiry time. If you need the cookie to expire at a different time, you can configure this by setting the `cookieExpiresInMs` option in the Narvik config. This is particularly helpful if your framework doesn’t allow you to set or update the cookie in all locations where you validate and extend the session.

### createBlankSessionCookie()
The `createBlankSessionCookie` function returns a blank cookie object that can be used to easily clear a session cookie in your framework of choice.
```ts
const blankCookie = narvik.createBlankSessionCookie();
```

## Cookie Object
The cookie object is a straightforward structure containing a name, value, and attributes, which can be used to set a cookie. The attributes mirror those available when setting cookies.

```ts
export class Cookie {
    public name: string;
    public value: string;
    public attributes: CookieAttributes;

    constructor(name: string, value: string, attributes: CookieAttributes) {
        this.name = name;
        this.value = value;
        this.attributes = attributes;
    }

    public serialize(): string {
        return cookies.serialize(this.name, this.value, this.attributes);
    }
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

The `serialize` method is used to convert the cookie object into a string that can be set as a cookie using 'Set-Cookie' headers.
```ts
const cookie = narvik.createSessionCookie(sessionToken);
const cookieString = cookie.serialize();

// Set the cookie in the response headers
res.setHeader('Set-Cookie', cookieString);
```

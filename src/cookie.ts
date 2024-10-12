import {Cookie, CookieAttributes} from "./index.js";

function create(name:string, value: string, coreAttributes: CookieAttributes, sessionExpiresInMs: number): Cookie {
    return new Cookie(name, value, {
        ...coreAttributes,
        maxAge: sessionExpiresInMs / 1000
    });
}

function createBlank(name: string, coreAttributes: CookieAttributes): Cookie {
    return new Cookie(name, "", {
        ...coreAttributes,
        maxAge: 0
    });
}

function serialize(name: string, value: string, attributes: CookieAttributes): string {
    const keyValueEntries: string[] = [];

    // Basic cookie name-value pair
    keyValueEntries.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);

    // Map of optional attributes with corresponding values or flags
    const optionalAttributes: Record<string, string | undefined | boolean> = {
        Domain: attributes?.domain,
        "Max-Age": attributes?.maxAge?.toString(),
        Path: attributes?.path,
        SameSite: attributes?.sameSite ? capitalizeSameSite(attributes.sameSite) : undefined,
        Secure: attributes?.secure ? true : undefined,
        HttpOnly: attributes?.httpOnly ? true : undefined,
    };

    // Add optional attributes if defined
    for (const [key, value] of Object.entries(optionalAttributes)) {
        if (value !== undefined) {
            keyValueEntries.push(value === true ? key : `${key}=${value}`);
        }
    }

    return keyValueEntries.join("; ");
}

function capitalizeSameSite(sameSite: string): string {
    return sameSite.charAt(0).toUpperCase() + sameSite.slice(1);
}

export default { create, createBlank, serialize }

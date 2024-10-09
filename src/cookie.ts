import {Cookie, CookieAttributes} from "./index.js";

function create(name:string, value: string, coreAttributes: CookieAttributes, sessionExpiresInMs: number): Cookie {
    return {
        name,
        value,
        attributes: {
            ...coreAttributes,
            maxAge: sessionExpiresInMs / 1000
        }
    };
}

function createBlank(name: string, coreAttributes: CookieAttributes): Cookie {
    return {
        name,
        value: "",
        attributes: {
            ...coreAttributes,
            maxAge: 0
        }
    };
}

export default { create, createBlank }
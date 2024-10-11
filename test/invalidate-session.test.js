import { expect, test } from 'vitest'
import {Narvik} from "../src/index.ts";
import {defaultFetchSession, defaultUpdateSessionExpiry} from "./data/config/defaultSessionFunctions.js";

test('Invalidate Session', async () => {
    const testSessionId = "session-id"

    function deleteSession(sessionId) {
        expect(sessionId).toBe(testSessionId);
    }

    const narvik = new Narvik({
        data: {
            saveSession: defaultFetchSession,
            fetchSession: defaultFetchSession,
            updateSessionExpiry: defaultUpdateSessionExpiry,
            deleteSession: deleteSession
        }
    });

    await narvik.invalidateSession(testSessionId);
})
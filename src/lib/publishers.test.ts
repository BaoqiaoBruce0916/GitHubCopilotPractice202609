/**
 * Unit tests for the publisher option data-access helper.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { publishers } from '../../db/schema';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('publishers data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns publishers ordered by name', async () => {
        await db.insert(publishers).values([
            { name: 'Zenith Games', description: null },
            { name: 'Acme Interactive', description: null },
        ]);

        expect(await getAllPublishers(db)).toEqual([
            { id: expect.any(Number), name: 'Acme Interactive' },
            { id: expect.any(Number), name: 'Zenith Games' },
        ]);
    });
});

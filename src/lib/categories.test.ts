/**
 * Unit tests for the category option data-access helper.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories } from '../../db/schema';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('categories data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns categories ordered by name', async () => {
        await db.insert(categories).values([
            { name: 'Strategy', description: null },
            { name: 'Action', description: null },
        ]);

        expect(await getAllCategories(db)).toEqual([
            { id: expect.any(Number), name: 'Action' },
            { id: expect.any(Number), name: 'Strategy' },
        ]);
    });
});

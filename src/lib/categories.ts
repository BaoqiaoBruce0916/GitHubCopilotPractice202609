/**
 * Data-access helpers for game category records.
 *
 * Category queries accept an injectable Drizzle database so they can be
 * reused by build-time pages and tested with an in-memory database.
 */

import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Database } from './db';
import type { Category } from '../types/game';

/**
 * Retrieves all categories ordered alphabetically by name.
 *
 * @param db - Drizzle database connection used to query category records.
 * @returns All categories ordered by name.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));
}

/**
 * Data-access helpers for publisher records.
 *
 * Publisher queries accept an injectable Drizzle database so they can be
 * reused by build-time pages and tested with an in-memory database.
 */

import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Database } from './db';
import type { Publisher } from '../types/game';

/**
 * Retrieves all publishers ordered alphabetically by name.
 *
 * @param db - Drizzle database connection used to query publisher records.
 * @returns All publishers ordered by name.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));
}

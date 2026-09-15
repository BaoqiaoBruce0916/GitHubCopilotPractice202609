/**
 * Data-access helpers for game catalog records.
 *
 * These helpers use an injectable Drizzle database so pages can load catalog
 * data at build time and tests can exercise filtering against an in-memory DB.
 */

import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

/** Constraints used to narrow the game catalog. */
export interface GameFilters {
    categoryIds?: number[];
    publisherId?: number;
}

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Retrieves all games ordered alphabetically by title.
 *
 * @param db - Drizzle database connection used to query game records.
 * @returns All games with their category and publisher summaries.
 */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Retrieves games matching category and publisher constraints.
 *
 * Selected categories use inclusive OR semantics; a selected publisher is
 * combined with the category constraint using AND semantics.
 *
 * @param db - Drizzle database connection used to query game records.
 * @param filters - Optional category and publisher constraints.
 * @returns Matching games ordered alphabetically by title.
 */
export async function getFilteredGames(db: Database, filters: GameFilters): Promise<Game[]> {
    const categoryIds = filters.categoryIds ?? [];
    const conditions = [
        categoryIds.length > 0 ? inArray(games.categoryId, categoryIds) : undefined,
        filters.publisherId !== undefined ? eq(games.publisherId, filters.publisherId) : undefined,
    ].filter((condition) => condition !== undefined);

    const query = baseGamesQuery(db);
    const rows =
        conditions.length > 0
            ? await query.where(and(...conditions)).orderBy(asc(games.title))
            : await query.orderBy(asc(games.title));

    return rows.map(mapGame);
}

/**
 * Retrieves all game IDs ordered alphabetically by title.
 *
 * @param db - Drizzle database connection used to query game records.
 * @returns Game IDs ordered by title.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Retrieves a game by ID.
 *
 * @param db - Drizzle database connection used to query game records.
 * @param id - Numeric ID of the game to retrieve.
 * @returns The game with its related summaries, or null when not found.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

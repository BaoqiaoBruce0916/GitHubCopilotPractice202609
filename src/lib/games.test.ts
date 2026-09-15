/**
 * Unit tests for game catalog data-access helpers and filtering semantics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getFilteredGames,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('returns the complete ordered catalog when no filters are selected', async () => {
        await seedGames(db, 3);

        expect(await getFilteredGames(db, {})).toEqual(await getAllGames(db));
    });

    it('filters inclusively by one or more categories', async () => {
        const [strategy, puzzle, action] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: null },
                { name: 'Puzzle', description: null },
                { name: 'Action', description: null },
            ])
            .returning({ id: categories.id, name: categories.name });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: null })
            .returning({ id: publishers.id });
        await db.insert(games).values([
            { title: 'Zeta Strategy', description: 'a', starRating: null, categoryId: strategy.id, publisherId: publisher.id },
            { title: 'Alpha Puzzle', description: 'b', starRating: null, categoryId: puzzle.id, publisherId: publisher.id },
            { title: 'Beta Action', description: 'c', starRating: null, categoryId: action.id, publisherId: publisher.id },
        ]);

        const filtered = await getFilteredGames(db, { categoryIds: [strategy.id, puzzle.id] });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Puzzle', 'Zeta Strategy']);
    });

    it('combines category and publisher filters and returns no matches when none qualify', async () => {
        const [strategy, puzzle] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: null },
                { name: 'Puzzle', description: null },
            ])
            .returning({ id: categories.id, name: categories.name });
        const [firstPublisher, secondPublisher] = await db
            .insert(publishers)
            .values([
                { name: 'First Publisher', description: null },
                { name: 'Second Publisher', description: null },
            ])
            .returning({ id: publishers.id });
        await db.insert(games).values([
            { title: 'First Strategy', description: 'a', starRating: null, categoryId: strategy.id, publisherId: firstPublisher.id },
            { title: 'Second Strategy', description: 'b', starRating: null, categoryId: strategy.id, publisherId: secondPublisher.id },
            { title: 'First Puzzle', description: 'c', starRating: null, categoryId: puzzle.id, publisherId: firstPublisher.id },
        ]);

        const intersection = await getFilteredGames(db, {
            categoryIds: [strategy.id],
            publisherId: secondPublisher.id,
        });
        const noMatches = await getFilteredGames(db, {
            categoryIds: [puzzle.id],
            publisherId: secondPublisher.id,
        });

        expect(intersection.map((game) => game.title)).toEqual(['Second Strategy']);
        expect(noMatches).toEqual([]);
    });
});

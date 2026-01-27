import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { connections, type Connection } from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export type SavedConnection = Connection;

function getDatabase() {
    if (db) {
        return db;
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'servicebus_explorer.db');
    const sqlite = new Database(dbPath);

    db = drizzle(sqlite);

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    return db;
}

export function getAllConnections(): SavedConnection[] {
    const db = getDatabase();
    return db.select().from(connections).orderBy(connections.name).all();
}

export function getConnectionById(id: number): SavedConnection | undefined {
    const db = getDatabase();
    return db.select().from(connections).where(eq(connections.id, id)).get();
}

export function createConnection(name: string, connectionString: string): SavedConnection {
    const db = getDatabase();

    const result = db.insert(connections)
        .values({ name, connectionString })
        .returning()
        .get();

    return result;
}

export function updateConnection(id: number, name: string, connectionString?: string): SavedConnection {
    const db = getDatabase();

    const updateData: any = {
        name,
        updatedAt: sql`datetime('now')`,
    };

    if (connectionString) {
        updateData.connectionString = connectionString;
    }

    const result = db.update(connections)
        .set(updateData)
        .where(eq(connections.id, id))
        .returning()
        .get();

    if (!result) {
        throw new Error('Connection not found');
    }

    return result;
}

export function deleteConnection(id: number): boolean {
    const db = getDatabase();

    const result = db.delete(connections)
        .where(eq(connections.id, id))
        .returning()
        .get();

    return !!result;
}

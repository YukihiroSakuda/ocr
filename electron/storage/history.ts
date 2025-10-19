import Database from 'better-sqlite3';

export interface HistoryEntry {
  id: number;
  createdAt: string;
  imagePath: string;
  textResult: string;
  engine: string;
  lang: string;
  confidence: number | null;
}

export interface HistoryInput {
  imagePath: string;
  textResult: string;
  engine?: string;
  lang?: string;
  confidence?: number | null;
}

type RawHistoryRow = {
  id: number;
  created_at: string;
  image_path: string;
  text_result: string;
  engine: string;
  lang: string;
  confidence: number | null;
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  image_path TEXT NOT NULL,
  text_result TEXT NOT NULL,
  engine TEXT DEFAULT 'local',
  lang TEXT DEFAULT 'jpn+eng',
  confidence REAL
)`;

export default class HistoryStore {
  private db: Database.Database;
  private maxEntries: number;

  constructor(dbPath: string, maxEntries = 200) {
    this.db = new Database(dbPath);
    this.maxEntries = maxEntries;
    this.ensureTable();
  }

  private ensureTable() {
    this.db.prepare(CREATE_TABLE_SQL).run();
  }

  setMaxEntries(maxEntries: number) {
    this.maxEntries = maxEntries;
    this.enforceLimit();
  }

  addEntry(entry: HistoryInput): HistoryEntry {
    const insert = this.db.prepare(
      `INSERT INTO history (image_path, text_result, engine, lang, confidence)
       VALUES (@imagePath, @textResult, @engine, @lang, @confidence)`
    );

    const info = insert.run({
      imagePath: entry.imagePath,
      textResult: entry.textResult,
      engine: entry.engine ?? 'local',
      lang: entry.lang ?? 'jpn+eng',
      confidence: entry.confidence ?? null
    });

    const row = this.getEntry(info.lastInsertRowid as number);
    this.enforceLimit();
    if (!row) {
      throw new Error('Failed to fetch inserted history row.');
    }
    return row;
  }

  getEntry(id: number): HistoryEntry | null {
    const statement = this.db.prepare<[number], RawHistoryRow>(
      `SELECT id, created_at, image_path, text_result, engine, lang, confidence
       FROM history
       WHERE id = ?`
    );
    const row = statement.get(id);

    if (!row) {
      return null;
    }

    return this.mapRow(row);
  }

  getEntries(): HistoryEntry[] {
    const statement = this.db.prepare<[], RawHistoryRow>(
      `SELECT id, created_at, image_path, text_result, engine, lang, confidence
       FROM history
       ORDER BY datetime(created_at) DESC`
    );
    const rows = statement.all();

    return rows.map((row) => this.mapRow(row));
  }

  deleteEntry(id: number) {
    this.db.prepare('DELETE FROM history WHERE id = ?').run(id);
  }

  clear() {
    this.db.prepare('DELETE FROM history').run();
  }

  private enforceLimit() {
    const countRow = this.db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM history').get();
    if (!countRow) {
      return;
    }
    const count = countRow.count;
    if (count <= this.maxEntries) {
      return;
    }
    const offset = this.maxEntries;
    const idStatement = this.db.prepare<[], { id: number }>(
      `SELECT id FROM history ORDER BY datetime(created_at) DESC LIMIT -1 OFFSET ${offset}`
    );
    const ids = idStatement.all();
    const deleteStmt = this.db.prepare('DELETE FROM history WHERE id = ?');
    for (const row of ids) {
      deleteStmt.run(row.id);
    }
  }

  private mapRow(row: RawHistoryRow): HistoryEntry {
    return {
      id: row.id,
      createdAt: row.created_at,
      imagePath: row.image_path,
      textResult: row.text_result,
      engine: row.engine,
      lang: row.lang,
      confidence: row.confidence ?? null
    };
  }
}

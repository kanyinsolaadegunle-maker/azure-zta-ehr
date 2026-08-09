import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Adding password column to users table if missing...');
    await db.run(sql`ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'Password2026!'`);
    console.log('Column added successfully!');
  } catch (err: any) {
    console.log('Result:', err?.message || err);
  }
}

migrate();

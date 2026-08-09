import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function migrateUserManagement() {
  try {
    console.log('Migrating users table schema in Turso...');

    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'`);
      console.log('Added avatar_url column.');
    } catch (e: any) {
      console.log('avatar_url check:', e?.message || e);
    }

    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'Active'`);
      console.log('Added status column.');
    } catch (e: any) {
      console.log('status check:', e?.message || e);
    }

    console.log('Schema migration finished successfully!');
  } catch (err: any) {
    console.error('Migration failed:', err);
  }
}

migrateUserManagement();

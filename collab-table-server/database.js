const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fmea_collab',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.warn('Database not available:', err.message);
    throw err;
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'evaluation',
        ydoc BYTEA,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        color VARCHAR(50),
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_generations (
        id SERIAL PRIMARY KEY,
        doc_id VARCHAR(255) REFERENCES documents(id),
        prompt TEXT NOT NULL,
        result JSONB,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database tables created/verified');
  } catch (err) {
    console.error('Database setup error:', err.message);
    throw err;
  }
}

async function getDocument(id) {
  const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
  return result.rows[0];
}

async function saveDocument(id, name, type, ydocBuffer) {
  await pool.query(
    `INSERT INTO documents (id, name, type, ydoc, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       ydoc = EXCLUDED.ydoc,
       updated_at = CURRENT_TIMESTAMP`,
    [id, name, type, ydocBuffer]
  );
}

async function listDocuments(type = 'evaluation') {
  const result = await pool.query(
    'SELECT id, name, type, created_at, updated_at FROM documents WHERE type = $1 ORDER BY updated_at DESC',
    [type]
  );
  return result.rows;
}

async function createDocument(id, name, type = 'evaluation') {
  await pool.query(
    'INSERT INTO documents (id, name, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, name, type]
  );
}

async function upsertUser(id, name, avatar, color) {
  await pool.query(
    `INSERT INTO users (id, name, avatar, color, last_seen)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       avatar = EXCLUDED.avatar,
       color = EXCLUDED.color,
       last_seen = CURRENT_TIMESTAMP`,
    [id, name, avatar, color]
  );
}

async function saveAIGeneration(docId, prompt, result, createdBy) {
  await pool.query(
    'INSERT INTO ai_generations (doc_id, prompt, result, created_by) VALUES ($1, $2, $3, $4)',
    [docId, prompt, result, createdBy]
  );
}

module.exports = {
  pool,
  initDB,
  getDocument,
  saveDocument,
  listDocuments,
  createDocument,
  upsertUser,
  saveAIGeneration,
};

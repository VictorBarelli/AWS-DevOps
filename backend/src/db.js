const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL,
        game_name VARCHAR(255) NOT NULL,
        game_image TEXT,
        game_genres TEXT[],
        game_rating DECIMAL(3,2),
        super_liked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL,
        game_name VARCHAR(255) NOT NULL,
        game_image TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_public BOOLEAN DEFAULT true,
        group_id INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        genre VARCHAR(100),
        image_url TEXT,
        member_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image TEXT,
        genres TEXT[],
        rating DECIMAL(3,2) DEFAULT 4.0,
        description TEXT,
        released VARCHAR(20),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const defaultGroups = [
      { name: 'Action Lovers', slug: 'action', genre: 'Action', desc: 'Para fãs de jogos de ação e adrenalina' },
      { name: 'RPG Masters', slug: 'rpg', genre: 'RPG', desc: 'Comunidade de amantes de RPGs' },
      { name: 'Adventure Squad', slug: 'adventure', genre: 'Adventure', desc: 'Exploradores de mundos virtuais' },
      { name: 'Indie Gems', slug: 'indie', genre: 'Indie', desc: 'Descubra jogos indie incríveis' },
      { name: 'Strategy Minds', slug: 'strategy', genre: 'Strategy', desc: 'Mestres da estratégia e tática' },
      { name: 'Shooter Arena', slug: 'shooter', genre: 'Shooter', desc: 'FPS e jogos de tiro' },
      { name: 'Puzzle Solvers', slug: 'puzzle', genre: 'Puzzle', desc: 'Quebra-cabeças e desafios mentais' },
      { name: 'Racing Champions', slug: 'racing', genre: 'Racing', desc: 'Velocidade e adrenalina nas pistas' },
      { name: 'Sports League', slug: 'sports', genre: 'Sports', desc: 'Esportes virtuais e simuladores' },
      { name: 'Horror Fans', slug: 'horror', genre: 'Horror', desc: 'Jogos de terror e suspense' }
    ];

    for (const g of defaultGroups) {
      await client.query(`
        INSERT INTO groups (name, slug, genre, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO NOTHING
      `, [g.name, g.slug, g.genre, g.desc]);
    }


    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        keys JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };

const { Pool } = require('pg');
const Redis = require('ioredis');

// Production connection pooling optimization setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/daip'
});

// Resilient in-memory cache connections
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0');

module.exports = { pool, redis };
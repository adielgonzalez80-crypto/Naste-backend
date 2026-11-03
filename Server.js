const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const upload = multer({ dest: 'uploads/' });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT, email TEXT, birth TEXT, phone TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      username TEXT, caption TEXT, media TEXT, type TEXT,
      likes INT DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
initDB().catch(console.error);

app.post('/api/users', async (req, res) => {
  const { username, name, email, birth, phone } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO users (username, name, email, birth, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [username, name, email, birth, phone]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/posts', upload.single('file'), async (req, res) => {
  const { username, caption, type } = req.body;
  const media = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const r = await pool.query(
      'INSERT INTO posts (username, caption, media, type) VALUES ($1,$2,$3,$4) RETURNING *',
      [username, caption, media, type]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/posts', async (req, res) => {
  const r = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
  res.json(r.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Running on', PORT));

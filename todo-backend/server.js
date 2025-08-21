// --- Import required modules ---
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Helper: check if a string is non-empty
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// --- Database Connection ---
const pool = await mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// --- JWT Authentication Middleware ---
const auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- API Endpoints ---

// Create new user account
app.post('/create', async (req, res) => {
  try {
    const { fn, ln, email, password } = req.body || {};
    if (![fn, ln, email, password].every(isNonEmpty)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for duplicate email
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password and insert user
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (fn, ln, email, password) VALUES (?, ?, ?, ?)',
      [fn.trim(), ln.trim(), email.trim(), hash]
    );

    return res.status(201).json({ message: 'Account created successfully', userId: result.insertId });
  } catch (err) {
    console.error('POST /create error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Root endpoint: health check
app.get('/', (_req, res) => {
  res.send('Welcome to the Todo API');
});

// Login: authenticate user and return JWT
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmpty(email) || !isNonEmpty(password)) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const [rows] = await pool.execute('SELECT id, password FROM users WHERE email = ?', [email.trim()]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: email.trim() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('POST /login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Logout: placeholder
app.post('/logout', async (_req, res) => {
  return res.json({ message: 'Logout successful' });
});

// Get current user profile
app.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT id, fn, ln, email FROM users WHERE id = ?',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const me = rows[0];
    return res.json(me);
  } catch (err) {
    console.error('GET /me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update current user profile
app.put('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fn, ln } = req.body || {};
    if (!isNonEmpty(fn) || !isNonEmpty(ln)) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    const [result] = await pool.execute(
      'UPDATE users SET fn = ?, ln = ? WHERE id = ?',
      [fn.trim(), ln.trim(), userId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('PUT /me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Change password for current user
app.put('/me/password', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body || {};
    if (!isNonEmpty(oldPassword) || !isNonEmpty(newPassword)) {
      return res.status(400).json({ message: 'Old and new password are required' });
    }
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const match = await bcrypt.compare(oldPassword, rows[0].password);
    if (!match) return res.status(401).json({ message: 'Old password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('PUT /me/password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all todos
app.get('/items', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT id, task, status, created_at FROM todos WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /items error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a todo
app.post('/items', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { task } = req.body || {};
    if (!isNonEmpty(task)) return res.status(400).json({ message: 'Task is required' });

    const [result] = await pool.execute(
      'INSERT INTO todos (user_id, task) VALUES (?, ?)',
      [userId, task.trim()]
    );
    return res.status(201).json({ message: 'Todo created successfully', id: result.insertId });
  } catch (err) {
    console.error('POST /items error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo
app.delete("/items/:id", auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.execute(
      "DELETE FROM todos WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Todo not found or not yours" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("DELETE /items/:id error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Mark todo complete
app.put("/items/:id/complete", auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.execute(
      "UPDATE todos SET status = 'completed' WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found or not yours" });
    }

    res.json({ message: "Todo marked as completed" });
  } catch (err) {
    console.error("PUT /items/:id/complete error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
app.listen(process.env.PORT || 5000, () =>
  console.log('API running on port ' + (process.env.PORT || 5000))
);

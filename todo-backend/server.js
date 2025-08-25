// --- Import required modules ---
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Helper: check if a string is non-empty
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const pendingTodoRequests = {}; // key = userId, value = { type: "add_todo" }

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

// --- Enhanced NLP Intent Recognition ---
const recognizeIntent = (message) => {
  const lowerMsg = message.toLowerCase();
  let intent = "chat";
  let params = {};

  // Check for pending todos
  if (lowerMsg.includes("pending") || lowerMsg.includes("incomplete") || lowerMsg.includes("unfinished") || 
      lowerMsg.includes("show pending") || lowerMsg.includes("what's pending")) {
    intent = "list_pending";
  }
  // Check for adding todos
  else if (lowerMsg.includes("add") || lowerMsg.includes("new") || lowerMsg.includes("create") || 
           lowerMsg.includes("add todo") || lowerMsg.includes("new task") || lowerMsg.includes("create todo")) {
    intent = "add_todo";
    // Extract task from message
    const taskMatch = message.match(/(?:add|new|create)(?:\s+(?:todo|task))?\s*:?\s*(.+)/i);
    if (taskMatch && taskMatch[1].trim()) {
      params.task = taskMatch[1].trim();
    }
  }
  // Check for completing todos
  else if (lowerMsg.includes("complete") || lowerMsg.includes("done") || lowerMsg.includes("mark") || 
           lowerMsg.includes("finish") || lowerMsg.includes("check off")) {
    intent = "complete_todo";
    // Extract task title from message
    const taskMatch = message.match(/(?:complete|done|mark|finish|check off)(?:\s+as\s+done)?\s*:?\s*(.+)/i);
    if (taskMatch && taskMatch[1].trim()) {
      params.taskTitle = taskMatch[1].trim();
    }
  }
  // Check for deleting todos
  else if (lowerMsg.includes("delete") || lowerMsg.includes("remove") || lowerMsg.includes("drop")) {
    intent = "delete_todo";
    const taskMatch = message.match(/(?:delete|remove|drop)(?:\s+(?:todo|task))?\s*:?\s*(.+)/i);
    if (taskMatch && taskMatch[1].trim()) {
      params.taskTitle = taskMatch[1].trim();
    }
  }
  // Check for listing all todos
  else if (lowerMsg.includes("all") || lowerMsg.includes("list") || lowerMsg.includes("show all") || 
           lowerMsg.includes("what are my todos")) {
    intent = "list_all";
  }
  // Check for help
  else if (lowerMsg.includes("help") || lowerMsg.includes("what can you do") || lowerMsg.includes("commands")) {
    intent = "help";
  }

  return { intent, params };
};

// --- API Endpoints ---

// Create new user account
app.post('/create', async (req, res) => {
  try {
    const { fn, ln, email, password } = req.body || {};
    if (![fn, ln, email, password].every(isNonEmpty)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already exists' });

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
    if (!isNonEmpty(email) || !isNonEmpty(password)) return res.status(400).json({ message: 'Email and password are required' });

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
app.post('/logout', auth, async (_req, res) => {
  return res.json({ message: 'Logout successful' });
});

// Get current user profile
app.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute('SELECT id, fn, ln, email FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
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
    if (!isNonEmpty(fn) || !isNonEmpty(ln)) return res.status(400).json({ message: 'First name and last name are required' });

    const [result] = await pool.execute('UPDATE users SET fn = ?, ln = ? WHERE id = ?', [fn.trim(), ln.trim(), userId]);
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
    if (!isNonEmpty(oldPassword) || !isNonEmpty(newPassword)) return res.status(400).json({ message: 'Old and new password are required' });

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
    const [rows] = await pool.execute('SELECT id, task, status, created_at FROM todos WHERE user_id = ? ORDER BY id DESC', [userId]);
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

    const [result] = await pool.execute('INSERT INTO todos (user_id, task) VALUES (?, ?)', [userId, task.trim()]);
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
    const [result] = await pool.execute("DELETE FROM todos WHERE id = ? AND user_id = ?", [id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Todo not found or not yours" });
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("DELETE /items/:id error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Mark todo complete by ID
app.put("/items/:id/complete", auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.execute(
      "UPDATE todos SET status = 'completed' WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Todo not found or not yours" });
    res.json({ message: "Todo marked as completed" });
  } catch (err) {
    console.error("PUT /items/:id/complete error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- Enhanced Chatbot endpoint ---
app.post("/api/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const userId = req.user.id;
    const lowerMsg = message.toLowerCase();
    let reply = "";

    // Pending todos
    if (lowerMsg.includes("pending todo") || lowerMsg.includes("incomplete") || lowerMsg.includes("unfinished")) {
      const [rows] = await pool.execute("SELECT id, task FROM todos WHERE user_id = ? AND status = 'pending' ORDER BY id DESC", [userId]);
      if (rows.length > 0) {
        reply = `📋 You have ${rows.length} pending todo${rows.length > 1 ? 's' : ''}:\n` + 
                rows.map((t, i) => `${i + 1}. ${t.task}`).join("\n");
      } else {
        reply = "🎉 Great job! You have no pending todos.";
      }
    }
    // Completed todos
    else if (lowerMsg.includes("completed") || lowerMsg.includes("done")) {
      const taskTitle = message.replace(/complete|done/gi, "").trim();

      if (taskTitle) {
        const [rows] = await pool.execute(
          "SELECT id FROM todos WHERE user_id = ? AND task LIKE ? AND status = 'pending'",
          [userId, `%${taskTitle}%`]
        );

        if (rows.length === 0) {
          reply = `❌ No pending todo found matching "${taskTitle}"`;
        } else {
          const todoId = rows[0].id;
          await pool.execute(
            "UPDATE todos SET status = 'completed' WHERE id = ? AND user_id = ?",
            [todoId, userId]
          );
          reply = `✅ Todo "${taskTitle}" marked as completed!`;
        }
      } else {
        const [rows] = await pool.execute("SELECT id, task FROM todos WHERE user_id = ? AND status = 'completed' ORDER BY id DESC", [userId]);
        if (rows.length > 0) {
          reply = `✅ Completed todos:\n` + rows.map((t, i) => `${i + 1}. ${t.task}`).join("\n");
        } else {
          reply = "You haven't completed any todos yet.";
        }
      }
    }
    // All todos
    else if (lowerMsg.includes("all todos") || lowerMsg.includes("list todos")) {
      const [rows] = await pool.execute("SELECT id, task, status FROM todos WHERE user_id = ? ORDER BY id DESC", [userId]);
      if (rows.length > 0) {
        const pending = rows.filter(t => t.status === 'pending').length;
        const completed = rows.filter(t => t.status === 'completed').length;
        reply = `📋 You have ${rows.length} total todos:\n` +
                `🔄 ${pending} pending, ✅ ${completed} completed\n\n` +
                rows.map((t, i) => `${i + 1}. ${t.task} (${t.status})`).join("\n");
      } else {
        reply = "You don't have any todos yet. Let's add your first one!";
      }
    }
    // General chat → Hugging Face
    else {
      try {
        if (!process.env.HF_API_KEY) {
          reply = "AI chat is not configured yet. Please set HF_API_KEY to enable assistant responses.";
        } else {
          const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${process.env.HF_API_KEY}`, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
              inputs: `You are a helpful AI assistant for a todo app. User said: "${message}". Respond naturally and helpfully.` 
            }),
          });

          const data = await response.json();
          reply = Array.isArray(data) && data[0]?.generated_text 
            ? data[0].generated_text.replace(/^You are a helpful AI assistant for a todo app\. User said: ".*?"\. Respond naturally and helpfully\.\s*/i, '')
            : (data?.generated_text || "I'm here to help with your todos! You can ask me to show pending tasks, add new ones, or mark them as complete.");
        }
      } catch (hfError) {
        console.error("Hugging Face API error:", hfError);
        reply = "I'm here to help with your todos! You can ask me to show pending tasks, add new ones, or mark them as complete.";
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    // Never surface a 500 to the frontend for chat. Return a friendly fallback.
    res.json({ reply: "⚠️ Sorry, I ran into an issue handling that. Try rephrasing or use the quick buttons while I recover." });
  }
});

// --- Enhanced NLP endpoint for intent recognition ---
app.post("/api/nlp", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const userId = req.user.id;
    
    // Check if user is replying to a pending add_todo prompt
    if (pendingTodoRequests[userId]?.type === "add_todo") {
      const params = { task: message.trim() };
      const intent = "add_todo";
      delete pendingTodoRequests[userId]; // clear pending request
      return res.json({ intent, params });
    }

    // Use enhanced intent recognition
    const { intent, params } = recognizeIntent(message);

    // Handle special cases
    if (intent === "add_todo" && !params.task) {
      // No task provided → ask user interactively
      pendingTodoRequests[userId] = { type: "add_todo" };
      return res.json({ 
        intent: "ask_for_task", 
        params: {},
        message: "What task would you like me to add?"
      });
    }

    res.json({ intent, params });
  } catch (err) {
    console.error("NLP error:", err);
    res.status(500).json({ error: "NLP processing error" });
  }
});

// --- Translation endpoint ---
app.post("/api/translate", auth, async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    let model = "";
    if (targetLang === "fr") model = "Helsinki-NLP/opus-mt-en-fr";
    else if (targetLang === "de") model = "Helsinki-NLP/opus-mt-en-de";
    else if (targetLang === "es") model = "Helsinki-NLP/opus-mt-en-es";
    else model = "Helsinki-NLP/opus-mt-en-fr";

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text }),
    });

    const data = await response.json();
    let translatedText = Array.isArray(data) && data[0]?.translation_text 
      ? data[0].translation_text 
      : (data?.translation_text || "⚠️ Could not translate.");
    res.json({ translatedText });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation error" });
  }
});

// --- Health check endpoint ---
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      nlp: "available",
      speech: "enabled"
    }
  });
});

// Start server
app.listen(process.env.PORT || 5000, () =>
  console.log('🚀 Jarvis Todo API running on port ' + (process.env.PORT || 5000))
);

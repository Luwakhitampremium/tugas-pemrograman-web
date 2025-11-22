const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// PATH folder sesuai struktur kamu
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

// Pastikan folder ada
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

// Load data
let tasks = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

// Simpan data
function saveTasks() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOAD_DIR));

// Konfigurasi upload file (multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .toLowerCase();
    const unique = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    cb(null, `${base}_${unique}${ext}`);
  },
});

const upload = multer({ storage });

// GET semua tugas
app.get("/api/tasks", (req, res) => {
  const sorted = [...tasks].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  res.json(sorted);
});

// POST tugas baru
app.post("/api/tasks", upload.single("task_file"), (req, res) => {
  const { title, tech, year, tags, demo_url } = req.body;
  const file = req.file;

  if (!title || !tech || !year) {
    return res.status(400).json({ error: "Judul, teknologi, dan tahun wajib." });
  }

  const newTask = {
    id: Date.now(),
    title: title.trim(),
    tech: tech.trim(),
    year: parseInt(year, 10),
    tags: tags ? tags.trim() : "",
    demo_url: demo_url ? demo_url.trim() : "",
    file_path: file ? `/uploads/${file.filename}` : "",
    created_at: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();

  res.status(201).json(newTask);
});

// Serve index.html untuk semua route (SPA-safe)
app.listen(PORT, () =>
  console.log(`Server berjalan di http://localhost:${PORT}`)
);



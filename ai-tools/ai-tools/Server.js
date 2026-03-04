const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const LOG_FILE = path.join(__dirname, "data", "logs.json");
const RATE_LIMIT = 10; // 10 requests/day per IP

// Ensure logs file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify({ counters: {}, requests: [] }, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rate limit middleware
function rateLimiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const today = new Date().toISOString().slice(0, 10);

  const data = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));

  if (!data.counters[ip] || data.counters[ip].date !== today) {
    data.counters[ip] = { date: today, count: 0 };
  }

  if (data.counters[ip].count >= RATE_LIMIT) {
    return res.status(429).json({
      error: "Daily free request limit reached. Upgrade to Pro for unlimited access."
    });
  }

  data.counters[ip].count += 1;

  data.requests.push({
    ip,
    endpoint: req.path,
    date: new Date().toISOString()
  });

  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));

  next();
}

// Generator functions
function generateUsername(prompt) {
  const adjectives = ["Cool", "Epic", "Smart", "Swift", "Bold", "Creative", "Bright"];
  const nouns = ["Coder", "Explorer", "Artist", "Guru", "Builder", "Mind", "Vision"];
  const numbers = ["007", "101", "X", "99", "Pro", "HQ", "One"];

  return `${adjectives[Math.floor(Math.random()*adjectives.length)]}${prompt}${nouns[Math.floor(Math.random()*nouns.length)]}${numbers[Math.floor(Math.random()*numbers.length)]}`;
}

function generateCaption(prompt) {
  const templates = [
    `Living my best ${prompt} life ✨`,
    `Today’s mood: ${prompt} and unstoppable 💪`,
    `Just a little ${prompt} magic in the air ✨`,
    `${prompt} vibes only 🌈`,
    `Fuelled by ${prompt} & big dreams 🚀`
  ];
  return templates[Math.floor(Math.random()*templates.length)];
}

function generateBio(prompt) {
  const templates = [
    `Passionate about ${prompt}. Dreaming big and building daily.`,
    `Explorer of ${prompt}. Sharing my journey with the world.`,
    `${prompt} enthusiast | Creating, learning, growing.`,
    `Chasing goals, fueled by ${prompt} energy.`,
    `Here for the ${prompt}. Always evolving.`
  ];
  return templates[Math.floor(Math.random()*templates.length)];
}

// API routes
app.post("/api/username", rateLimiter, (req, res) => {
  const prompt = req.body.prompt || "User";
  res.json({ result: generateUsername(prompt) });
});

app.post("/api/caption", rateLimiter, (req, res) => {
  const prompt = req.body.prompt || "good";
  res.json({ result: generateCaption(prompt) });
});

app.post("/api/bio", rateLimiter, (req, res) => {
  const prompt = req.body.prompt || "creative";
  res.json({ result: generateBio(prompt) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

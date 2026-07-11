const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { createResearchHandler } = require('./lib/routes/research');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/research', createResearchHandler());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

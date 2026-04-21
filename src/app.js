const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authController = require('./controllers/auth.controller');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authController);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

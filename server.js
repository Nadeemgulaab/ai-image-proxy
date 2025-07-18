const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

app.get('/', (req, res) => {
  res.send('AI Image Proxy Running. Use /generate POST endpoint.');
});

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    // Start prediction request
    let response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '7de7b4a1e92e9a041cf9b7a8afacb822e5a0f5c2531721d376a6e2c4a4d59f32', // Stable Diffusion v1.5 example
        input: { prompt },
      }),
    });

    let prediction = await response.json();

    // Poll prediction status until done
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed'
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      response = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { Authorization: `Token ${REPLICATE_API_KEY}` },
        }
      );
      prediction = await response.json();
    }

    if (prediction.status === 'succeeded') {
      res.json({ image: prediction.output[0] });
    } else {
      res.status(500).json({ error: 'Generation failed' });
    }
  } catch (err) {
    res.status(500).json({ error: 'API error', details: err.message });
  }
});

// Add similar /enhance, /repair, /icon endpoints here as needed

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

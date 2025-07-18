const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

async function generateImage(prompt) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'a9758cb0429f1f352768d3d0c0f8ee5d1f1b24e70e63cfc8cfe9a1b6c6d50e2b',
      input: { prompt },
    }),
  });
  let data = await response.json();

  while (data.status !== 'succeeded' && data.status !== 'failed') {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    data = await res.json();
  }

  if (data.status === 'succeeded') {
    return data.output[0];
  } else {
    throw new Error('Generation failed');
  }
}

app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const imageUrl = await generateImage(prompt);
    res.json({ image: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error generating image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

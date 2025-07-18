// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Replicate = require('replicate');

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Initialize Replicate client with API key from environment variable
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Received prompt:', prompt);
    console.log('Replicate API Key set:', process.env.REPLICATE_API_KEY ? 'YES' : 'NO');

    const output = await replicate.run(
      "stability-ai/stable-diffusion-xl:1f0df7180c9e9ebcd61cfc6d74c4ea9f63e6afbf011b5c342a150858eaa7f1c7",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
        },
      }
    );

    if (!output || !Array.isArray(output) || !output[0]) {
      throw new Error('No image URL returned from Replicate');
    }

    res.json({ imageUrl: output[0] });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Image generation failed', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

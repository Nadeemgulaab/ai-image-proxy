const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Replicate = require('replicate');

dotenv.config(); // Load .env file

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Image Generation Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use the Replicate model (e.g., Stable Diffusion)
    const output = await replicate.run(
      "stability-ai/sdxl:latest", // You can change model here
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
        },
      }
    );

    if (!output || !Array.isArray(output) || !output[0]) {
      throw new Error('Image not generated');
    }

    res.json({ imageUrl: output[0] });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to generate image', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

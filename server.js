import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Replicate } from 'replicate';

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Test route
app.get('/', (req, res) => {
  res.send('AI Image Proxy is running!');
});

// Image generation endpoint
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const output = await replicate.run(
      "stability-ai/stable-diffusion-xl:1f0df7180c9e9ebcd61cfc6d74c4ea9f63e6afbf011b5c342a150858eaa7f1c7",
      {
        input: {
          prompt,
          width: 1024,
          height: 1024
        }
      }
    );

    res.json({ imageUrl: output[0] });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

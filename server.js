import express from 'express';
import cors from 'cors';
import Replicate from 'replicate'; // ✅ Fixed import, works with type: module

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Direct Token
const replicate = new Replicate({
  auth: 'rnd_89eRpzzTKeMYQETE5npl4M1uMWlP',
  userAgent: 'ai-image-proxy/1.0.0'
});

// 🧪 Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'AI Image Proxy Service is live',
    endpoints: {
      generate: 'POST /generate'
    }
  });
});

// 🖼️ Generate Image
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = "stability-ai/stable-diffusion-xl:1f0df7180c9e9ebcd61cfc6d74c4ea9f63e6afbf011b5c342a150858eaa7f1c7";

    const output = await replicate.run(model, {
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        refine: "expert_ensemble_refiner"
      }
    });

    res.json({
      success: true,
      imageUrl: output[0],
      model,
      prompt
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

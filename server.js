import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // npm install node-fetch@3

const app = express();
const port = process.env.PORT || 10000;
const replicate_api_token = 'rnd_89eRpzzTKeMYQETE5npl4M1uMWlP';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'AI Image Proxy Service',
    endpoints: {
      generate: 'POST /generate'
    }
  });
});

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicate_api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '1f0df7180c9e9ebcd61cfc6d74c4ea9f63e6afbf011b5c342a150858eaa7f1c7',
        input: {
          prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          refine: 'expert_ensemble_refiner'
        }
      })
    });

    const prediction = await response.json();

    // Poll until generation completes
    let result;
    while (!result || result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicate_api_token}`,
          'Content-Type': 'application/json'
        }
      });
      result = await poll.json();
    }

    res.json({
      success: true,
      imageUrl: result.output[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Generation failed', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

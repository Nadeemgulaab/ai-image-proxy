require('dotenv').config();
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Proxy endpoint for Replicate API
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: { prompt }
      },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const predictionId = response.data.id;
    let prediction;
    let attempts = 0;
    const maxAttempts = 30;

    // Poll for results
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: { 'Authorization': `Token r8_EAzVBmrrhHMpsklD3ofB65BIkPMJIJA3iCc4E` }
        }
      );
      
      prediction = statusResponse.data;
      if (prediction.status === 'succeeded') {
        return res.json({ imageUrl: prediction.output[0] });
      } else if (prediction.status === 'failed') {
        throw new Error("Generation failed");
      }
      attempts++;
    }
    throw new Error("Timeout - try again later");

  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

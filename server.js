const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: "Prompt missing" });

    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const buffer = await response.buffer();
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/replicate", async (req, res) => {
  try {
    const { version, input } = req.body;
    if (!version || !input) return res.status(400).json({ error: "Missing parameters" });

    const predictionResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: "Token r8_EAzVBmrrhHMpsklD3ofB65BIkPMJIJA3iCc4E",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version, input }),
    });

    if (!predictionResponse.ok) {
      const errText = await predictionResponse.text();
      return res.status(predictionResponse.status).json({ error: errText });
    }

    const prediction = await predictionResponse.json();

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusResponse = await fetch(prediction.url, {
        headers: { Authorization: "Token r8_EAzVBmrrhHMpsklD3ofB65BIkPMJIJA3iCc4E" },
      });
      const statusJson = await statusResponse.json();
      if (statusJson.status === "succeeded") {
        res.json(statusJson);
        return;
      }
      if (statusJson.status === "failed") {
        return res.status(500).json({ error: "Prediction failed" });
      }
    }

    return res.status(504).json({ error: "Prediction timeout" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

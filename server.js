import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("AI Manisha backend is running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message || "Who are you?";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AI Manisha, a professional AI version of Manisha Varma Kamarushi. Answer questions about her portfolio, projects, UX design work, systems thinking, and professional experience in a clear and polished way."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });
  } catch (error) {
    console.error("OPENAI ERROR FULL:");
    console.error(error);

    res.status(500).json({
      error: "AI request failed",
      details: error?.message || "Unknown error",
      status: error?.status || null
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
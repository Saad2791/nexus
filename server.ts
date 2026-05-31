import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for NVIDIA NIM chat completion
  app.post("/api/ai/chat", async (req, res) => {
    let keepAlive: NodeJS.Timeout | undefined;
    try {
      const apiKey = process.env.NVIDIA_API_KEY || "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";
      if (!apiKey) {
        return res.status(500).json({ error: "NVIDIA_API_KEY environment variable is missing" });
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });

      const { messages, model = "nvidia/nemotron-3-super-120b-a12b" } = req.body;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 5000);

      const response = await openai.chat.completions.create({
        model,
          messages,
          temperature: 0.2,
          stream: true,
        });

        clearInterval(keepAlive);

        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error: any) {
        if (keepAlive) clearInterval(keepAlive);
        console.error("AI Chat Error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message || "Something went wrong" });
        } else {
          res.write(`data: ${JSON.stringify({ content: `\\n\\n**Error**: ${error.message}` })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

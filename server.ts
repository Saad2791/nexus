import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

const upload = multer({ storage: multer.memoryStorage() });

const SYSTEM_PROMPT = `You are SaadGPT Smart Marking AI, an expert Cambridge O Level and IGCSE examiner.

Your responsibility is to accurately assess student answers strictly according to the provided mark scheme. Be EXTREMELY STRICT and follow the official Cambridge marking principles.

You must:
1. FIRST, carefully read and extract the text from the provided question, mark scheme, and student answer images/files. Think step-by-step about what the student actually wrote vs what the mark scheme requires.
2. STRICTLY evaluate the student's answer based ONLY on the provided mark scheme. Do not award marks for correct information if it is not in the mark scheme.
3. Award marks exactly as an examiner would. Give partial marks when deserved.
4. Be strict, fair, and consistent.

You MUST format your response EXACTLY as follows. Give ONLY the results, mistakes, and corrections:

━━━━━━━━━━━━━━━━━━━━
### RESULTS

**Score:** X / Y
**Percentage:** XX%
**Grade Estimate:** A* / A / B / C / D / E / U

━━━━━━━━━━━━━━━━━━━━
### MISTAKES

* List the specific mark points the student missed according to the mark scheme.
* Explain exactly where they lost marks by quoting their answer and the mark scheme.
* (If full marks are achieved, simply state: "No mistakes. Excellent work.")

━━━━━━━━━━━━━━━━━━━━
### CORRECTION (Model Answer)

* Provide a perfectly constructed, full-mark answer that hits every required point in the mark scheme.`;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // API route for smart marking (supports files and text)
  app.post("/api/ai/mark", upload.any(), async (req, res) => {
    let keepAlive: NodeJS.Timeout | undefined;
    try {
      const { questionText, maxMarks, markSchemeText, studentAnswerText } = req.body;
      const files = (req.files as Express.Multer.File[]) || [];

      // Fallback to GROQ OR NVIDIA if GEMINI is not set, though Gemini is preferred.
      // Wait we MUST use Gemini API.
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required to use the Smart Marking feature with attachments." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts: any[] = [];
      let promptText = `Please evaluate the following. If max marks are not explicitly stated, please infer them from the question content or assume a standard reasonable maximum.\n\n`;
      parts.push({ text: promptText });
      
      const questionFile = files.find(f => f.fieldname === 'questionFile');
      const markSchemeFile = files.find(f => f.fieldname === 'markSchemeFile');
      const answerFile = files.find(f => f.fieldname === 'answerFile');

      parts.push({ text: "QUESTION:" });
      if (questionFile) {
        parts.push({
          inlineData: {
            data: questionFile.buffer.toString('base64'),
            mimeType: questionFile.mimetype
          }
        });
      } else {
        parts.push({ text: "No question provided." });
      }

      parts.push({ text: "\n\nMARK SCHEME:" });
      if (markSchemeFile) {
        parts.push({
          inlineData: {
            data: markSchemeFile.buffer.toString('base64'),
            mimeType: markSchemeFile.mimetype
          }
        });
      } else {
        parts.push({ text: "Please use your expert knowledge to infer standard Cambridge mark points." });
      }

      parts.push({ text: "\n\nSTUDENT ANSWER:" });
      if (answerFile) {
        parts.push({
          inlineData: {
            data: answerFile.buffer.toString('base64'),
            mimeType: answerFile.mimetype
          }
        });
      } else {
        parts.push({ text: "No student answer provided." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      keepAlive = setInterval(() => res.write(': keepalive\n\n'), 5000);

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      clearInterval(keepAlive);

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
      
    } catch (error: any) {
      if (keepAlive) clearInterval(keepAlive);
      console.error("Gemini Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Something went wrong" });
      } else {
        const errorMessage = "\\n\\n**Error**: " + error.message;
        res.write(`data: ${JSON.stringify({ content: errorMessage })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  });

  // API route for document parsing
  app.post("/api/parse-document", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const file = req.file;
      let text = "";

      if (file.mimetype === 'application/pdf') {
        try {
          const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
          const result = await parser.getText();
          text = result.text;
          if (!text || text.trim() === '') {
            text = `File name: ${file.originalname}. (PDF appears to be scanned or contains no extractable text. Please assist based on the topic/filename).`;
          }
        } catch (err) {
          text = `File name: ${file.originalname}. (PDF parsing failed. Please assist based on the topic/filename).`;
        }
      } else if (file.mimetype.includes('text') || file.originalname.endsWith('.txt') || file.originalname.endsWith('.md')) {
        text = file.buffer.toString('utf-8');
      } else {
        // Fallback for unsupported formats
        text = `File name: ${file.originalname}. (Content cannot be fully parsed, but please assist based on the topic).`;
      }
      
      // Limit text length to prevent context window overflow (e.g., 25000 chars)
      text = text.trim().substring(0, 25000);

      res.json({ text });
    } catch (error: any) {
      console.error("Document Parse Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong while parsing the document" });
    }
  });

  // API route for AI chat completion
  app.post("/api/ai/chat", async (req, res) => {
    let keepAlive: NodeJS.Timeout | undefined;
    try {
      const groqApiKey = process.env.GROQ_API_KEY;
      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      
      const apiKey = groqApiKey || nvidiaApiKey;
      const baseURL = groqApiKey ? "https://api.groq.com/openai/v1" : "https://integrate.api.nvidia.com/v1";
      const defaultModel = groqApiKey ? "llama-3.3-70b-versatile" : "nvidia/nemotron-3-super-120b-a12b";

      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
      });

      const { messages, model = defaultModel } = req.body;

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

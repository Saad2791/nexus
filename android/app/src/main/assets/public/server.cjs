var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_openai = __toESM(require("openai"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_pdf_parse = require("pdf-parse");
var import_genai = require("@google/genai");
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
var SYSTEM_PROMPT = `You are SaadGPT Smart Marking AI, an expert Cambridge O Level and IGCSE examiner.

Your responsibility is to accurately assess student answers strictly according to the provided mark scheme. Be EXTREMELY STRICT and follow the official Cambridge marking principles.

You must:
1. FIRST, carefully read and extract the text from the provided question, mark scheme, and student answer images/files. Think step-by-step about what the student actually wrote vs what the mark scheme requires.
2. STRICTLY evaluate the student's answer based ONLY on the provided mark scheme. Do not award marks for correct information if it is not in the mark scheme.
3. Award marks exactly as an examiner would. Give partial marks when deserved.
4. Be strict, fair, and consistent.

You MUST format your response EXACTLY as follows. Give ONLY the results, mistakes, and corrections:

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
### RESULTS

**Score:** X / Y
**Percentage:** XX%
**Grade Estimate:** A* / A / B / C / D / E / U

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
### MISTAKES

* List the specific mark points the student missed according to the mark scheme.
* Explain exactly where they lost marks by quoting their answer and the mark scheme.
* (If full marks are achieved, simply state: "No mistakes. Excellent work.")

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
### CORRECTION (Model Answer)

* Provide a perfectly constructed, full-mark answer that hits every required point in the mark scheme.`;
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
  app.use(import_express.default.json());
  app.post("/api/ai/mark", upload.any(), async (req, res) => {
    let keepAlive;
    try {
      const { questionText, maxMarks, markSchemeText, studentAnswerText } = req.body;
      const files = req.files || [];
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required to use the Smart Marking feature with attachments." });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const parts = [];
      let promptText = `Please evaluate the following. If max marks are not explicitly stated, please infer them from the question content or assume a standard reasonable maximum.

`;
      parts.push({ text: promptText });
      const questionFile = files.find((f) => f.fieldname === "questionFile");
      const markSchemeFile = files.find((f) => f.fieldname === "markSchemeFile");
      const answerFile = files.find((f) => f.fieldname === "answerFile");
      parts.push({ text: "QUESTION:" });
      if (questionFile) {
        parts.push({
          inlineData: {
            data: questionFile.buffer.toString("base64"),
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
            data: markSchemeFile.buffer.toString("base64"),
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
            data: answerFile.buffer.toString("base64"),
            mimeType: answerFile.mimetype
          }
        });
      } else {
        parts.push({ text: "No student answer provided." });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      keepAlive = setInterval(() => res.write(": keepalive\n\n"), 5e3);
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });
      clearInterval(keepAlive);
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}

`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      if (keepAlive) clearInterval(keepAlive);
      console.error("Gemini Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Something went wrong" });
      } else {
        const errorMessage = "\\n\\n**Error**: " + error.message;
        res.write(`data: ${JSON.stringify({ content: errorMessage })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    }
  });
  app.post("/api/parse-document", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const file = req.file;
      let text = "";
      if (file.mimetype === "application/pdf") {
        try {
          const parser = new import_pdf_parse.PDFParse({ data: new Uint8Array(file.buffer) });
          const result = await parser.getText();
          text = result.text;
          if (!text || text.trim() === "") {
            text = `File name: ${file.originalname}. (PDF appears to be scanned or contains no extractable text. Please assist based on the topic/filename).`;
          }
        } catch (err) {
          text = `File name: ${file.originalname}. (PDF parsing failed. Please assist based on the topic/filename).`;
        }
      } else if (file.mimetype.includes("text") || file.originalname.endsWith(".txt") || file.originalname.endsWith(".md")) {
        text = file.buffer.toString("utf-8");
      } else {
        text = `File name: ${file.originalname}. (Content cannot be fully parsed, but please assist based on the topic).`;
      }
      text = text.trim().substring(0, 25e3);
      res.json({ text });
    } catch (error) {
      console.error("Document Parse Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong while parsing the document" });
    }
  });
  app.post("/api/ai/chat", async (req, res) => {
    let keepAlive;
    try {
      const groqApiKey = process.env.GROQ_API_KEY;
      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      const apiKey = groqApiKey || nvidiaApiKey;
      const baseURL = groqApiKey ? "https://api.groq.com/openai/v1" : "https://integrate.api.nvidia.com/v1";
      const defaultModel = groqApiKey ? "llama-3.3-70b-versatile" : "nvidia/nemotron-3-super-120b-a12b";
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }
      const openai = new import_openai.default({
        apiKey,
        baseURL
      });
      const { messages, model = defaultModel } = req.body;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      keepAlive = setInterval(() => {
        res.write(": keepalive\n\n");
      }, 5e3);
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.2,
        stream: true
      });
      clearInterval(keepAlive);
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}

`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      if (keepAlive) clearInterval(keepAlive);
      console.error("AI Chat Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Something went wrong" });
      } else {
        res.write(`data: ${JSON.stringify({ content: `\\n\\n**Error**: ${error.message}` })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

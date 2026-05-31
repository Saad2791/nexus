import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

async function main() {
  const start = Date.now();
  console.log("Starting...");
  try {
    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b",
      messages: [{ role: "user", content: "GIVE ME 10 HARDEST CS 2210 QUESTIONS" }],
      temperature: 0.2,
      max_tokens: 1024,
      stream: true,
    });
    console.log("Got response object in", Date.now() - start, "ms");
    for await (const chunk of response) {
      console.log("First chunk in", Date.now() - start, "ms");
      break;
    }
  } catch(e: any) {
    console.error(e.message);
  }
}
main();

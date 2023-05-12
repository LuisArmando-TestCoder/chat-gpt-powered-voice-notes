import express from "express";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import crypto from "crypto";
import cors from "cors";
import fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

const corsOptions = {
  origin: ["https://houseofsenses.netlify.app", "http://localhost:8000"],
  methods: ["GET", "POST"],
  credentials: true,
  optionsSuccessStatus: 200  // For legacy browser support
};

app.use(cors(corsOptions));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received a ${req.method} request to ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Welcome to the OpenAI server!");
});

app.get("/voice-note", async ({ query: {  note } }, res) => {
  console.log("Received voice note.", note);

  const configuration = new Configuration({
    // organization: process.env.OPENAI_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const messages = [
    {
      role: "system",
      content: "You are functioning as a voice note summarizer. Your role is to process the received content, correct any grammatical errors, and present a clear and concise summary. Your task is to ensure clarity and coherence in all the information that was spoken. Furthermore, you are responsible for presenting everything in a well-structured markdown format.",
    },
    {
      role: "user",
      content: note
    }
  ];

  const completion = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: messages.map(({ content }) => content),
    max_tokens: 1024,
    n: 1,
    stop: ["User:"],
    temperature: 0.8,
  });

  const summarizedVoiceNote = completion.data.choices[0].text;
  console.log(`ChatGPT: ${summarizedVoiceNote}`);

  messages.push({
    role: "assistant",
    content: summarizedVoiceNote as string,
  });

  // save voice note file with fs
  const hash = crypto
    .createHash("sha256")
    .update(summarizedVoiceNote as string)
    .digest("base64");

  const notesDirectory = '../notes';

  if (!fs.existsSync(notesDirectory)){
    fs.mkdirSync(notesDirectory);
  }
  fs.writeFileSync(`${notesDirectory}/${hash}.txt`, summarizedVoiceNote as string);

  res.json({ message: "Voice note processed.", summarizedVoiceNote });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

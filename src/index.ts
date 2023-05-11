import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server);

app.get("/", (req, res) => {
  res.send("Welcome to the Socket.io server!");
});

io.on("connection", async (socket) => {
  console.log("A user connected.");

  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const messages = [
    {
      role: "system",
      content: "You are functioning as a voice note summarizer. Your role is to process the received content, correct any grammatical errors, and present a clear and concise summary. Your task is to ensure clarity and coherence in all the information that was spoken. Furthermore, you are responsible for presenting everything in a well-structured markdown format.",
    },
  ];

  socket.on("disconnect", () => {
    console.log("A user disconnected.");
  });

  socket.on("voice note", async (content) => {
    console.log(`Message received: ${content}`);

    messages.push({ role: "user", content });

    const completion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: messages,
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

    io.emit("summarized voice note", summarizedVoiceNote);

    // save voice note file with fs
    const hash = crypto
      .createHash("sha256")
      .update(summarizedVoiceNote as string)
      .digest("base64");

    const notesDirectory = '../../notes';

    if (!fs.existsSync(notesDirectory)){
      fs.mkdirSync(notesDirectory);
    }
    fs.writeFileSync(`${notesDirectory}/${hash}.txt`, summarizedVoiceNote as string);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

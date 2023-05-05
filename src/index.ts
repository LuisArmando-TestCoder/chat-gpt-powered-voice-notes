import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'http';
import * as openai from 'openai';
import * as recorder from 'node-record-lpcm16';
import * as speech from '@google-cloud/speech';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const main = async () => {
  // Initialize Google Speech-to-Text client
  const speechClient = new speech.SpeechClient();

  // Initialize OpenAI GPT-3 API client
  openai.apiKey = process.env.OPENAI_API_KEY!;

  while (true) {
    console.log('Listening for voice input...');

    const voiceNote = await listenForVoiceNote(speechClient);

    console.log('Voice note:');
    console.log(voiceNote);

    const command = await listenForCommand(speechClient);

    if (command === 'save') {
      const currentDate = new Date().toISOString().split('T')[0];
      const topic = extractTopic(voiceNote);
      const fileName = `${currentDate}_${topic}.txt`;
      const filePath = path.join(__dirname, 'voice-notes', fileName);
      saveVoiceNote(filePath, voiceNote);
      console.log('Voice note saved.');
    } else if (command === 'discard') {
      console.log('Voice note discarded.');
    }
  }
};

const listenForVoiceNote = async (
  speechClient: speech.SpeechClient
): Promise<string> => {
  return new Promise((resolve) => {
    const recording = recorder.record({
      sampleRate: 16000,
      threshold: 0.5,
      silence: '3.0',
      device: 'default',
    });

    let voiceNote = '';

    const stream = recording.stream().on('data', async (chunk: Buffer) => {
      const transcribedText = await transcribeSpeech(chunk, speechClient);
      voiceNote += transcribedText;
    });

    stream.on('end', () => {
      resolve(voiceNote);
    });
  });
};

const listenForCommand = async (
  speechClient: speech.SpeechClient
): Promise<string> => {
  return new Promise((resolve) => {
    const recording = recorder.record({
      sampleRate: 16000,
      threshold: 0.5,
      silence: '1.0',
      device: 'default',
    });

    const stream = recording.stream().on('data', async (chunk: Buffer) => {
      const transcribedText = await transcribeSpeech(chunk, speechClient);

      if (transcribedText.toLowerCase().includes('save')) {
        stream.end();
        resolve('save');
      } else if (transcribedText.toLowerCase().includes('discard')) {
        stream.end();
        resolve('discard');
      }
    });
  });
};

const transcribeSpeech = async (
  chunk: Buffer,
  speechClient: speech.SpeechClient
): Promise<string> => {
  // Prepare the request
  const request = {
    audio: {
      content: chunk.toString('base64'),
    },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
  };

  // Send the request to the API
  const [response] = await speechClient.recognize(request);
  const transcription = response.results
    ?.map((result) => result.alternatives?.[0].transcript)
    .join('\n');

  return transcription || '';
};

const extractTopic = (text: string): string => {
    // You can implement a custom logic to extract the topic from the voice note content.
    // For simplicity, this example uses the first few words as the topic.
    const words = text.split(/\s+/);
    return words.slice(0, 3).join('_');
    };
    
    const saveVoiceNote = (filePath: string, content: string) => {
    fs.writeFileSync(filePath, content);
    };
    
    main().catch((error) => {
    console.error(error);
    });
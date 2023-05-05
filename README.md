# Voice Interface with GPT-3 and Google Speech-to-Text

This project is a voice interface built with TypeScript that listens for voice input, transcribes it using Google Speech-to-Text, refines the text using OpenAI GPT-3, and saves or discards the voice note based on the user's command.
## Prerequisites 
- [Node.js](https://nodejs.org/)  installed 
- A Google Cloud account with access to the [Speech-to-Text API](https://cloud.google.com/speech-to-text) 
- An OpenAI API key for [GPT-3](https://beta.openai.com/)
## Setup 
1. Clone the repository to your local machine. 
2. Navigate to the project directory and run `npm install` to install the necessary dependencies:

```bash

npm install
``` 
3. Create a `.env` file in the project's root directory with the following content:

```makefile

OPENAI_API_KEY=your_openai_api_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_google_credentials_json_file
```



Replace `your_openai_api_key` with your actual OpenAI API key and `path_to_your_google_credentials_json_file` with the path to your Google Cloud credentials JSON file. 
4. Run the script using the following command:

```bash

npx ts-node src/index.ts
```



The script will listen for voice input, transcribe it, refine it using GPT-3, and save or discard the voice note based on the user's command. It will display the messages in the console and read them out loud until the command "save" or "discard" is spoken.
## Usage

Once the script is running, start speaking. When there is a sustained silence, the script will consider the voice note to be complete. It will then display the transcribed and refined text in the console.

To save the voice note, say "save". The voice note will be saved in a `voice-notes` directory with a file name consisting of the current date and the topic it refers to.

To discard the voice note, say "discard". The current voice note will be dropped, and the script will listen for new voice notes.
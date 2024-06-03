const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const FormData = require('form-data');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fetch = require('node-fetch');
const { uploadToGCS, downloadFromGCS } = require('./gcsUtils');

ffmpeg.setFfmpegPath(require('ffmpeg-static'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function downloadAudio(url) {
  const timerLabel = `Download Audio ${Date.now()}`; // Unique timer label
  console.time(timerLabel);
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
    });
    const videoTitle = info.title;
    const channelName = info.uploader;
    const videoViews = info.view_count;
    const uniqueNumber = Date.now();
    const folderName = `${channelName}_${videoTitle}_${uniqueNumber}`.replace(
      /[^a-zA-Z0-9-_]/g,
      '_',
    );
    const outputPath = path.join(__dirname, 'downloads', folderName);
    fs.mkdirSync(outputPath, { recursive: true });

    const audioPath = path.join(outputPath, 'audio.mp3');

    console.log('Downloading audio...');
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath,
    });

    console.log('Audio downloaded and saved as MP3');

    await uploadToGCS(audioPath, `audio/${folderName}/audio.mp3`);

    console.timeEnd(timerLabel);
    return {
      audioPath: `gs://${process.env.BUCKET_NAME}/audio/${folderName}/audio.mp3`,
      videoTitle,
      channelName,
      videoViews,
    };
  } catch (error) {
    console.timeEnd(timerLabel);
    console.error('Error in downloadAudio:', error.message);
    if (error.message.includes('Status code: 410')) {
      throw new Error('The video is no longer available.');
    } else {
      throw error;
    }
  }
}

async function transcribeAudio(gcsUri) {
  console.log('Starting transcribeAudio');
  console.time('Transcribe Audio');
  const localPath = path.join(__dirname, 'downloads', 'temp_audio.mp3');
  await downloadFromGCS(gcsUri, localPath);
  const form = new FormData();
  form.append('file', fs.createReadStream(localPath));
  form.append('model', 'whisper-1');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });
    const data = await response.json();
    console.timeEnd('Transcribe Audio');
    const transcript = data.text;
    console.log('Transcript:', transcript);
    return transcript;
  } catch (error) {
    console.timeEnd('Transcribe Audio');
    console.error('Error during transcription:', error.message);
    throw error;
  }
}

async function generateIngredientList(transcript) {
  console.log('Starting generateIngredientList');
  console.time('Generate Ingredients');
  try {
    const prompt = `Extract the list of ingredients from the following recipe transcript and suggest items to order from Instacart or Amazon:\n\n${transcript}\n\nIngredients:`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 1,
        n: 1,
        stop: null,
      }),
    });

    const data = await response.json();
    console.log('Full response:', JSON.stringify(data, null, 2)); // Log the entire response

    const ingredients = data.choices[0].message.content.trim().split('\n');
    console.timeEnd('Generate Ingredients');
    console.log('Ingredients:', ingredients);
    return ingredients;
  } catch (error) {
    console.timeEnd('Generate Ingredients');
    console.error('Error generating ingredients:', error.message);
    throw error;
  }
}

async function summarizeRecipe(transcript) {
  console.log('Starting summarizeRecipe');
  console.time('Summarize Recipe');
  try {
    const prompt = `Summarize the following recipe transcript into clear and concise steps:\n\n${transcript}\n\nSummary:`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 1,
        n: 1,
        stop: null,
      }),
    });

    const data = await response.json();
    console.log('Full response:', JSON.stringify(data, null, 2)); // Log the entire response

    const summary = data.choices[0].message.content.trim();
    console.timeEnd('Summarize Recipe');
    console.log('Summary:', summary);
    return summary;
  } catch (error) {
    console.timeEnd('Summarize Recipe');
    console.error('Error summarizing recipe:', error.message);
    throw error;
  }
}

module.exports = { downloadAudio, transcribeAudio, generateIngredientList, summarizeRecipe };

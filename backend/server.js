// serer.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {
  downloadAudio,
  transcribeAudio,
  generateIngredientList,
  summarizeRecipe,
} = require('./convertVideoToText');
const path = require('path');

const app = express();
const port = process.env.PORT || 5001;

console.log(`Bucket Name: ${process.env.BUCKET_NAME}`);

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.post('/process-video', async (req, res) => {
  console.log('Received /process-video request');
  const { url } = req.body;
  console.log('URL received:', url);

  try {
    const { audioPath, videoTitle, channelName, videoViews } = await downloadAudio(url);
    console.log('Audio download complete:', audioPath);

    const transcript = await transcribeAudio(audioPath);
    console.log('Transcription complete:', transcript);

    const ingredients = await generateIngredientList(transcript);
    console.log('Ingredient list generated:', ingredients);

    const summary = await summarizeRecipe(transcript);
    console.log('Recipe summary generated:', summary);

    res.send({
      message: 'Video processed successfully',
      ingredients,
      summary,
      videoTitle,
      channelName,
      videoViews,
    });
  } catch (error) {
    console.error('Error processing video:', error);
    if (error.message.includes('The video is no longer available.')) {
      res.status(410).send({ message: 'The video is no longer available.' });
    } else {
      res
        .status(500)
        .send({ message: 'An error occurred while processing the video.', error: error.message });
    }
  }
});

// Fallback for serving the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

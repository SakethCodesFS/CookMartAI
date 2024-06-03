require('dotenv').config();
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
const corsOptions = {
  origin: 'https://cookmartai.onrender.com',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.post('/process-video', async (req, res) => {
  console.log('Received /process-video request');
  const { url } = req.body;
  try {
    const { audioPath, videoTitle, channelName, videoViews } = await downloadAudio(url);
    const transcript = await transcribeAudio(audioPath);
    const ingredients = await generateIngredientList(transcript);
    const summary = await summarizeRecipe(transcript);
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
    res.status(500).send({ message: 'Error processing video', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

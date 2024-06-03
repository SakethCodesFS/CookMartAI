require('dotenv').config();
console.log('Environment Variables:', process.env);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { processVideo } = require('./convertVideoToText');

const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(cors());

app.post('/process-video', async (req, res) => {
  console.log('Received /process-video request');
  const { url } = req.body;
  try {
    const { ingredients, summary, videoTitle, channelName, videoViews } = await processVideo(url);
    res.send({
      message: 'Video processed successfully',
      ingredients,
      summary,
      videoTitle,
      channelName,
      videoViews,
    });
  } catch (error) {
    console.error('Error processing video:', error.message);
    res.status(500).send({ message: 'Error processing video', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

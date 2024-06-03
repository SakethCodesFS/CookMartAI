require('dotenv').config();
console.log('Environment Variables:', process.env);
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { processVideo } = require('./convertVideoToText');

const app = express();
const port = process.env.PORT || 5001;

const corsOptions = {
  origin: 'https://cookmartaifrontend.onrender.com',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API routes
app.post('/process-video', async (req, res) => {
  console.log('Received /process-video request');
  const { url } = req.body;
  console.log('Received URL:', url);
  try {
    const { ingredients, summary, videoTitle, channelName, videoViews } = await processVideo(url);
    console.log('Processed video data:', {
      ingredients,
      summary,
      videoTitle,
      channelName,
      videoViews,
    });
    res.send({
      message: 'Video processed successfully',
      ingredients,
      summary,
      videoTitle,
      channelName,
      videoViews,
    });
  } catch (error) {
    console.error('Error processing video:', error.message); // Ensure this line is here
    res.status(500).send({ message: 'Error processing video', error: error.message });
  }
});

// Catch-all handler for any request that doesn't match an API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

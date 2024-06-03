require('dotenv').config();
console.log('Bucket Name:', process.env.BUCKET_NAME);
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path to the credentials file
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/etc/secrets/GOOGLE_APPLICATION_CREDENTIALS';

if (!bucketName) {
  throw new Error('A bucket name is needed to use Cloud Storage.');
}

async function uploadToGCS(filePath, destination) {
  await storage.bucket(bucketName).upload(filePath, {
    destination,
    gzip: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  console.log(`${filePath} uploaded to ${bucketName}`);
}

async function downloadFromGCS(gcsUri, localPath) {
  const [bucket, ...fileParts] = gcsUri.replace('gs://', '').split('/');
  const fileName = fileParts.join('/');
  const options = {
    destination: localPath,
  };
  await storage.bucket(bucket).file(fileName).download(options);
  console.log(`Downloaded ${fileName} to ${localPath}`);
}

module.exports = { uploadToGCS, downloadFromGCS };

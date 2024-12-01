const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config');
const router = express.Router();

// Setup multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to delete an existing video from the S3 bucket
const deleteExistingVideo = async () => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Prefix: 'MainpageVideo/',  // Assuming your video is stored in this folder
  };

  const data = await s3.listObjectsV2(params).promise();
  if (data.Contents.length > 0) {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Delete: {
        Objects: data.Contents.map((item) => ({ Key: item.Key })),
      },
    };
    await s3.deleteObjects(deleteParams).promise();
    console.log('Previous video deleted from S3');
  }
};

// POST route to upload and replace the video
router.post('/add', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload new video
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `MainpageVideo/${Date.now()}_${encodeURIComponent(req.file.originalname)}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000', // Cache for 1 year (can adjust as needed)
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading video:', err.message);
        return res.status(500).json({ message: 'Failed to upload video' });
      }

      // Return the new video URL
      res.json({ videoUrl: data.Location });
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// DELETE route to remove the current video
router.delete('/delete', async (req, res) => {
  try {
    // Delete the existing video
    await deleteExistingVideo();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error.message);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

// GET route for fetching the latest video URL
router.get('/latest', async (req, res) => {
  try {
    const params = {
      Bucket: 'artsofashik',
      Prefix: 'MainpageVideo/',
    };

    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents.length === 0) {
      return res.json({ videos: [] });
    }
    
    // Construct the video URL
    const videoUrls = data.Contents.map((item) => {
      return `https://${params.Bucket}.s3.amazonaws.com/${item.Key}`;
    });
    console.log(videoUrls)

    res.json({ videos: videoUrls });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

module.exports = router;

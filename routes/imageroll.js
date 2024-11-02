const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const Image = require('../models/Imageroll'); // Assuming you have an Imageroll model in MongoDB
const router = express.Router();
const s3 = require('../aws-config'); // Configure your S3 instance here

// Set up multer to store file in memory before uploading to S3
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload new images to S3 and store URLs in MongoDB
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const imageCount = await Image.countDocuments();
    if (imageCount + req.files.length > 40) {
      return res.status(400).json({ message: 'Maximum limit of 40 images reached' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      // Upload to S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `ImageRoll/${Date.now()}_${encodeURIComponent(file.originalname)}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000', // Cache for 1 year (can adjust as needed)
      };

      const uploadResult = await s3.upload(params).promise();
      uploadedImages.push({
        filename: file.originalname,
        url: uploadResult.Location,  // Store the S3 URL
        s3Key: uploadResult.Key,     // Store the S3 key for deletion later
      });
    }

    // Save image details (URL and S3 key) to MongoDB
    const images = await Image.insertMany(uploadedImages);
    res.status(201).json(images);
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all image URLs from MongoDB
router.get('/', async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete an image from S3 and MongoDB
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete image from S3 using the stored S3 key
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: image.s3Key,  // Use the stored S3 key for deletion
    };

    await s3.deleteObject(params).promise();
    console.log('Image deleted from S3');

    // Delete image record from MongoDB
    await Image.deleteOne({ _id: req.params.id });
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;

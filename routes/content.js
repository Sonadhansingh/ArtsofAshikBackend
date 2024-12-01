const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config'); // Ensure aws-config is set up
const Content = require('../models/Content'); // Ensure this model is correctly set up
const router = express.Router();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION // Your S3 bucket region
});

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST (upload) new content
router.post('/', upload.fields([
  { name: 'mainImages', maxCount: 1 },
  { name: 'images', maxCount: 30 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const { title, description } = req.body;

    // Upload files to S3
    const mainImageUrl = req.files.mainImages ? await uploadFile(req.files.mainImages[0], 'mainImages') : undefined;
    const imageUrls = await Promise.all(req.files.images.map(file => uploadFile(file, 'images')));
    const videoUrls = await Promise.all(req.files.videos.map(file => uploadFile(file, 'videos')));

    // Create new content in the database
    const newContent = new Content({
      title,
      description,
      mainImages: mainImageUrl,
      images: imageUrls,
      videos: videoUrls
    });

    const savedContent = await newContent.save();
    res.status(201).json(savedContent);
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ message: 'Failed to upload content.' });
  }
});

// GET all content
router.get('/', async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content.' });
  }
});

// Fetch the content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    // Send back the content including S3 URLs
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content.' });
  }
});

// PUT (update) content
router.put('/:id', upload.fields([
  { name: 'mainImages', maxCount: 1 },
  { name: 'images', maxCount: 30 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Fetch the existing content
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    // Prepare an object for updated data
    const updateData = { title, description };

    // Delete old main image if a new one is uploaded
    if (req.files.mainImages && content.mainImages) {
      const oldMainImageKey = content.mainImages.split('Character/')[1];
      await deleteFileFromS3(oldMainImageKey);
      updateData.mainImages = await uploadFile(req.files.mainImages[0], 'mainImages');
    }

    // Delete old images if new ones are uploaded
    if (req.files.images && content.images.length > 0) {
      for (const oldImageUrl of content.images) {
        const oldImageKey = oldImageUrl.split('Character/')[1];
        await deleteFileFromS3(oldImageKey);
      }
      updateData.images = await Promise.all(req.files.images.map(file => uploadFile(file, 'images')));
    }

    // Delete old videos if new ones are uploaded
    if (req.files.videos && content.videos.length > 0) {
      for (const oldVideoUrl of content.videos) {
        const oldVideoKey = oldVideoUrl.split('Character/')[1];
        await deleteFileFromS3(oldVideoKey);
      }
      updateData.videos = await Promise.all(req.files.videos.map(file => uploadFile(file, 'videos')));
    }
     // Delete the content from the database
    await Content.findByIdAndDelete(req.params.id);

  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Failed to update content.' });
  }
});

// DELETE content and associated files from S3
router.delete('/:id', async (req, res) => {
  try {
    // Find the content by ID
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    // Gather all the S3 keys of the files to delete
    const s3Keys = [];

    // Add the main image key if it exists
    if (content.mainImages) {
      const mainImageKey = content.mainImages.split('Character/')[1];
      await deleteFileFromS3(mainImageKey);
    }

    // Add all image keys to delete
    if (content.images && content.images.length > 0) {
      for (const imageUrl of content.images) {
        const imageKey = imageUrl.split('Character/')[1];
        await deleteFileFromS3(imageKey);
      }
    }

    // Add all video keys to delete
    if (content.videos && content.videos.length > 0) {
      for (const videoUrl of content.videos) {
        const videoKey = videoUrl.split('Character/')[1];
        await deleteFileFromS3(videoKey);
      }
    }

    // Delete the content from the database
    await Content.findByIdAndDelete(req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Failed to delete content.' });
  }
});


// Helper function to upload file to S3
const uploadFile = (file, folder) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'artsofashik',
      Key: `Character/${folder}/${Date.now()}_${file.originalname}`, // Use specified folder for file upload
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // Cache control to optimize performance
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading file:', err);
        return reject(err);
      }
      resolve(data.Location); // Return the URL of the uploaded file
    });
  });
};

// Helper function to delete a file from S3
const deleteFileFromS3 = (key) => {
  return new Promise((resolve, reject) => {
    if (!key) {
      return resolve(); // No file to delete
    }

    const params = {
      Bucket: 'artsofashik',
      Key: `Character/${key}`,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error('Error deleting file from S3:', err);
        return reject(err);
      }
      console.log('File deleted from S3:', key);
      resolve(data);
    });
  });
};

module.exports = router;
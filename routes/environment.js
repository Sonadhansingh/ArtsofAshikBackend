const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config'); // Ensure aws-config is set up
const Environment = require('../models/Environment'); // Ensure this model is correctly set up
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
])
, async (req, res) => {
  try {

    console.log('Files received:', req.files);
    console.log('Body received:', req.body);
    
    const { title, description } = req.body;

    // Upload files to S3
    const mainImageUrl = req.files.mainImages ? await uploadFile(req.files.mainImages[0], 'mainImages') : undefined;
    const imageUrls = await Promise.all(req.files.images.map(file => uploadFile(file, 'images')));
    const videoUrls = await Promise.all(req.files.videos.map(file => uploadFile(file, 'videos')));

    // Create new content in the database
    const newEnvironment = new Environment({
      title,
      description,
      mainImages: mainImageUrl,
      images: imageUrls,
      videos: videoUrls
    });

    const savedEnvironment = await newEnvironment.save();
    res.status(201).json(savedEnvironment);
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ message: 'Failed to upload content.' });
  }
});

// GET all content
router.get('/', async (req, res) => {
  try {
    const environment = await Environment.find();
    res.json(environment);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content.' });
  }
});

// Fetch the content by ID
router.get('/:id', async (req, res) => {
  try {
    const environment = await Environment.findById(req.params.id);
    
    if (!environment) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    // Send back the content including S3 URLs
    res.json(environment);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content.' });
  }
});

// PUT (update) environment
router.put('/:id', upload.fields([
  { name: 'mainImages', maxCount: 1 },
  { name: 'images', maxCount: 30 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Fetch the existing environment data
    const environment = await Environment.findById(id);

    if (!environment) {
      return res.status(404).json({ message: 'Environment not found.' });
    }

    // Initialize the updated data object
    const updatedData = {
      title: title || environment.title,
      description: description || environment.description,
    };

    // Handle main image update
    if (req.files.mainImages) {
      if (environment.mainImages) {
        const oldMainImageKey = environment.mainImages.split('Environment/')[1];
        await deleteFileFromS3(oldMainImageKey);
      }
      updatedData.mainImages = await uploadFile(req.files.mainImages[0], 'mainImages');
    }

    // Handle images update
    if (req.files.images) {
      if (environment.images && environment.images.length > 0) {
        for (const oldImageUrl of environment.images) {
          const oldImageKey = oldImageUrl.split('Environment/')[1];
          await deleteFileFromS3(oldImageKey);
        }
      }
      updatedData.images = await Promise.all(req.files.images.map(file => uploadFile(file, 'images')));
    }

    // Handle videos update
    if (req.files.videos) {
      if (environment.videos && environment.videos.length > 0) {
        for (const oldVideoUrl of environment.videos) {
          const oldVideoKey = oldVideoUrl.split('Environment/')[1];
          await deleteFileFromS3(oldVideoKey);
        }
      }
      updatedData.videos = await Promise.all(req.files.videos.map(file => uploadFile(file, 'videos')));
    }

    // Update the environment document
    const updatedEnvironment = await Environment.findByIdAndUpdate(id, updatedData, { new: true });

    // Send the updated environment as the response
    res.json(updatedEnvironment);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({ message: 'Failed to update environment.' });
  }
});


// DELETE content and associated files from S3
router.delete('/:id', async (req, res) => {
  try {
    // Find the content by ID
    const environment = await Environment.findById(req.params.id);

    if (!environment) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    // Gather all the S3 keys of the files to delete
    const s3Keys = [];

    // Add the main image key if it exists
    if (environment.mainImages) {
      const mainImageKey = content.mainImages.split('Environment/')[1];
      await deleteFileFromS3(mainImageKey);
    }

    // Add all image keys to delete
    if (environment.images && environment.images.length > 0) {
      for (const imageUrl of environment.images) {
        const imageKey = imageUrl.split('Environment/')[1];
        await deleteFileFromS3(imageKey);
      }
    }

    // Add all video keys to delete
    if (environment.videos && environment.videos.length > 0) {
      for (const videoUrl of environment.videos) {
        const videoKey = videoUrl.split('Environment/')[1];
        await deleteFileFromS3(videoKey);
      }
    }

    // Delete the content from the database
    await Environment.findByIdAndDelete(req.params.id);

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
      Key: `Environment/${folder}/${Date.now()}_${file.originalname}`, // Use specified folder for file upload
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
      Key: `Environment/${key}`,
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

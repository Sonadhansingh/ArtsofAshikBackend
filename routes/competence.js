const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config'); // Ensure aws-config is set up
const { Competence } = require('../models/Competence'); // Correct Competence model import
const router = express.Router();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Your S3 bucket region
});

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to upload file to S3
const uploadFile = (file, folder) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'artsofashik',
      Key: `Competence/${folder}/${Date.now()}_${file.originalname}`, // Use specified folder for file upload
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
      Key: `Competence/${key}`,
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

// POST (upload) new competence with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title } = req.body;

    // Upload image to S3
    const imageUrl = req.file ? await uploadFile(req.file, 'images') : undefined;

    // Create new competence in the database
    const newCompetence = new Competence({
      title,
      image: imageUrl,
    });

    const savedCompetence = await newCompetence.save();
    res.status(201).json(savedCompetence);
  } catch (error) {
    console.error('Error uploading competence:', error);
    res.status(500).json({ message: 'Failed to upload competence.' });
  }
});

// GET all competences
router.get('/', async (req, res) => {
  try {
    const competences = await Competence.find();
    res.json(competences);
  } catch (error) {
    console.error('Error fetching competences:', error);
    res.status(500).json({ message: 'Failed to fetch competences.' });
  }
});

// GET competence by ID
router.get('/:id', async (req, res) => {
  try {
    const competence = await Competence.findById(req.params.id);

    if (!competence) {
      return res.status(404).json({ message: 'Competence not found.' });
    }

    res.json(competence);
  } catch (error) {
    console.error('Error fetching competence:', error);
    res.status(500).json({ message: 'Failed to fetch competence.' });
  }
});

// PUT (update) competence
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Fetch the existing competence
    const competence = await Competence.findById(id);

    if (!competence) {
      return res.status(404).json({ message: 'Competence not found.' });
    }

    // Prepare updated data
    const updateData = { title };

    // Delete old image if a new one is uploaded
    if (req.file && competence.image) {
      const oldImageKey = competence.image.split('Competence/')[1];
      await deleteFileFromS3(oldImageKey);
      updateData.image = await uploadFile(req.file, 'images');
    }

    // Update the competence with new data
    const updatedCompetence = await Competence.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedCompetence);
  } catch (error) {
    console.error('Error updating competence:', error);
    res.status(500).json({ message: 'Failed to update competence.' });
  }
});

// DELETE competence and associated image from S3
router.delete('/:id', async (req, res) => {
  try {
    // Find the competence by ID
    const competence = await Competence.findById(req.params.id);

    if (!competence) {
      return res.status(404).json({ message: 'Competence not found.' });
    }

    // Delete the image from S3
    if (competence.image) {
      const imageKey = competence.image.split('Competence/')[1];
      await deleteFileFromS3(imageKey);
    }

    // Delete the competence from the database
    await Competence.findByIdAndDelete(req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting competence:', error);
    res.status(500).json({ message: 'Failed to delete competence.' });
  }
});

module.exports = router;

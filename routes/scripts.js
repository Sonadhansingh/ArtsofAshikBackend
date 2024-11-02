const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config');
const Script = require('../models/Scripts');
const router = express.Router();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to upload file to S3
const uploadFile = (file, folder) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: 'artsofashik',
      Key: `Scripts/${folder}/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000',
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
      Key: `Scripts/${key}`,
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

// POST (upload) new script with image and PDF
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description } = req.body;

    // Upload image and PDF to S3
    const imageUrl = req.files.image ? await uploadFile(req.files.image[0], 'images') : undefined;
    const pdfUrl = req.files.pdf ? await uploadFile(req.files.pdf[0], 'pdf') : undefined;

    // Create new script in the database
    const newScript = new Script({
      title,
      description,
      imageUrl: imageUrl, // Ensure it matches your model field name
      pdfUrl: pdfUrl, // Ensure it matches your model field name
    });

    const savedScript = await newScript.save();
    res.status(201).json(savedScript);
  } catch (error) {
    console.error('Error uploading script:', error);
    res.status(500).json({ message: 'Failed to upload script.' });
  }
});

// GET all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.find();
    res.json(scripts);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    res.status(500).json({ message: 'Failed to fetch scripts.' });
  }
});

// GET script by ID
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found.' });
    }

    res.json(script);
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).json({ message: 'Failed to fetch script.' });
  }
});

// PUT (update) script
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Fetch the existing script
    const script = await Script.findById(id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found.' });
    }

    // Prepare updated data
    const updateData = { title, description };

    // Delete old image if a new one is uploaded
    if (req.files.image && script.imageUrl) {
      const oldImageKey = script.imageUrl.split('Scripts/')[1]; // Ensure correct splitting
      await deleteFileFromS3(oldImageKey);
      updateData.imageUrl = await uploadFile(req.files.image[0], 'images');
    }

    // Delete old PDF if a new one is uploaded
    if (req.files.pdf && script.pdfUrl) {
      const oldPdfKey = script.pdfUrl.split('Scripts/')[1]; // Ensure correct splitting
      await deleteFileFromS3(oldPdfKey);
      updateData.pdfUrl = await uploadFile(req.files.pdf[0], 'pdf');
    }

    // Update the script with new data
    const updatedScript = await Script.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedScript);
  } catch (error) {
    console.error('Error updating script:', error);
    res.status(500).json({ message: 'Failed to update script.' });
  }
});


// DELETE script and associated files from S3
router.delete('/:id', async (req, res) => {
  try {
    // Find the script by ID
    const script = await Script.findById(req.params.id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found.' });
    }

    // Delete the image from S3 if it exists
    if (script.imageUrl) {
      const imageKey = script.imageUrl.split('Scripts/')[1]; // Ensure correct splitting
      await deleteFileFromS3(imageKey);
    }

    // Delete the PDF from S3 if it exists
    if (script.pdfUrl) {
      const pdfKey = script.pdfUrl.split('Scripts/')[1]; // Ensure correct splitting
      await deleteFileFromS3(pdfKey);
    }

    // Delete the script from the database
    await Script.findByIdAndDelete(req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ message: 'Failed to delete script.' });
  }
});

module.exports = router;

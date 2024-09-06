const express = require('express');
const multer = require('multer');
const Image = require('../models/Imageroll');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload new images
router.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    const imageCount = await Image.countDocuments();
    if (imageCount + req.files.length > 30) {
      return res.status(400).json({ message: 'Maximum limit of 30 images reached' });
    }

    const newImages = req.files.map(file => ({
      filename: file.filename,
      path: file.path,
    }));

    const images = await Image.insertMany(newImages);
    res.status(201).json(images);
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get all images
router.get('/', async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete an image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // Delete image file from server
    fs.unlink(image.path, async (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ message: 'Error deleting file' });
      }

      try {
        await Image.deleteOne({ _id: req.params.id });
        res.json({ message: 'Image deleted' });
      } catch (err) {
        console.error('Error deleting image from database:', err);
        res.status(500).json({ message: 'Error deleting image from database' });
      }
    });
  } catch (err) {
    console.error('Error finding image:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

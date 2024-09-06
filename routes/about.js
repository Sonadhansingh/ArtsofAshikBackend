const express = require('express');
const router = express.Router();
const About = require('../models/About');
const multer = require('multer');
const path = require('path');

// Configure multer for image and PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Update or create an About page
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    const aboutData = {
      subheading: req.body.subheading,
      description: req.body.description,
      purpleText: req.body.purpleText,
      image: req.files['image'] ? req.files['image'][0].path : undefined,
      pdf: req.files['pdf'] ? req.files['pdf'][0].path : undefined
    };

    // Replace existing About or create new
    const existingAbout = await About.findOne();
    if (existingAbout) {
      await About.findByIdAndUpdate(existingAbout._id, aboutData, { new: true });
    } else {
      await About.create(aboutData);
    }
    res.status(200).json({ message: 'About page updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update about page', error: error.message });
  }
});

// Fetch the About page content
router.get('/', async (req, res) => {
  try {
    const about = await About.findOne();
    res.status(200).json(about);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch about page', error: error.message });
  }
});

module.exports = router;

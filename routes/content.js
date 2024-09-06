const express = require('express');
const multer = require('multer');
const Content = require('../models/Content');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/upload', upload.fields([{ name: 'mainImages', maxCount: 1 }, { name: 'images', maxCount: 15 }]), async (req, res) => {
  const { title, description } = req.body;
  const mainImages = req.files['mainImages'] ? req.files['mainImages'].map(file => file.path) : [];
  const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
  const content = new Content({ title, description, mainImages, images });

  try {
    const newContent = await content.save();
    res.status(201).json(newContent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', upload.fields([{ name: 'mainImages', maxCount: 1 }, { name: 'images', maxCount: 15 }]), async (req, res) => {
  const { title, description } = req.body;
  const mainImages = req.files['mainImages'] ? req.files['mainImages'].map(file => file.path) : [];
  const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];

  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.title = title || content.title;
    content.description = description || content.description;
    if (mainImages.length > 0) content.mainImages = mainImages;
    if (images.length > 0) content.images = images;

    const updatedContent = await content.save();
    res.json(updatedContent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Content.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).send('Content deleted successfully');
    } else {
      res.status(404).send('Content not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

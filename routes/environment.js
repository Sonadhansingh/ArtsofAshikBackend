const express = require('express');
const multer = require('multer');
const Environment = require('../models/Environment');
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
    const environments = await Environment.find();
    res.json(environments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const environment = await Environment.findById(req.params.id);
    if (!environment) {
      return res.status(404).json({ message: 'Environment not found' });
    }
    res.json(environment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/upload', upload.fields([{ name: 'mainImages', maxCount: 1 }, { name: 'images', maxCount: 15 }]), async (req, res) => {
  const { title, description } = req.body;
  const mainImages = req.files['mainImages'] ? req.files['mainImages'].map(file => file.path) : [];
  const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
  const environment = new Environment({ title, description, mainImages, images });

  try {
    const newEnvironment = await environment.save();
    res.status(201).json(newEnvironment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', upload.fields([{ name: 'mainImages', maxCount: 1 }, { name: 'images', maxCount: 15 }]), async (req, res) => {
  const { title, description } = req.body;
  const mainImages = req.files['mainImages'] ? req.files['mainImages'].map(file => file.path) : [];
  const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];

  try {
    const environment = await Environment.findById(req.params.id);
    if (!environment) {
      return res.status(404).json({ message: 'Environment not found' });
    }

    environment.title = title || environment.title;
    environment.description = description || environment.description;
    if (mainImages.length > 0) environment.mainImages = mainImages;
    if (images.length > 0) environment.images = images;

    const updatedEnvironment = await environment.save();
    res.json(updatedEnvironment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Environment.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).send('Environment deleted successfully');
    } else {
      res.status(404).send('Environment not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

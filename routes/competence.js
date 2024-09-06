const express = require('express');
const router = express.Router();
const { Competence } = require('../models/Competence');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Get all competences
router.get('/', async (req, res) => {
  try {
    const competences = await Competence.find();
    res.json(competences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new competence
router.post('/', upload.single('image'), async (req, res) => {
  const { title } = req.body;
  const image = req.file ? req.file.path : '';

  const competence = new Competence({ title, image });

  try {
    const newCompetence = await competence.save();
    res.status(201).json(newCompetence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a competence
router.put('/:id', upload.single('image'), async (req, res) => {
  const { title } = req.body;
  const image = req.file ? req.file.path : '';

  try {
    const updatedCompetence = await Competence.findByIdAndUpdate(
      req.params.id,
      { title, image },
      { new: true }
    );
    res.json(updatedCompetence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a competence
router.delete('/:id', async (req, res) => {
  try {
    await Competence.findByIdAndDelete(req.params.id);
    res.json({ message: 'Competence deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

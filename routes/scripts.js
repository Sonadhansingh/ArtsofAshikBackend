const express = require('express');
const multer = require('multer');
const Script = require('../models/Scripts');
const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.find();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new script
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  const { title, description } = req.body;
  const imageUrl = req.files.image ? req.files.image[0].path : undefined;
  const pdfUrl = req.files.pdf ? req.files.pdf[0].path : undefined;

  const script = new Script({ title, description, imageUrl, pdfUrl });

  try {
    const newScript = await script.save();
    res.status(201).json(newScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a script
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (script == null) {
      return res.status(404).json({ message: 'Script not found' });
    }

    script.title = req.body.title || script.title;
    script.description = req.body.description || script.description;
    if (req.files.image) script.imageUrl = req.files.image[0].path;
    if (req.files.pdf) script.pdfUrl = req.files.pdf[0].path;

    const updatedScript = await script.save();
    res.json(updatedScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a script
router.delete('/:id', async (req, res) => {
  try {
    const result = await Script.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).send('Script deleted successfully');
    } else {
      res.status(404).send('Script not found');
    }
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

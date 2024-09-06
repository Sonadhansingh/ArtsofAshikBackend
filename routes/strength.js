const express = require('express');
const Strength = require('../models/Strength');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const strength = await Strength.find();
    res.json(strength);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const strength = await Strength.findById(req.params.id);
    if (!strength) {
      return res.status(404).json({ message: 'Strength not found' });
    }
    res.json(strength);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, percentage } = req.body;
  const strength = new Strength({ name, percentage });

  try {
    const newStrength = await strength.save();
    res.status(201).json(newStrength);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, percentage } = req.body;

  try {
    const strength = await Strength.findById(req.params.id);
    if (!strength) {
      return res.status(404).json({ message: 'Strength not found' });
    }

    strength.name = name || strength.name;
    strength.percentage = percentage || strength.percentage;

    const updatedStrength = await strength.save();
    res.json(updatedStrength);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Strength.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).send('Strength deleted successfully');
    } else {
      res.status(404).send('Strength not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

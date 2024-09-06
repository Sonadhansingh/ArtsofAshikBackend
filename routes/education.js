const express = require('express');
const router = express.Router();
const { Education, Experience } = require('../models/Education');

// Add education
router.post('/education', async (req, res) => {
  try {
    const { degree, school, year, percentage } = req.body;
    const newEducation = await Education.create({ degree, school, year, percentage });
    res.status(200).json(newEducation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add education', error: error.message });
  }
});

// Update education
router.put('/education/:id', async (req, res) => {
  try {
    const { degree, school, year, percentage } = req.body;
    const updatedEducation = await Education.findByIdAndUpdate(req.params.id, { degree, school, year, percentage }, { new: true });
    res.status(200).json(updatedEducation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update education', error: error.message });
  }
});

// Delete education
router.delete('/education/:id', async (req, res) => {
  try {
    await Education.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Education deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete education', error: error.message });
  }
});

// Fetch all education
router.get('/education', async (req, res) => {
  try {
    const education = await Education.find();
    res.status(200).json(education);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch education', error: error.message });
  }
});

// Add experience
router.post('/experience', async (req, res) => {
  try {
    const { position, company, years, description } = req.body;
    const newExperience = await Experience.create({ position, company, years, description });
    res.status(200).json(newExperience);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add experience', error: error.message });
  }
});

// Update experience
router.put('/experience/:id', async (req, res) => {
  try {
    const { position, company, years, description } = req.body;
    const updatedExperience = await Experience.findByIdAndUpdate(req.params.id, { position, company, years, description }, { new: true });
    res.status(200).json(updatedExperience);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update experience', error: error.message });
  }
});

// Delete experience
router.delete('/experience/:id', async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Experience deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete experience', error: error.message });
  }
});

// Fetch all experience
router.get('/experience', async (req, res) => {
  try {
    const experience = await Experience.find();
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch experience', error: error.message });
  }
});

module.exports = router;

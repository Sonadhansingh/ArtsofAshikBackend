const express = require('express');
const Skill = require('../models/Skills');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, percentage } = req.body;
  const skill = new Skill({ name, percentage });

  try {
    const newSkill = await skill.save();
    res.status(201).json(newSkill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, percentage } = req.body;

  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.name = name || skill.name;
    skill.percentage = percentage || skill.percentage;

    const updatedSkill = await skill.save();
    res.json(updatedSkill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Skill.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).send('Skill deleted successfully');
    } else {
      res.status(404).send('Skill not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Query } = require('../models/Query');

// Get all queries
router.get('/', async (req, res) => {
  try {
    const queries = await Query.find();
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new query
router.post('/', async (req, res) => {
  const { name, email, inquiryType, budget, message } = req.body;

  const newQuery = new Query({ name, email, inquiryType, budget, message });

  try {
    const savedQuery = await newQuery.save();
    res.status(201).json(savedQuery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a query
router.delete('/:id', async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ message: 'Query deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

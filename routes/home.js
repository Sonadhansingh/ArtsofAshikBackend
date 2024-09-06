const express = require('express');
const router = express.Router();
const { BigText, Link } = require('../models/Home');

// Get big text
router.get('/bigText', async (req, res) => {
  try {
    const bigTexts = await BigText.find();
    res.json(bigTexts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update big text
router.post('/bigText', async (req, res) => {
  const { text } = req.body;
  try {
    let bigText = await BigText.findOne();
    if (bigText) {
      bigText.text = text;
      await bigText.save();
    } else {
      bigText = new BigText({ text });
      await bigText.save();
    }
    res.status(200).json(bigText);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get links
router.get('/link', async (req, res) => {
  try {
    const links = await Link.find();
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update links
router.post('/link', async (req, res) => {
  const { generalTitle, generalUrl, instaTitle, instaUrl } = req.body;
  try {
    let link = await Link.findOne();
    if (link) {
      link.generalTitle = generalTitle;
      link.generalUrl = generalUrl;
      link.instaTitle = instaTitle;
      link.instaUrl = instaUrl;
      await link.save();
    } else {
      link = new Link({ generalTitle, generalUrl, instaTitle, instaUrl });
      await link.save();
    }
    res.status(200).json(link);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

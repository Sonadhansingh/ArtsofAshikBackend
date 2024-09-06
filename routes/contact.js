const express = require('express');
const router = express.Router();
const { Contact, ContactDetails } = require('../models/Contact');
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

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get contact details
router.get('/details', async (req, res) => {
  try {
    const contactDetails = await ContactDetails.findOne();
    if (!contactDetails) {
      return res.status(404).json({ message: 'Contact details not found' });
    }
    res.json(contactDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update contact details
router.put('/details', async (req, res) => {
  const { phoneNumber, mainId } = req.body;

  try {
    let contactDetails = await ContactDetails.findOne();
    if (!contactDetails) {
      contactDetails = new ContactDetails({ phoneNumber, mainId });
    } else {
      contactDetails.phoneNumber = phoneNumber;
      contactDetails.mainId = mainId;
    }

    const updatedContactDetails = await contactDetails.save();
    res.json(updatedContactDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add new contact
router.post('/', upload.single('logo'), async (req, res) => {
  const { heading, contactUrl } = req.body;
  const newContact = new Contact({
    heading,
    contactUrl,
    logo: req.file ? req.file.path : null
  });

  try {
    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update contact
router.put('/:id', upload.single('logo'), async (req, res) => {
  const { heading, contactUrl } = req.body;
  const updateData = { heading, contactUrl };
  if (req.file) {
    updateData.logo = req.file.path;
  }

  try {
    const updatedContact = await Contact.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

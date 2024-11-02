const express = require('express');
const router = express.Router();
const About = require('../models/About');
const multer = require('multer');
const AWS = require('aws-sdk');
const s3 = require('../aws-config');

// Setup multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to upload files to S3
const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `Aboutpage/${Date.now()}_${encodeURIComponent(file.originalname)}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'max-age=31536000',
  };

  const data = await s3.upload(params).promise();
  return data.Location; // Return S3 file URL
};

// Helper function to delete existing files from S3
const deleteExistingFiles = async (folderName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Prefix: folderName, // Specify folder to delete files from
  };

  const data = await s3.listObjectsV2(params).promise();
  if (data.Contents.length > 0) {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Delete: {
        Objects: data.Contents.map((item) => ({ Key: item.Key })),
      },
    };
    await s3.deleteObjects(deleteParams).promise();
    console.log(`Previous files deleted from S3`);
  }
};

// POST route to create or update About page
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    let imageUrl, pdfUrl;

    // Upload new files if present
    if (req.files['image']) {
      imageUrl = await uploadFileToS3(req.files['image'][0], 'AboutpageImages');
    }
    if (req.files['pdf']) {
      pdfUrl = await uploadFileToS3(req.files['pdf'][0], 'AboutpagePDFs');
    }

    const aboutData = {
      subheading: req.body.subheading,
      description: req.body.description,
      purpleText: req.body.purpleText,
      image: imageUrl ? imageUrl : undefined,
      pdf: pdfUrl ? pdfUrl : undefined,
    };

    // Delete existing About data from the database and S3
    const existingAbout = await About.findOne();
    if (existingAbout) {
      await About.findByIdAndDelete(existingAbout._id);
      await deleteExistingFiles('AboutpageImages'); // Delete existing image
      await deleteExistingFiles('AboutpagePDFs'); // Delete existing PDF
    }

    // Create new About data
    await About.create(aboutData);
    res.status(200).json({ message: 'About page updated successfully!' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Failed to update about page', error: error.message });
  }
});

// DELETE route to remove the current About page data and associated files
router.delete('/', async (req, res) => {
  try {
    const existingAbout = await About.findOne();
    if (!existingAbout) {
      return res.status(404).json({ message: 'No about data to delete' });
    }

    // If there's an image, delete it from S3
    if (existingAbout.image) {
      const imageKey = existingAbout.image.split('.com/')[1];  // Get the S3 key
      await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: imageKey }).promise();
    }

    // If there's a PDF, delete it from S3
    if (existingAbout.pdf) {
      const pdfKey = existingAbout.pdf.split('.com/')[1];  // Get the S3 key
      await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: pdfKey }).promise();
    }

    // Remove the About document from MongoDB
    await About.findByIdAndDelete(existingAbout._id);

    res.json({ message: 'About page deleted successfully' });
  } catch (error) {
    console.error('Error deleting about page:', error.message);
    res.status(500).json({ message: 'Failed to delete about page' });
  }
});


// GET route to fetch About page content
router.get('/', async (req, res) => {
  try {
    const about = await About.findOne();
    res.status(200).json(about);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch about page', error: error.message });
  }
});

module.exports = router;

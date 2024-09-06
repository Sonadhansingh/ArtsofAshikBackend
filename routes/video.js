const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '/uploads/videos');
console.log('uploadDir', uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// POST endpoint for uploading videos
router.post('/add', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const videoUrl = req.file.path.replace(/\\/g, '/');
    res.json({ videoUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT endpoint for updating videos
router.put('/update', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Remove old video if exists
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ message: 'Unable to read video directory' });
      }

      files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
    });

    const videoUrl = req.file.path.replace(/\\/g, '/');
    res.json({ videoUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint for fetching the latest video URL
router.get('/latest', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Unable to read video directory' });
    }

    files.sort((a, b) => {
      return fs.statSync(path.join(uploadDir, b)).mtime.getTime() -
             fs.statSync(path.join(uploadDir, a)).mtime.getTime();
    });

    if (files.length === 0) {
      return res.status(404).json({ message: 'No videos found' });
    }

    const latestVideo = files[0];
    const videoUrl = `${process.env.BASE_URL}/uploads/videos/${latestVideo}`;
    res.json({ videoUrl });
  });
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const videoRoutes = require('./routes/video');  
const textLinkRoutes = require('./routes/home');
const contentRoutes = require('./routes/content');
const environmentRoutes = require('./routes/environment');
const scriptRoutes = require('./routes/scripts');
const aboutRoutes = require('./routes/about');
const educationRoutes = require('./routes/education');
const skillsRoutes = require('./routes/skills');
const strengthRoutes = require('./routes/strength');
const competencesRoutes = require('./routes/competence');
const contactRoutes = require('./routes/contact');
const imageRoutes = require('./routes/imageroll');
const queryRoutes = require('./routes/query');

const morgan = require('morgan');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Use CORS with specific origin
app.use(cors({
  origin: 'http://localhost:3001', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true, 
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/uploads/logos', express.static(path.join(__dirname, 'uploads/logos')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/textLink', textLinkRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api', educationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/strength', strengthRoutes);
app.use('/api/competence', competencesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/queries', queryRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  school: { type: String, required: true },
  year: { type: String, required: true },
  percentage: { type: String, required: true }
});

const experienceSchema = new mongoose.Schema({
  position: { type: String, required: true },
  company: { type: String, required: true },
  years: { type: String, required: true },
  description: { type: String, required: true }
});

const Education = mongoose.model('Education', educationSchema);
const Experience = mongoose.model('Experience', experienceSchema);

module.exports = { Education, Experience };

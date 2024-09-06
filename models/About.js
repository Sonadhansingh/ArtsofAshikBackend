const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  subheading: { type: String, required: true },
  description: { type: String, required: true },
  purpleText: { type: String, required: true },
  image: { type: String },
  pdf: { type: String }  // Add this line for PDF
});

module.exports = mongoose.model('About', aboutSchema);

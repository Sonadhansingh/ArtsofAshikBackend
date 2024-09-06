const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainImages: [String],
  images: [String],
});

module.exports = mongoose.model('Environment', environmentSchema);

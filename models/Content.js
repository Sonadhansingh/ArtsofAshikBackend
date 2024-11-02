const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainImages: { type: String }, // URL to the main image
  images: [{ type: String }], // URLs to additional images
  videos: [{ type: String }] // URLs to videos
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;

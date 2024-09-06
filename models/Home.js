const mongoose = require('mongoose');

const bigTextSchema = new mongoose.Schema({
  text: { type: String, required: true }
});

const linkSchema = new mongoose.Schema({
  generalTitle: { type: String, required: true },
  generalUrl: { type: String, required: true },
  instaTitle: { type: String, required: true },
  instaUrl: { type: String, required: true }
});

const BigText = mongoose.model('BigText', bigTextSchema);
const Link = mongoose.model('Link', linkSchema);

module.exports = {
  BigText,
  Link
};

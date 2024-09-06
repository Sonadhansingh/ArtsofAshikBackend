const mongoose = require('mongoose');

const competenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  }
});

const Competence = mongoose.model('Competence', competenceSchema);

module.exports = { Competence };

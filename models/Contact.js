const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  contactUrl: { type: String, required: true },
  logo: { type: String }
});

const contactDetailsSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  mainId: { type: String, required: true }
});

const Contact = mongoose.model('Contact', contactSchema);
const ContactDetails = mongoose.model('ContactDetails', contactDetailsSchema);

module.exports = { Contact, ContactDetails };

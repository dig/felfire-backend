const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;
const moment = require('moment');

const verificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  provider: { type: String, default: 'email' },
  token: { type: String, required: true },
  used: { type: Boolean, default: false },
  created: { type: Date, default: Date.now }
});

const Verification = mongoose.model('Verifications', verificationSchema);

exports.createVerification = (data) => {
  const verification = new Verification(data);
  return verification.save();
};

exports.findByUserId = (userId) => {
  return Verification.find({userId: userId});
};

exports.findByTokenAndProvider = (token, provider, expired = false) => {
  let search = {
    provider: provider,
    token: token,
    used: false
  };

  if (!expired) {
    search.created = {
      "$gt": moment().subtract(15, 'minutes')
    }; 
  }

  return Verification.find(search);
};

exports.findByUserIdAndProvider = (userId, provider, expired = false) => {
  let search = {
    userId: userId,
    provider: provider,
    used: false
  };

  if (!expired) {
    search.created = {
      "$gt": moment().subtract(15, 'minutes')
    }; 
  }

  return Verification.find(search);
};
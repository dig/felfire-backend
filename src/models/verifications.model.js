const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const verificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  provider: { type: String, default: 'email' },
  token: { type: String, required: true },
  alive: { type: Boolean, default: true },
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

exports.findByTokenAndProvider = (token, provider) => {
  return Verification.find({
    provider: provider,
    token: token
  });
};

exports.findByUserIdAndProvider = (userId, provider, alive) => {
  return Verification.find({
    userId: userId,
    provider: provider,
    alive: alive
  });
};

exports.updateByUserIdAndProvider = (userId, provider, alive, newToken) => {
  return Token.findOneAndUpdate({
    userId: userId,
    provider: provider,
    alive: alive
  }, {
    '$set': {
      token : newToken,
      created : Date.now
    }
  });
};
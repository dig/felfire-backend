const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  refreshToken: { type: String, required: true },
  userAgent: {
    browser: { type: String, required: true },
    os: { type: String, required: true }
  },
  createdBy: { type: String, required: true },
  used: { type: Date, default: Date.now },
  created: { type: Date, default: Date.now }
});

const Token = mongoose.model('Tokens', tokenSchema);

exports.createToken = (tokenData) => {
  const token = new Token(tokenData);
  return token.save();
};

exports.findByUserId = (userId) => {
  return Token.find({userId: userId});
};

exports.findByToken = (refreshToken) => {
  return Token.find({refreshToken: refreshToken});
};

exports.findByUserIdAndToken = (userId, refreshToken) => {
  return Token.findOne({
    userId: userId,
    refreshToken: refreshToken
  });
};

exports.deleteById = (tokenId) => {
  return Token.deleteOne({
    _id : tokenId
  });
};

exports.deleteByUserAgent = (userId, browser, os) => {
  return Token.deleteMany({
    userId : userId,
    userAgent : {
      browser : browser,
      os : os
    }
  });
};
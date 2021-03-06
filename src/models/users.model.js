const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  permissionLevel: { type: Number, default: 1 },
  verified: { type: Boolean, default: false },
  created: { type: Date, default: Date.now }
}, {
  collation: {
    locale: 'en',
    strength: 2
  }
});

const User = mongoose.model('Users', userSchema);

exports.createUser = (userData) => {
  const user = new User(userData);
  return user.save();
};

exports.findById = (userId) => {
  return User.find({_id: userId});
};

exports.findByEmail = (email) => {
  return User.find({email: email});
};

exports.findByUsername = (username) => {
  return User.find({username: username});
};

exports.verified = (userId) => {
  return User.findByIdAndUpdate(userId, { '$set': { verified: true } });
};
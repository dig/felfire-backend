const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  hash : { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  thumbnail: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  node: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

const Image = mongoose.model('Images', imageSchema);

exports.createImage = (data) => {
  const image = new Image(data);
  return image.save();
};

exports.findById = (imageId) => {
  return Image.find({_id: imageId});
};

exports.findByHash = (hash) => {
  return Image.find({hash: hash});
};

exports.findByUserId = (userId) => {
  return Image.find({userId: userId});
};

exports.findOneById = (imageId) => {
  return Image.findById(imageId);
};

exports.findOneByHash = (hash) => {
  return Image.findOne({hash: hash});
};

exports.findOneByIdAndUserId = (imageId, userId) => {
  return Image.findOne({
    _i: imageId,
    userId: userId
  });
};
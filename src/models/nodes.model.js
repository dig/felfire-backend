const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const nodeSchema = new Schema({
  name: { type: String, unique: true, required: true },
  host: { type: String, unique: true, required: true },
  started: { type: Date, default: Date.now },
  created: { type: Date, default: Date.now }
});

const Node = mongoose.model('Nodes', nodeSchema);

exports.createNode = (data) => {
  const node = new Node(data);
  return node.save();
};

exports.createNodeOrUpdate = (name, host) => {
  return Node.updateOne({
    name : name
  }, {
    name : name,
    host : host,
    started : new Date()
  }, {
    upsert: true,
    setDefaultsOnInsert: true
  });
};

exports.findOneByName = (name) => {
  return Node.findOne({name: name});
};
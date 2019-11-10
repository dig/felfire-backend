const UserModel = require('../models/users.model');
const crypto = require('crypto');

exports.insert = (req, res) => {
  let salt = crypto.randomBytes(16).toString('base64');
  let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest('base64');

  req.body.password = hash;
  req.body.salt = salt;
  req.body.permissionLevel = 1;
  req.body.created = Date.now;

  UserModel.createUser(req.body)
    .then((result) => {
      res.status(201).send({id: result._id});
    });
};
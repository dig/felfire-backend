const UserModel = require('../../models/users.model');
const crypto = require('crypto');

exports.isPasswordAndUserMatch = (req, res, next) => {
  UserModel.findByEmail(req.body.email).then((user) => {
    if (!user[0]) {
      return res.status(400).send({error: 'invalid email or password'});
    } else {
      let password = user[0].password;
      let salt = user[0].salt;
      let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest('base64');

      if (hash === password) {
        req.body = {
          userId: user[0]._id,
          email: user[0].email,
          permissionLevel: user[0].permissionLevel,
          username: user[0].username
        };

        return next();
      } else {
        return res.status(400).send({error: 'invalid email or password'});
      }
    }
  });
};
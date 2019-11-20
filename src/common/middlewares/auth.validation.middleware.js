const TokenModel = require('../../models/tokens.model'),
      UserModel = require('../../models/users.model');

const jwt = require('jsonwebtoken'),
    secret = require('../../../config/config.json').jwtSecret;

exports.validRefreshNeeded = async (req, res, next) => {
  try {
    let token = await TokenModel.findByToken(req.body.refreshToken);
    if (token[0]) {
      let user = await UserModel.findById(token[0].userId);

      req.body.userId = token[0].userId;
      req.body.username = user[0].username;
      req.body.email = user[0].email;

      return next();
    } else {
      return res.status(400).send({error: 'Invalid refresh token.'});
    }
  } catch (err) {
    return res.status(400).send({error: 'Invalid refresh token.'});
  }
};

exports.validJWTNeeded = (req, res, next) => {
  if (req.headers['authorization']) {
    try {
      let authorization = req.headers['authorization'].split(' ');

      if (authorization[0] !== 'Bearer') {
        return res.status(401).send();
      } else {
        req.jwt = jwt.verify(authorization[1], secret);
        return next();
      }
    } catch (err) {
      return res.status(403).send();
    }
  } else {
    return res.status(401).send();
  }
};
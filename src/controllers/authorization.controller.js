const TokenModel = require('../models/tokens.model');
const { body, validationResult } = require('express-validator');

const jwtSecret = require('../../config/config.json').jwtSecret,
    jwt = require('jsonwebtoken'),
    crypto = require('crypto');

exports.validate = (method) => {
  switch (method) {
    case 'login': {
      return [ 
        body('email', 'Email doesn\'t exist')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid email format')
          .isLength({ min: 5, max: 48 }).withMessage('Email must be minimum 5 characters and maximum 48 characters.'),
        body('password', 'Password doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 4, max: 60 }).withMessage('Password must be minimum 4 characters and maximum 60 characters.')
      ]   
    }

    case 'refresh': {
      return [ 
        body('refreshToken', 'Refresh token doesn\'t exist')
          .exists()
          .isString()
      ]   
    }
  }
}

exports.login = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    if (req.body.verified) {
      try {
        //--- Access token
        let payload = {
          userId : req.body.userId,
          username : req.body.username,
          email : req.body.email,
          permissionLevel : req.body.permissionLevel
        };
        let token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  
        //--- Refresh token
        let randomBytes = crypto.randomBytes(12).toString('base64');
        let hash = crypto.createHmac('sha512', randomBytes).update(req.body.userId + jwtSecret).digest('base64');
        let b = Buffer.from(hash);
        let refreshToken = b.toString('base64');
  
        TokenModel.deleteByUserAgent(req.body.userId, req.useragent.browser, req.useragent.os).then(() => {
          TokenModel.createToken({
            userId : req.body.userId,
            refreshToken : refreshToken,
            userAgent : {
              browser : req.useragent.browser,
              os : req.useragent.os
            },
            createdBy :  req.header('x-forwarded-for') || req.connection.remoteAddress
          }).then((result) => {
            res.status(201).send({
              username: req.body.username,
              accessToken: token, 
              refreshToken: refreshToken
            });
          });
        });
      } catch (err) {
        res.status(500).send({errors: err});
      }
    } else {
      res.status(201).send({email: req.body.email, verified: false});
    }
  }
};

exports.refresh_token = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    try {
      //--- Access token
      let payload = {
        userId : req.body.userId,
        username : req.body.username,
        email : req.body.email,
        permissionLevel : req.body.permissionLevel
      };
      let token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

      res.status(201).send({
        username: req.body.username,
        email: req.body.email,
        accessToken: token
      });
    } catch (err) {
      res.status(500).send({errors: err});
    }
  }
};
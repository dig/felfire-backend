const UserModel = require('../models/users.model');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

exports.validate = (method) => {
  switch (method) {
    case 'insert': {
      return [ 
        body('username', 'username doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 2, max: 16 }).withMessage('Must be between 2 and 16 characters.')
          .custom(val => {
            return UserModel.findByUsername(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Username already exists.'),
        body('email', 'email doesn\'t exist')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid format.')
          .isLength({ min: 5, max: 48 }).withMessage('Must be between 5 and 48 characters.')
          .custom(val => {
            return UserModel.findByEmail(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Email already exists.'),
        body('password', 'password doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 5, max: 60 }).withMessage('Must be between 5 and 60 characters.')
      ]   
    }
  }
}

exports.insert = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest('base64');
  
    UserModel.createUser({
      username : req.body.username,
      email : req.body.email,
      password : hash,
      salt : salt
    }).then((result) => {
      res.status(201).send();
    });
  }
};
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
          .isLength({ min: 2, max: 16 }).withMessage('username must be minimum 2 characters and maximum 16 characters')
          .custom(val => {
            return UserModel.findByUsername(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('username already exists'),
        body('email', 'email doesn\'t exist')
          .exists()
          .isString()
          .isEmail().withMessage('invalid email format')
          .isLength({ min: 5, max: 48 }).withMessage('email must be minimum 5 characters and maximum 48 characters')
          .custom(val => {
            return UserModel.findByEmail(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('email already exists'),
        body('password', 'password doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 4, max: 60 }).withMessage('password must be minimum 4 characters and maximum 60 characters')
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
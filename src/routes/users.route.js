const UsersController = require('../controllers/users.controller');
const config = require('../../config/config.json');

exports.routesConfig = function (app) {
  app.post('/users', [
    UsersController.insert
  ]);
};
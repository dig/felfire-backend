const UsersController = require('../controllers/users.controller');

exports.routesConfig = function (app) {
  app.post('/users', [
    UsersController.validate('insert'),
    UsersController.insert
  ]);
};
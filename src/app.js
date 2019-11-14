const fs = require('fs'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    Nuts = require('nuts-serve').Nuts,
    useragent = require('express-useragent'),
    sgMail = require('@sendgrid/mail'),
    config = require('../config/config.json');

const options = {
  key: fs.readFileSync('cert/cert.key'),
  cert: fs.readFileSync('cert/cert.pem'),
};

const app = express();
const upload = multer();
sgMail.setApiKey(config.email.apiKey);

app.use(upload.array()); // multipart/form-data
app.use(bodyParser.json()); // application/json
app.use(bodyParser.urlencoded({ extended: true })); // application/xwww-

app.use(useragent.express());
app.use(express.static('public'));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');

  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
});

const AuthorizationRouter = require('./routes/authorization.route');
const UsersRouter = require('./routes/users.route');

AuthorizationRouter.routesConfig(app);
UsersRouter.routesConfig(app);

const server = https.createServer(options, app).listen(config.port, function() {
  console.log('Felfire backend listening on port ' + config.port);
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/views/index.html')));


//--- Nuts routing
var nuts = Nuts({
  repository: config.git.repo,
  token: config.git.token
});

app.use('/update', nuts.router);

nuts.before('download', function(download, next) {
  console.log('user is downloading', download.platform.filename, "for version", download.version.tag, "on channel", download.version.channel, "for", download.platform.type);
  next();
});
nuts.after('download', function(download, next) {
  console.log('user downloaded', download.platform.filename, "for version", download.version.tag, "on channel", download.version.channel, "for", download.platform.type);
  next();
});
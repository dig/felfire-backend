const mongoose = require('mongoose'),
    config = require('../../../config/config.json');

let count = 0;

const options = {
  autoIndex: false,
  reconnectTries: 30,
  reconnectInterval: 500,
  poolSize: 10,
  bufferMaxEntries: 0,
  useNewUrlParser: true
};

const connectWithRetry = () => {
  console.log('MongoDB connection with retry');
  let URI = `mongodb://${config.database.username}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`;
  
  mongoose.connect(URI, options).then(()=>{
    console.log('MongoDB is connected')
  }).catch(err=>{
    console.log('MongoDB connection unsuccessful, retry after 5 seconds. ', ++count);
    setTimeout(connectWithRetry, 5000)
  })
};

connectWithRetry();

exports.mongoose = mongoose;
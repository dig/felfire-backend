const pkgcloud = require('pkgcloud'),
      config = require('../../../config/config.json'),
      fs = require('fs');

const openstack = pkgcloud.storage.createClient({
  provider: 'openstack',
  username: config.openstack.id,
  password: config.openstack.password,
  authUrl: config.openstack.auth,
  tenantId: config.openstack.tenantId,
  region: config.openstack.region
});

exports.put = (localPath, container, containerPath) => {
  console.log(`put (${localPath} ${container} ${containerPath})`);
  return new Promise((resolve, reject) => {
    var readStream = fs.createReadStream(localPath);
    var writeStream = openstack.upload({
      container: container,
      remote: containerPath
    })
    .on('error', (err) => {
      console.log(`error ${err}`);
      reject(err);
    })
    .on('success', (file) => {
      console.log(`success ${file}`);
      resolve(file);
    });

    console.log(`pipe`);
    readStream.pipe(writeStream);
  });
};

exports.storage = openstack;
const OVHStorage = require('node-ovh-objectstorage'),
      config = require('../../../config/config.json');

const storage = new OVHStorage({
  username: config.openstack.id,
  password: config.openstack.password,
  authURL: config.openstack.auth,
  tenantId: config.openstack.tenantId,
  region: config.openstack.region
});

storage.connection(() => console.log('Connected to OVH OpenStack API'), (err) => console.error(err));

exports.put = (localPath, container, containerPath) => {
  return new Promise((resolve, reject) => {
    storage.object().set(localPath, `/${container}/${containerPath}`, (data) => resolve(data), (error) => reject(error));
  });
};

exports.storage = storage;
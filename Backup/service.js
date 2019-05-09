var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'TAS Node Server Service',
  description: 'TAS Node Server Service',
  script: 'C:\\inetpub\\tas-conference-demo\\server.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();
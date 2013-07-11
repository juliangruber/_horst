var Host = require('..');

var cmd = process.argv[2];
var remote = process.argv[3];

var host = Host()
  .cmd(cmd)
  .remote(remote)
  .start();

process.on('uncaughtException', function (err) {
  host.emit('err', err);
  host.stop();
});

process.on('SIGINT', function () {
  host.stop();
  process.exit();
});

process.on('exit', function () {
  host.stop();
  process.exit(host.exitCode);
});

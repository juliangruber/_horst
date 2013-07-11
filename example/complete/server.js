var horst = require('..');
var hub = horst(7000);

hub.spawn('node', [ __dirname + '/script.js' ], { meta : 'foo' });

hub.on('ps', function (ps) {
	console.log('spawned with pid ' + ps.pid);
	console.log('meta: ' + JSON.stringify(ps.meta));
	
	ps.stdout.on('data', console.log.bind(console, '[STDOUT]'));
	ps.stderr.on('data', console.log.bind(console, '[STDERR]'));
	ps.stdin.write('hey there');
	
	ps.on('exit', function (code, signal) {
		console.log('process exited with code ' + code + ' and signal ' + signal);
	})
	ps.on('respawn', function () {
		console.log('process respawned');
	});
	
	process.kill('SIGINT');
});
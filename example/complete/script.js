console.log('stdout');
console.error('stderr');

// echo stdin again
process.stdin.pipe(process.stdout);

// don't exit
require('http').createServer().listen(10000);
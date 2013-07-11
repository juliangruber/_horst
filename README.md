
# horst

## Usage

Create a server that listens for hosts:

```js
var horst = require('horst');
var hub = horst();

hub.on('ps', function (ps) {
  // meta object
  assert(ps.meta == 'foo');
  
  // stdin, stdout and stderr
  ps.stdin.write('hey');
  ps.stdout.pipe(process.stdout, { end : false });
  ps.stderr.pipe(process.stderr, { end : false });
  
  // events
  ps.on('exit', function (code) {});
  ps.on('close', function () {});
  ps.on('respawn', function () {});
  
  // inter process communications
  ps.send('hey there');
  ps.on('message', function (msg) {});

  // misc
  ps.kill(signal);
  console.log(ps.pid);
});

hub.listen(7000);
```

And spawn a process from javascript

```js
hub.spawn('node', ['index.js'], { meta : 'foo' });
```

or with the `horst` executable:

```bash
$ horst --hub=localhost:7000 --meta=foo -- node index.js
```

## API

### var hub = host()
### hub.on('ps', fn(ps) {})
### hub.listen(port)
### hub.spawn(proc, args, opts)

## CLI

```bash
$ host --help

```

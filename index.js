/**
 * Module dependencies
 */

var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');
var MuxDemux = require('mux-demux');
var emitStream = require('emit-stream');
var reconnect = require('reconnect');
var through = require('through');
var ms = require('msgpack-stream');

/**
 * Host
 */

function Host () {
  if (!(this instanceof Host)) return new Host(remote, cmd);

  EventEmitter.call(this);

  this._cmd = null;
  this._meta = {};
  this.child = null;
  this.exitCode = 1;
  this.running = false;
  
  this.stdout = through();
  this.stderr = through();
  this.stdin = through();
  this.es = emitStream(this).pipe(through());

  this.streams('pause');
}

inherits(Host, EventEmitter);

/**
 * set cmd
 *
 * @param {String} cmd
 * @return Host
 */

Host.prototype.cmd = function (cmd) {
  this._cmd = cmd;
  return this;
}

/**
 * set meta
 *
 * @param {Object} meta
 * @return Host
 */

Host.prototype.meta = function (meta) {
  this._meta = meta;
  return this;
}

/**
 * Call `method` on each stream known to Host
 *
 * @param {String} method
 * @return this
 */

Host.prototype.streams = function (method) {
  var self = this;
  ['stdout', 'stderr', 'stdin', 'es'].forEach(function (stream) {
    self[stream][method];
  });
  return this;
}

/**
 * Set `remote` and connect to it
 *
 * @param {String} remote
 * @return Host
 */

Host.prototype.remote = function (remote) {
  var host = remote.split(':')[1] || 'localhost';
  var port = Number(remote.split(':')[0]);

  var reconnector = reconnect(function (connection) {
    var mdm = MuxDemux({ wrapper : function (stream) {
      return ms.createDecodeStream().pipe(stream).pipe(ms.createEncodeStream());
    }})
    connection.pipe(mdm).pipe(connection);
   
    this.streams('resume'); 
    this.es.pipe(mdm.createWriteStream('events'));
    this.stdout.pipe(mdm.createWriteStream('stdout'));
    this.stderr.pipe(mdm.createWriteStream('stderr'));
    mdm.createReadStream('stdin').pipe(this.stdin);
  }.bind(this));
  
  reconnector
    .connect(port, host)
    .on('disconnect', this.streams.bind(this, 'pause'));

  return this;
}

/**
 * Run the configured cmd
 *
 * @return Host
 */

Host.prototype.run = function () {
  var segs = cmd.split(' ');
  var child = this.child = spawn(segs[0], segs.slice(1));

  if (this.running) this.emit('respawn');
  this.running = true;
  
  this.stdin.pipe(child.stdin);
  child.stdout.pipe(this.stdout, { end : false });
  child.stderr.pipe(this.stderr, { end : false });
 
  var self = this; 
  child.stderr.on('data', function (data) {
    if (/^execvp\(\)/.test(data)) self.emit('failed spawning');
  });
  
  child.on('exit', function (code) {
    self.exitCode = code;
    self.emit('exit', code);
    if (code != 0) self.run();
  });
  
  return this;
}

/**
 * Kill the child process with `signal`
 *
 * @param {String} signal
 * @return this
 */

Host.prototype.kill = function (signal) {
  if (!this.running) return this;
  
  this.child.kill(signal);
  this.running = false;
  this.emit('exit', 1);
  return this;
}

const qm = function(cb) {
  this.message.prop = this.message.clean + "???";
  cb();
}

export default {qm};
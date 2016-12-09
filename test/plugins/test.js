const qm = function qm(cb) {
  this.message.prop = `${this.message.clean}???`;
  cb();
};

export default { qm };

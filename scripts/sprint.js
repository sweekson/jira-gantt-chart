
function Sprint () {
  this._non_working_days = [];
  this._members = [['Name', 'Workings Hours', 'Off Days']];
  this._tasks = [['id', 'Assignee', 'Estimate', 'Blocked', 'Days']];
}

Sprint.prototype.non_working_days = function (val) {
  val.forEach((v) => this._non_working_days.push(v.date));
};

Sprint.prototype.members = function (val) {
  val.forEach((v) => this._members.push([
    v.name, v.working_hours, v.offdays
  ]));
};

Sprint.prototype.task = function (id) {
  if (this._tasks.length === 1) { return null; }

  let task = this._tasks.find((task) => task[0] === String(id));

  if (!task) { return null; }

  let assignee = task[1];
  let estimate = task[2];
  let blocked_by = task[3];

  return { id, assignee, estimate, blocked_by};
};

Sprint.prototype.tasks = function (val) {
  val.forEach((v) => this._tasks.push([
    v.id, v.assignee, v.estimate, v.blocked_by
  ]));
};

Sprint.prototype.gantt = function (year, month) {
  return new Gantt(year, month, this._members, this._tasks, this._non_working_days);
};

window.sprint = new Sprint();
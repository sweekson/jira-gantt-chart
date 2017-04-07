
function Map (list, key) {
  this.list = list || [];
  this.table = ArrayUtil.array2object(this.list, key);
}

Map.prototype.set = function (id, val) {
  this.list.push(this.table[id] = val);
}

Map.prototype.get = function (id) {
  return this.table[id];
}

Map.prototype.has = function (id) {
  return !!this.table[id];
}

Map.prototype.map = function (callback) {
  return this.list.map(callback);
}

Map.prototype.each = function (callback) {
  this.list.forEach(callback);
}

function Counter (n) {
  this.n = n !== undefined ? n : 0;
  this.origin = this.n;
}

Counter.prototype.increase = function (number) {
  this.n += number || 1;
}

Counter.prototype.reset = function () {
  this.n = this.origin;
}

function MathUtil () {}

MathUtil.round = function (value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function ArrayUtil () {}

ArrayUtil.array2object = function (list, key, value) {
  var object = {};
  
  list.forEach(function (item, index) {
    var k = key !== undefined ? item[key] : index;
    var v = value !== undefined ? item[value] : item;
    
    object[k] = v;
  });
  
  return object;
}

ArrayUtil.findIndex = function (list, callback) {
  var length = list.length;

  if (length === 0) { return -1 };

  for (var i = 0; i < length; i++) {
    if (callback.call(list, list[i], i, list)) { return i };
  }

  return -1;
}

ArrayUtil.findLastIndex = function (list, callback) {
  return list.length - 1 - ArrayUtil.findIndex(list.slice(0).reverse(), callback);
}

var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DateUtil () {}

DateUtil.findLatest = function (dates) {
  return new Date(Math.max.apply(null, dates));
}

DateUtil.findEarliest = function (dates) {
  return new Date(Math.min.apply(null, dates));
}

DateUtil.toDate = function (v) {
  return new Date(v);
}

DateUtil.getDate = function (date) {
  return date.getDate();
}

DateUtil.equal = function (d1, d2) {
  d1 = DateUtil.toDate(d1);
  d2 = DateUtil.toDate(d2);
  
  if (d1.getYear() !== d2.getYear()) { return false; }
  if (d1.getMonth() !== d2.getMonth()) { return false; }
  if (d1.getDate() !== d2.getDate()) { return false; }
  
  return true;
}

DateUtil.exists = function (target, dates) {
  var i = 0;
  var len = dates.length;
  
  while (i < len) {
    if (DateUtil.equal(target, dates[i])) { return true; }
    ++i;
  }
  
  return false;
}

DateUtil.monthdays = function (year, month) {
  var date = new Date(year, month, 1);
  var days = [];
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
}

DateUtil.weekday = function (date) {
  return WEEKDAYS[date.getDay()];
}

function TimeTracking (date) {
  this.date = date !== undefined ? new Date(date) : Date.now();
}

TimeTracking.prototype.increase = function (date, hours) {
  this.date.setDate(this.date.getDate() + (date || 0));
  this.date.setHours(this.date.getHours() + (hours || 0));
}

TimeTracking.prototype.setDate = function (date) {
  this.date.setDate(date.getDate());
  this.date.setHours(date.getHours());
}

TimeTracking.prototype.isGreaterThan = function (target) {
  if (this.date.getFullYear() > target.getFullYear()) { return true; }
  if (this.date.getDate() > target.getDate()) { return true; }
  if (this.date.getHours() > target.getHours()) { return true; }
  return false;
}

TimeTracking.prototype.isLessThan = function (target) {
  if (this.date.getFullYear() < target.getFullYear()) { return true; }
  if (this.date.getDate() < target.getDate()) { return true; }
  if (this.date.getHours() < target.getHours()) { return true; }
  return false;
}

function Task (data) {
  this.id = Number(data[0]);
  this.assignee = String(data[1]);
  this.estimate_hours = Number(data[2]);
  this.blocked_by_list = data[3] ? String(data[3]).split(',') : [];
  this.status = String(data[4]);
  this.notations = [];
}

Task.TODO = 'TODO';
Task.DONE = 'DONE';

Task.getEndDate = function (task) {
  return task.end_date;
};

Task.prototype.setBlockedByTasks = function (tasks) {
  this.blocked_by_tasks = tasks;
};

Task.prototype.setEndDate = function (date) {
  this.end_date = date;
};

Task.prototype.setNotation = function (index, tag) {
  this.notations[index] = GanttNotation.verify(this.notations[index], tag);
};

Task.prototype.setTracker = function (tracker) {
  this.tracker = tracker;
};

Task.prototype.setOverload = function (bool) {
  this.overload = bool;
};

Task.prototype.calcEstimateDays = function (working_hours) {
  this.estimate_days = Math.ceil(MathUtil.round(this.estimate_hours / working_hours, 1) * 10 / 5) * 5 * .1;
};

Task.prototype.isValid = function () {
  return !!this.id;
};

function Sheet () {}

Sheet.convert = function (data, model, key) {
  return new Map(data.slice(1).map(function (v) { return new model(v); }), key);
};

function Member (data) {
  this.name = String(data[0]);
  this.working_hours = Number(data[1]);
  this.offdays = String(data[2]).split(',');
  this.notations = [];
}

Member.prototype.findAvailableTaskStartDate = function (estimate_days, from) {
  var year = from.getFullYear();
  var month = from.getMonth();
  var date = from.getDate();
  var hours = from.getHours();

  if (!this.notations.length) { return new Date(year, month, 1, 9); }
  if (date > this.notations.length * 0.5) { return -1; }

  var index = (date - 1) * 2 + (hours === 13 ? 1 : 0);
  var squence = this.findAvailableSquence(index);

  // console.log(index, squence)

  if (squence.start === -1) {
    return this.findLastAvailableTaskStartDate(year, month);
  }

  if (squence.count * 0.5 < estimate_days) {
    return this.findAvailableTaskStartDate(estimate_days, GanttNotation.notationIndexToDate(year, month, index + squence.start + squence.count));
  }

  return GanttNotation.notationIndexToDate(year, month, index + squence.start);
};

Member.prototype.findAvailableSquence = function (index) {
  return GanttNotation.sequenceOf(GanttNotation.NONE, this.notations.slice(index), [
    GanttNotation.WEEKEND,
    GanttNotation.NON_WORKING_DAY,
    GanttNotation.OFFDAY
  ]);
};

Member.prototype.findLastAvailableTaskStartDate = function (year, month) {
  var index = ArrayUtil.findLastIndex(this.notations, function (point) {
    return point === GanttNotation.WORKING_DAY;
  });

  if (index + 1 < this.notations.length) {
    return GanttNotation.notationIndexToDate(year, month, index + 1);
  }

  return -1;
};

Member.prototype.isAvailableTaskDate = function (index) {
  return !this.notations[index] ? true : this.notations[index] === GanttNotation.NONE;
};

Member.prototype.setOffdays = function (year, month) {
  this.offdays = this.offdays.map(function (day) {
    return new Date(year, month - 1, day);
  });
};

Member.prototype.setNotation = function (index, tag) {
  this.notations[index] = GanttNotation.verify(this.notations[index], tag);
};

function Gantt (year, month, members, tasks, non_working_days) {
  this.year = year;
  this.month = month;
  this.firstDate = new Date(year, month - 1, 1, 9);
  this.dates = DateUtil.monthdays(year, month - 1);
  this.weekdays = this.dates.map(DateUtil.weekday);
  this.non_working_days = non_working_days.map(DateUtil.toDate);
  this.members = Sheet.convert(members, Member, 'name');
  this.tasks = Sheet.convert(tasks, Task, 'id');
  this.data = [];
}

Gantt.prototype.render = function () {
  this.members.each(this.convertOffday.bind(this));
  this.tasks.each(this.initTaskTracker.bind(this));
  this.tasks.each(this.calcEstimateDays.bind(this));

  this.renderHeaders();
  this.renderRows();
  
  return this.data;
}

Gantt.prototype.renderRows = function () {
  this.tasks.map(this.renderRow.bind(this));
}

Gantt.prototype.renderRow = function (task) {
  if (!task.isValid()) { return; }
  
  var assignee = this.members.get(task.assignee);
  var notation = new GanttNotation(this.firstDate, this.dates, this.non_working_days, task, assignee);
  
  this.resolveBlockedByTasks(task);
  notation.renderPoints();
  this.output([task.overload ? '!' + task.id : task.id, task.assignee].concat(task.notations));
}

Gantt.prototype.renderHeaders = function () {
  this.output([null, null].concat(this.renderDatesHeader()));
  this.output(['Task', 'Assignee'].concat(this.renderWeekdaysHeader()));
}

Gantt.prototype.renderDatesHeader = function () {
  return this.dates.map(DateUtil.getDate).reduce((l, v) => l.concat(v, ''), []);
}

Gantt.prototype.renderWeekdaysHeader = function () {
  return this.weekdays.reduce((l, v) => l.concat(v, ''), []);
}

Gantt.prototype.resolveBlockedByTasks = function (task) {
  task.setBlockedByTasks(task.blocked_by_list.map(this.findTask.bind(this)));
}

Gantt.prototype.calcEstimateDays = function (task) {
  task.calcEstimateDays(this.members.get(task.assignee).working_hours);
}

Gantt.prototype.convertOffday = function (member) {
  member.setOffdays(this.year, this.month);
}

Gantt.prototype.initTaskTracker = function (task) {
  task.setTracker(new TimeTracking(this.firstDate));
}

Gantt.prototype.findTask = function (id) {
  return this.tasks.get(id);
}

Gantt.prototype.output = function (data) {
  this.data.push(data);
}

function GanttNotation (firstDate, dates, non_working_days, task, assignee) {
  this.firstDate = firstDate;
  this.dates = GanttNotation.convertDates(dates);
  this.non_working_days = non_working_days;
  this.assignee = assignee;
  this.task = task;
  this.counter = new Counter(0);
}

GanttNotation.NONE = '?';
GanttNotation.WEEKEND = '-';
GanttNotation.NON_WORKING_DAY = '=';
GanttNotation.OFFDAY = '*';
GanttNotation.WORKING_DAY = '+';
GanttNotation.DONE = '#';
GanttNotation.OVERLOAD = '!';

GanttNotation.sequenceOf = function (target, points, excludes) {
  var count = 0;
  var start = points.indexOf(target);

  points.slice(start).every(function (point) {
    if (point === target) { return ++count; }
    if (excludes.indexOf(point) > -1) { return true; }
    return false;
  });

  return { start: start, count: count };
}

GanttNotation.convertDates = function (dates) {
  var results = [];

  dates.forEach(function (date) {
    results.push(
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9),
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13)
    );
  });

  return results;
};

GanttNotation.verify = function (previous, current) {
  if (!previous) {
    return current;
  }

  if (previous !== current && current !== GanttNotation.NONE) {
    return current;
  }

  return previous;
}

GanttNotation.notationIndexToDate = function (year, month, index) {
  return new Date(year, month, Math.ceil(index * 0.5 + 0.5), index % 2 === 0 ? 9 : 13);
};

GanttNotation.prototype.renderPoints = function () {
  this.resolveTracker();
  this.dates.forEach(this.renderPoint.bind(this));
  this.checkOverload();
};

GanttNotation.prototype.renderPoint = function (date, index) {
  if (this.isWeekend(date)) { return this.weekend(date, index); }
  if (this.isNonWorkingdays(date)) { return this.nonWorkingday(date, index); }
  if (this.isOffdays(date)) { return this.offday(date, index); }
  if (this.isLessThanTaskStartDate(date)) { return this.none(date, index); }
  if (this.isEstimateDaysComplete()) { return this.none(date, index); }
  return this.working(date, index);
};

GanttNotation.prototype.resolveTracker = function () {
  console.log('----------- #%s (%s)-----------', this.task.id, this.task.assignee)
  // console.log(this.assignee.notations)

  var blocked_by_end_dates = this.task.blocked_by_tasks.map(Task.getEndDate);
  var last_blocked_by = blocked_by_end_dates.length ? DateUtil.findLatest(blocked_by_end_dates) : this.firstDate;
  var available_start = this.assignee.findAvailableTaskStartDate(this.task.estimate_days, last_blocked_by);
  var task_start_date = this.resolveTaskStartDate(available_start, last_blocked_by);

  // console.log('blocked_by_end_dates: ', blocked_by_end_dates)
  console.log('last_blocked_by: ', last_blocked_by)
  console.log('available_start: ', available_start)
  console.log('task_start_date: ', task_start_date)

  this.task.tracker.setDate(task_start_date);
  this.task.setEndDate(task_start_date);
};

GanttNotation.prototype.resolveTaskStartDate = function (available_start, last_blocked_by) {
  if (available_start === -1) { return this.getMonthLastDate(); }
  if (last_blocked_by > available_start) { return last_blocked_by; }
  return available_start;
};

GanttNotation.prototype.getMonthLastDate = function () {
  return new Date(this.firstDate.getFullYear(), this.firstDate.getMonth() + 1, 0, 9);
};

GanttNotation.prototype.checkOverload = function () {
  this.task.setOverload(this.counter.n < this.task.estimate_days);
};

GanttNotation.prototype.none = function (date, index) {
  this.setNotation(index, GanttNotation.NONE);
};

GanttNotation.prototype.weekend = function (date, index) {
  this.increaseTracker(date);
  this.setNotation(index, GanttNotation.WEEKEND);
};

GanttNotation.prototype.nonWorkingday = function (date, index) {
  this.increaseTracker(date);
  this.setNotation(index, GanttNotation.NON_WORKING_DAY);
};

GanttNotation.prototype.offday = function (date, index) {
  this.increaseTracker(date);
  this.setNotation(index, GanttNotation.OFFDAY);
};

GanttNotation.prototype.working = function (date, index) {
  this.increaseTracker(date);
  this.counter.increase(0.5);
  this.setNotation(index, this.task.status === Task.DONE ? GanttNotation.DONE : GanttNotation.WORKING_DAY);
};

GanttNotation.prototype.setNotation = function (index, tag) {
  this.task.setNotation(index, tag);
  this.assignee.setNotation(index, tag);
};

GanttNotation.prototype.increaseTracker = function (date) {
  if (this.counter.n >= this.task.estimate_days) { return; }
  // if (date.getDate() < this.task.tracker.date.getDate()) { return; }
  // if (date.getHours() < this.task.tracker.date.getHours()) { return; }
  if (this.task.tracker.isGreaterThan(date)) { return; }

  // if (this.counter.n < this.task.estimate_days && date.getDate() >= this.task.tracker.date.getDate()) {
  this.task.tracker.increase(0, this.task.tracker.date.getHours() === 9 ? 4 : 20);
  this.task.setEndDate(this.task.tracker.date);

  console.log('setEndDate', this.task.tracker.date)
  // }
};

GanttNotation.prototype.isWeekend = function (date) {
  return date.getDay() % 6 === 0;
};

GanttNotation.prototype.isNonWorkingdays = function (date) {
  return DateUtil.exists(date, this.non_working_days);
};

GanttNotation.prototype.isOffdays = function (date) {
  return DateUtil.exists(date, this.assignee.offdays);
};

GanttNotation.prototype.isLessThanTaskStartDate = function (date) {
  // return date.getDate() < this.task.tracker.date.getDate() && date.getHours() < this.task.tracker.date.getHours();
  // console.log(date, this.task.tracker.date, this.task.tracker.isGreaterThan(date))
  return this.task.tracker.isGreaterThan(date);
};

GanttNotation.prototype.isEstimateDaysComplete = function () {
  return this.counter.n >= this.task.estimate_days;
};

/**
 * Accumulate working days
 *
 * @param {string} blocklist 
 * @param {array} rows 
 * @param {number} index 
 * @return The total working days
 * @customfunction
 */
function BLOCKED_BY_MAX (blocklist, rows, index) {
  var days = ArrayUtil.array2object(rows, 0, index - 1);
  var ids = blocklist ? String(blocklist).split(',') : false;
  var blocked = ids ? ids.map(function (id) { return days[id]; }) : false;
  var max = blocked ? String(Math.max.apply([], blocked)) : 0;
  
  return Number(max);
}

/**
 * Calculate estimate working days
 *
 * @param {number} estimate The estimate hours of a task
 * @param {numer} working_hours The working hours a day to the task assignee
 * @return The calculated working days
 * @customfunction
 */
function ESTIMATE_DAYS (estimate, working_hours) {
  var days = MathUtil.round(estimate / working_hours, 1);
  
  return Math.ceil(days * 10 / 5) * 5 * .1;
}

function GANTT_CHART (year, month, members, tasks, non_working_days) {
  return new Gantt(year, month, members, tasks, non_working_days).render();
}

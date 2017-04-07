
angular.module('app', [])

.directive('tableCellCrosshair', function () {
  return {
    restrict: 'A',
    link: function ($scope, elem, attrs) {
      let $elem = $(elem);
      let $heading = $(attrs.heading);
      let column = Number(attrs.column);

      $elem.on('mouseover', 'td', (e) => {
        let $cell = $(e.target);
        let $row = $cell.parent('tr');
        let index = $cell.index();
        let $th = $heading.find('thead > tr > th');
        let columns = $th.length * 0.5;

        if (index < column) { return; }

        $th.eq(index).addClass('info');
        $th.eq(index + columns).addClass('info');

        if ((index - column) % 2 === 0) {
          $th.eq(index + 1).addClass('info');
          $th.eq(index + columns + 1).addClass('info');
        }

        if ((index - column) % 2 === 1) {
          $th.eq(index - 1).addClass('info');
          $th.eq(index + columns - 1).addClass('info');
        }
      });

      $elem.on('mouseout', 'td', (e) => {
        let $cell = $(e.target);
        let $row = $cell.parent('tr');
        let index = $cell.index();
        let $th = $heading.find('thead > tr > th');
        let columns = $th.length * 0.5;

        if (index < column) { return; }

        $th.eq(index).removeClass('info');
        $th.eq(index + columns).removeClass('info');

        if ((index - column) % 2 === 0) {
          $th.eq(index + 1).removeClass('info');
          $th.eq(index + columns + 1).removeClass('info');
        }

        if ((index - column) % 2 === 1) {
          $th.eq(index - 1).removeClass('info');
          $th.eq(index + columns - 1).removeClass('info');
        }
      });
    }
  };
})

.directive('hashable', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, model) {
      let $elem = $(elem);
      let pattern = new RegExp(attrs.format);
      let index = attrs.index ? Number(attrs.index) + 1 : 1;

      if (pattern.test(location.hash)) {
        console.log(location.hash.match(pattern)[index])
        model.$setViewValue(location.hash.match(pattern)[index]);
        model.$render();
      }

      $elem.on('change', (e) => {
        let matches = location.hash.match(pattern);
        let hash = matches.map((v, i) => i === index ? e.target.value : v);

        location.hash = [''].concat(hash.slice(1)).join('/');
      });
    }
  };
})

.directive('findable', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, model) {
      let $elem = $(elem);

      $elem.on('focus', (e) => {
        e.target.select();
      });

      $elem.on('keyup', (e) => {
        $('td.highlight').removeClass('highlight');

        if (e.keyCode !== 13) { return; }

        let exists = scope.sprint.exists(e.target.value);
        
        $elem.removeClass('form-invalid');

        if (!exists) { return $elem.addClass('form-invalid'); }

        let target = `#task-${e.target.value}`;
        let $target = $(target);
        let offset = $target.offset();

        $('body').scrollTop(offset.top - 131);
        $target.find('td').eq(1).addClass('highlight');

        e.target.select();
      });
    }
  };
})

.service('project', function ($http) {
  const SUCCESS = (response) => response.data;

  this.members = () => {
    return $http.get('data/members.json').then(SUCCESS);
  };
  
  this.tasks = (id) => {
    return $http.get(`data/sprint/${id}/tasks.json`).then(SUCCESS);
  };

  this.non_working_days = (id) => {
    return $http.get(`data/sprint/${id}/non_working_days.json`).then(SUCCESS);
  };
})

.controller('SprintCtrl', function ($q, project) {
  this.onload = () => {
    this.loaded = true;
    this.members = sprint._members.slice(1).map((v) => v[0]).sort();
    this.gantt = sprint.gantt(2017, 4);
    this.chart = this.gantt.render();
    this.heading = this.chart.slice(0, 2);
    this.tasks = this.chart.slice(2);
  };

  this.id = (val) => {
    return /^!/.test(val) ? val.slice(1) : val;
  };

  this.find = (id) => sprint.task(id);

  this.exists = (id) => sprint.task(id) !== null;

  this.select = (task) => {
    this.selected = sprint.task(this.id(task[0]));
  };

  this.empty = () => {
    if (!this.tasks || !this.assignee) { return false; }
    return this.tasks.findIndex((task) => task[1] === this.assignee) === -1;
  };

  this.visible = (data) => this.assignee ? this.assignee === data[1] : true;

  this.highlight = (val) => ({ danger: /^!/.test(val) });

  this.type = (val) => {
    return {
      'notation-weekend': val === '-',
      'notation-non-working': val === '=',
      'notation-work': val === '+',
      'notation-none': val === '?',
      'notation-offday': val === '*'
    };
  };

  this.notations = () => this.gantt.members.get(this.assignee).notations;

  $q.all([
    project.members().then((data) => sprint.members(data)),
    project.tasks(4).then((data) => sprint.tasks(data)),
    project.non_working_days(4).then((data) => sprint.non_working_days(data))
  ])
  .then(this.onload);
});

angular.bootstrap(document, ['app']);
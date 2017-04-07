
module.exports.parse = function parse (issues) {
  let key = (key) => key.match(/(HIESP)-(\d+)/)[2];
  let name = (assignee) => assignee.displayName.match(/([\w\s]+)/)[1];
  let estimated = (issue) => issue.fields.timeestimate !== null;
  let parser = (issue) => {
    let summary = issue.fields.summary;
    let id = key(issue.key);
    let assignee = name(issue.fields.assignee).trim();
    let estimate = issue.fields.timeestimate / 3600;
    let links = issue.fields.issuelinks;
    let blocked_by = links.filter((link) => {
      if (link.type.name !== 'Blocks') { return false; }
      if (!link.inwardIssue) { return false; }
      if (link.inwardIssue.fields.status.name === 'Done') { return false; }
      return true;
    })
    .map((issue) => {
      return key(issue.inwardIssue.key);
    })
    .join(',');

    return { id, summary, assignee, estimate, blocked_by };
  };

  return issues.filter(estimated).map(parser);
};
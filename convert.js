
const fs = require('fs');
const parser = require('./modules/issue-converter');
const date = process.argv[2];
const read = (filepath) => {
  return JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' }));
};
const write = (filepath, content) => {
  return fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
};
const search = read(`data/sprint/${date}/search.json`);
const issues = parser.parse(search.issues);

write(`data/sprint/${date}/tasks.json`, issues);

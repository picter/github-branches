const inquirer = require('inquirer');
const GitHubApi = require('github')
const fs = require('fs');

const token = fs.readFileSync('./.token', { encoding: 'utf8' });

var github = new GitHubApi({
   // optional
 timeout: 5000,
 host: 'api.github.com', // should be api.github.com for GitHub
 protocol: 'https',
 
 headers: {
   'user-agent': 'github-branches'
 },
 followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow disabling follow-redirects
 rejectUnauthorized: false, // default: true
});

// user token
github.authenticate({
  type: 'token',
  token,
})

async function startCli() {
  // request for issues
  const request = await github.issues.getForRepo({ 
    owner: 'picter',
    repo: 'rest-api',
    state: 'open',
  });

  const issues = request.data
    .filter(issue => issue.pull_request === undefined) // get rid of pull requests
    .map(issue => ({
      name: `#${issue.number}: ${issue.title}`,
      value: issue.number,
      pull_request: issue.pull_request,
    }));

  const answers = await inquirer
    .prompt([
      {
        type: 'list',
        name: 'issue',
        message: "Pick an issue!",
        paginated: true,
        choices: issues
      }
    ]);
  console.log(answers);
}

startCli();
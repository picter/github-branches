const git = require('simple-git/promise')();
const slug = require('slug');
const inquirer = require('inquirer');
const GitHubApi = require('github')
const fs = require('fs');
const os = require('os');

const token = fs.readFileSync(`${os.homedir()}/.ghb`, { encoding: 'utf8' });
const package = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, { encoding: 'utf8' }));
const [, owner, repo] = String(package.repository).match(/(.*)\/(.*)$/);

console.log(`Current repository: ${owner}/${repo}`);

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
    owner,
    repo,
    state: 'open',
  });

  const issues = request.data
    .filter(issue => issue.pull_request === undefined) // get rid of pull requests
    .map(issue => ({
      name: `#${issue.number}: ${issue.title}`,
      value: `${issue.number} ${issue.title}`,
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

    const branches = await git.branch();
    const newBranchName = slug(answers.issue);
    const issueNumber = newBranchName.split('-')[0];
    const existingBranch = branches.all.find(branchName => branchName.startsWith(`${issueNumber}-`));
    if (existingBranch) {
      console.log(`There's already a branch for issue #${issueNumber}. I'm checking it out.`);
      await git.checkout(existingBranch);
    } else {
      await git.checkoutBranch(slug(answers.issue).toLowerCase(), 'master');
      console.log(`Checked out a new branch for issue #${issueNumber}, starting from master.`);
    }
}

startCli();

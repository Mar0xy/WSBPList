# WSBPList
Wonky bplist sync done via node.js and github

## Setup

1. Install modules
```bash
npm install
```

2. Run to create config (ignore error)
```bash
node app.js
```

3. Edit config.json and change repo url, GH Personal Access Token, repo owner, repo name, branch to push to

## Usage

Execute the app in the following way
```bash
node app.js (path to bplist file)
```

> WARNING! Make sure the bplist file exists on the repo specified else it will exit with an error telling that the file can't be found on the GH Repo

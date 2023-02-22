let { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");
const deepmerge = require("deepmerge");
const readline = require("readline-sync");

(async () => {
Octokit = Octokit.plugin(require("octokit-commit-multiple-files"));

let config = await fs.existsSync(`${path.dirname(__filename)}/config.json`);

if (!config) {
    await fs.appendFileSync(`${path.dirname(__filename)}/config.json`, `{\n    "ghurl": "https://github.com/denis34343/wonky-sync-thingy",\n    "authtoken": null,\n    "repoowner": null,\n    "reponame": null,\n    "repobranch": null\n}`);
}

config = JSON.parse(await fs.readFileSync(`${path.dirname(__filename)}/config.json`));

const Octokita = new Octokit({
    auth: config.authtoken,
});

const wat = await Octokita.users.getAuthenticated();

console.log("Authenticated as %s", wat.data.login);

const file = process.argv[process.argv.length - 1];

if (!file) {
    console.log(`Please provide the bplist file`);
} else if(file.endsWith(".bplist")) {

    if(!await fs.existsSync(file)) {
        console.log('File doesn`t exist');
        process.exit(0);
    }

    const bplist = await fs.readFileSync(file);

    let bpllocalc;

    try {
        bpllocalc = JSON.parse(bplist);
    } catch(e) {
        console.log('Invalid file formatting.');
        process.exit(0);
    }

    const filename = path.basename(file);

    fetch(`${config.ghurl}/raw/main/${filename}`).then(res => {
        if (res.status == 200)
            return res.arrayBuffer();
        else
            console.log(`${filename} doesn't exist on remote`);
            process.exit(0);
    }).then(async filebuf => await fs.writeFileSync(`${path.dirname(__filename)}/remote-${path.parse(file).name}.bplist`, Buffer.from(filebuf))).then(async () => {
        console.log(`${filename} has been downloaded from remote as remote-${path.parse(file).name}.bplist`);
        
        const remolist = JSON.parse(await fs.readFileSync(`${path.dirname(__filename)}/remote-${path.parse(file).name}.bplist`));

        if (remolist.songs[remolist.songs.length-1].hash != bpllocalc.songs[bpllocalc.songs.length-1].hash) {
            const newfile = JSON.parse(JSON.stringify(deepmerge(remolist, bpllocalc)));

            await fs.writeFileSync(`${path.dirname(__filename)}/${filename}`, JSON.stringify(newfile, null, 4));

            console.log(`Updated playlist successfully`);

            let upmsg = readline.question('What should the update message be? \n');

            console.log(`Pushing updated bplist file with message: ${upmsg}`);

            await Octokita.rest.repos.createOrUpdateFiles({
                owner: config.repoowner,
                repo: config.reponame,
                branch: config.repobranch,
                createBranch: false,
                changes: [
                    {
                      message: upmsg,
                      files: {
                        [`${filename}`]: Buffer.from(JSON.stringify(newfile, null, 4)).toString('base64')
                      }
                    },
                ]
            });

            await fs.rmSync(`${path.dirname(__filename)}/remote-${path.parse(file).name}.bplist`);
            console.log(`Updated Successfully! Please move ${filename} into your Playlists folder.`);
        } else {
            console.log('Playist is up to date.');
            
            await fs.rmSync(`${path.dirname(__filename)}/remote-${path.parse(file).name}.bplist`);
            process.exit(0);
        }
    });

} else {
    console.log('Wrong file format please provide a .bplist file.');
}
})();
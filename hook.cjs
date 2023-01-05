const childProcess = require('child_process');

const execCommand = (command) => {
  return childProcess.execSync(command).toString().trim();
}

const rootDir = execCommand("git rev-parse --show-toplevel");

const modifiedOwnersFiles = execCommand("git status --porcelain")
  // disregard untracked files
  .replace(/^\?\?.*/mg, '');

const ownersFileChanged = modifiedOwnersFiles.includes("OWNERS");

const getOwnerFiles = () => {
  return execCommand(`find ${rootDir} -name "OWNERS"`)
    .split("\n")
    .filter(file => !file.includes("node_modules"))
    // sort first by path length, then by name
    .sort()
    .sort((f1, f2) => {
      return f1.split("/").length - f2.split("/").length
    })
}

const processOwnerFile = (file) => {
  const owners = execCommand(`cat ${file}`).replace(/\n/g, ' ');

  const dirPath = file
  .replace(`${rootDir}/`, '')
  .replace(/OWNERS$/, '')
  .replace(/\/$/, '')
  .trim();

  if (dirPath === '') {
    return `* ${owners}`;
  } else {
    return `${dirPath} ${owners}`;
  }
}

const updateCodeOwnersFile = (rows) => {
  const filePath = `${rootDir}/CODEOWNERS`;
  execCommand(`rm -f ${filePath}`);
  rows.map(row => {
    execCommand(`echo "${row}" >> ${filePath}`);
  });
  execCommand(`git add -f ${filePath}`);
}

console.log("running git owners hook for directory: " + rootDir);

if (ownersFileChanged) {
  const ownerFiles = getOwnerFiles();
  console.log("OWNERS files modified: \n" + modifiedOwnersFiles);

  const rows = ownerFiles.map(processOwnerFile);
  updateCodeOwnersFile(rows);
  console.log("CODEOWNERS file has been updated.");
}

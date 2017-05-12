// npm modules
const chalk = require('chalk');
const ignore = require('ignore');
const tar = require('tar-fs');
const got = require('got');

// my modules
const {userConfig, isLoggedIn} = require('../config');

const ignores = ['.git', 'node_modules'];

exports.command = '*';
exports.describe = 'deploy current folder';
exports.builder = {};
exports.handler = () => {
  if (!isLoggedIn()) {
    return;
  }

  console.log(
    chalk.bold('Deploying current project to endpoint:'),
    userConfig.endpoint
  );

  // create config vars
  const workdir = process.cwd();
  const remoteUrl = `${userConfig.endpoint}/deploy`;

  // create tar stream from current folder
  const ig = ignore().add(ignores);
  const tarStream = tar.pack(workdir, {
    ignore: name => ig.ignores(name),
  });

  const options = {
    headers: {
      Authorization: `Bearer ${userConfig.token}`,
    },
  };

  // pipe stream to remote
  let result = '';
  const stream = tarStream.pipe(got.stream.post(remoteUrl, options));
  // log output if in verbose mode
  stream.on('data', str => {
    result += str.toString();
  });
  // listen for read stream end
  stream.on('end', () => {
    const res = JSON.parse(result);
    // log end
    console.log(
      chalk.bold('Done!'),
      `Your project is now deployed as ${res.name}`
    );
  });
  // listen for stream errors
  stream.on('error', e => {
    // log other errors
    console.log(chalk.bold('Error during build!'));
    console.error(e);
  });
};
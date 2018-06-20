/***************************************************************************************
 * (c) 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const ZIP_NAME_REGEX = /\.zip$/;

// The file name pattern that reactor-packager uses:
// https://www.npmjs.com/package/@adobe/reactor-packager
const PACKAGER_ZIP_NAME_REGEX = /^package-.*-.*\.zip$/;

// Find zip files in the working directory. Then, sort any of the files that look like they
// came from the packager to the top of the list. Then, sort by the date the files were
// last changed (most recent first). This will hopefully bring the most relevant files to the
// top of the list.
const getZipsInDir = () => {
  return fs.readdirSync(process.cwd())
    .filter(file => ZIP_NAME_REGEX.test(file))
    .sort((fileA, fileB) => {
      const fileAIsFromPackager = PACKAGER_ZIP_NAME_REGEX.test(fileA);
      const fileBIsFromPackager = PACKAGER_ZIP_NAME_REGEX.test(fileB);

      if (fileAIsFromPackager && !fileBIsFromPackager) {
        return -1;
      }

      if (!fileAIsFromPackager && fileBIsFromPackager) {
        return 1;
      }

      const fileATime = fs.statSync(path.resolve(fileA)).ctimeMs;
      const fileBTime = fs.statSync(path.resolve(fileB)).ctimeMs;

      if (fileATime > fileBTime) {
        return -1;
      }

      if (fileATime < fileBTime) {
        return 1;
      }

      return 0;
    });
};


const proposeSingleZip = async (candidateZip) => {
  const { correctZip } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'correctZip',
      message: `The zip file ${candidateZip} was found in the current directory. Is this the zip file you would like to upload?`
    }
  ]);

  if (correctZip) {
    return candidateZip;
  }
};

const proposeMultipleZips = async (zipsInDir) => {
  const NONE_OPTION = 'None of the files listed';
  const { zipPath } = await inquirer.prompt([
    {
      type: 'list',
      name: 'zipPath',
      message: 'Which of the following zip files would you like to upload?',
      choices: zipsInDir.concat([
        new inquirer.Separator(),
        NONE_OPTION,
        new inquirer.Separator()
      ])
    }
  ]);

  if (zipPath !== NONE_OPTION) {
    return zipPath;
  }
};

const getUserEnteredZip = async () => {
  const { zipPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'zipPath',
      message: 'Please enter the path (relative or absolute) to the zip file you would like to upload.',
      validate: Boolean
    }
  ]);

  return validateZipPath(zipPath) ? zipPath : await getUserEnteredZip();
};

const validateZipPath = (zipPath) => {
  const absPath = path.resolve(zipPath);

  if (fs.existsSync(absPath)) {
    return true;
  } else {
    console.error(`No file found at ${absPath}`);
    return false;
  }
};

module.exports = async (argv) => {
  let zipPath;

  const zipArg = argv._[0];

  if (zipArg && validateZipPath(zipArg)) {
    zipPath = zipArg;
  } else {
    const zipsInDir = getZipsInDir();

    if (zipsInDir.length === 1) {
      zipPath = await proposeSingleZip(zipsInDir[0]);
    } else if (zipsInDir.length > 1) {
      zipPath = await proposeMultipleZips(zipsInDir);
    }
  }

  if (!zipPath) {
    zipPath = await getUserEnteredZip();
  }

  return path.resolve(zipPath);
};

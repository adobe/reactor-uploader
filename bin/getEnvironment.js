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

const inquirer = require('inquirer');

module.exports = async (argv) => {
  if (argv.env) {
    return argv.env;
  } else {
    const { env } = await inquirer.prompt([
      {
        type: 'list',
        name: 'env',
        message: 'To which environment would you like to upload your extension package?',
        choices: [
          {
            name: 'Dev (Adobe Internal Use Only)',
            value: 'dev'
          },
          {
            name: 'QE (Adobe Internal Use Only)',
            value: 'qe'
          },
          {
            name: 'Integration',
            value: 'integration'
          },
          {
            name: 'Production (Adobe Internal Use Only',
            value: 'prod'
          }
        ],
        default: 2
      }
    ]);

    return env;
  }
};

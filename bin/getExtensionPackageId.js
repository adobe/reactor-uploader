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

const request = require('request-promise-native');
const chalk = require('chalk');
const getReactorHeaders = require('./getReactorHeaders');
const handleResponseError = require('./handleResponseError');

module.exports = async (envConfig, accessToken, extensionPackageName) => {
  const options = {
    method: 'GET',
    url: `${envConfig.extensionPackages}?page[size]=1&page[number]=1&filter[name]=EQ ${extensionPackageName}`,
    headers: getReactorHeaders(accessToken),
    transform: JSON.parse
  };

  let body;

  try {
    body = await request(options);
  } catch (error) {
    handleResponseError(error, 'Error detecting whether extension package exists on server.');
  }

  let extensionPackageId;

  if (body.data.length) {
    extensionPackageId = body.data[0].id;
    console.log(`An existing extension package with the name ${chalk.bold(extensionPackageName)} was ` +
      `found on the server and will be updated. The extension package ID ` +
      `is ${chalk.bold(extensionPackageId)}.`);
  } else {
    console.log(`No extension package was found on the server with the ` +
      `name ${chalk.bold(extensionPackageName)}. A new extension package will be created.`);
  }

  return extensionPackageId;
};

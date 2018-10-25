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
const chalk = require('chalk');
const request = require('request-promise-native');
const getReactorHeaders = require('./getReactorHeaders');
const handleResponseError = require('./handleResponseError');
const logVerboseHeader = require('./logVerboseHeader');

module.exports = async (
  envConfig,
  accessToken,
  extensionPackageManifest,
  extensionPackageFromServer,
  zipPath,
  argv
) => {
  const shouldPost = !extensionPackageFromServer || extensionPackageFromServer.attributes.availability !== 'development';

  if (extensionPackageFromServer) {
    if (extensionPackageFromServer.attributes.availability === 'development') {
      console.log(`An existing extension package with the name ` +
        `${chalk.bold(extensionPackageManifest.name)} was found on the server and will be updated. ` +
        `The extension package ID is ${chalk.bold(extensionPackageFromServer.id)}.`);
    } else {
      console.log(`An existing extension package with the name ` +
        `${chalk.bold(extensionPackageManifest.name)} was found on the server, but because its ` +
        `availability is not ${chalk.bold('development')}, a development version of the extension package ` +
        `will be created.`);
    }
  } else {
    console.log(`No extension package was found on the server with the ` +
      `name ${chalk.bold(extensionPackageManifest.name)}. A new extension package will be created.`);
  }

  if (argv.verbose) {
    logVerboseHeader('Uploading zip');
  }

  const options = {
    method: shouldPost ? 'POST' : 'PATCH',
    url: shouldPost ?
      envConfig.extensionPackages :
      `${envConfig.extensionPackages}/${extensionPackageFromServer.id}`,
    headers: getReactorHeaders(accessToken),
    formData: {
      package: fs.createReadStream(zipPath)
    },
    transform: JSON.parse
  };

  try {
    const body = await request(options);
    const extensionPackageId = body.data.id;

    if (shouldPost) {
      console.log(`The extension package has been assigned the ID ${chalk.bold(extensionPackageId)}.`);
    }

    return extensionPackageId;
  } catch (error) {
    handleResponseError(error, 'Error uploading extension package.');
  }
};

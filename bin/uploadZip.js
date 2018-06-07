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

module.exports = async (envConfig, accessToken, extensionPackageId, zipPath) => {
  const isNew = !extensionPackageId;

  const options = {
    method: isNew ? 'POST' : 'PATCH',
    url: isNew ?
      envConfig.extensionPackages :
      `${envConfig.extensionPackages}/${extensionPackageId}`,
    headers: getReactorHeaders(accessToken),
    formData: {
      package: fs.createReadStream(zipPath)
    },
    transform: JSON.parse
  };

  try {
    const body = await request(options);
    extensionPackageId = body.data.id;

    if (isNew) {
      console.log(`The extension package has been assigned the ` +
        `ID ${chalk.bold(extensionPackageId)}.`);
    }

    return extensionPackageId;
  } catch (error) {
    handleResponseError(error, 'Error uploading extension package.');
  }
};

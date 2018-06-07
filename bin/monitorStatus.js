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
const delay = require('delay');
const ora = require('ora');
const getReactorHeaders = require('./getReactorHeaders');
const handleResponseError = require('./handleResponseError');
const getMessageFromReactorError = require('./getMessageFromReactorError');

const MAX_RETRIES = 50;

const requestStatus = async (envConfig, accessToken, extensionPackageId, spinner, retries = 0) => {
  if (retries >= MAX_RETRIES) {
    throw new Error('The extension package failed to be processed within an expected timeframe.');
  }

  const options = {
    method: 'GET',
    url: `${envConfig.extensionPackages}/${extensionPackageId}`,
    headers: getReactorHeaders(accessToken),
    transform: JSON.parse
  };

  let body;

  try {
    body = await request(options);
  } catch (error) {
    spinner.stop();
    handleResponseError(error, 'Error requesting extension package processing status.');
  }

  const status = body.data.attributes.status;

  if (status === 'succeeded') {
    spinner.succeed('The extension package was successfully processed.');
  } else if (status === 'pending') {
    await delay(1000);
    return requestStatus(envConfig, accessToken, extensionPackageId, spinner, retries + 1);
  } else if (status === 'failed') {
    spinner.stop();
    const error = body.data.meta.status_details.errors[0];
    throw new Error(`Extension package processing failed. ${getMessageFromReactorError(error)}`);
  } else {
    spinner.stop();
    throw new Error('Unknown extension package processing status.');
  }
};

module.exports = async (envConfig, accessToken, extensionPackageId) => {
  const spinner = ora('The extension package is being processed...');
  spinner.start();
  return requestStatus(envConfig, accessToken, extensionPackageId, spinner);
};

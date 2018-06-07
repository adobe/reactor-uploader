#!/usr/bin/env node

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

const argv = require('yargs')
  .usage('Usage: $0 <zipPath> [options]')
  .env('REACTOR_UPLOADER')
  .command('zipPath', 'The local path to the extension package zip file you wish to upload.')
  .describe('env', 'The environment to which the extension packaqe should be uploaded.')
  .choices('env', ['dev', 'qe', 'integration', 'prod'])
  .describe('private-key', 'For integration-based authentication. The local path (relative or absolute) to the RSA private key. Instructions on how to generate this key can be found in the Getting Started guide (https://developer.adobelaunch.com/guides/extensions/getting-started/) and should have been used when creating your integration through the Adobe I/O console. Optionally, rather than passing the private key path as a command line argument, it can instead be provided by setting an environment variable named REACTOR_UPLOADER_PRIVATE_KEY')
  .describe('org-id', 'For integration-based authentication. Your organization ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).')
  .describe('tech-account-id', 'For integration-based authentication. Your technical account ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).')
  .describe('api-key', 'For integration-based authentication. Your API key. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).')
  .describe('client-secret', 'For integration-based authentication. Your client secret. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io). Optionally, rather than passing the client secret as a command line argument, it can instead be provided by setting an environment variable named REACTOR_UPLOADER_CLIENT_SECRET.')
  .describe('access-token', 'For access-token-based authentication. A valid access token.')
  .epilogue('For more information, see https://www.npmjs.com/package/@adobe/reactor-uploader.')
  .argv;

const chalk = require('chalk');
const getEnvironment = require('./getEnvironment');
const getAccessToken = require('./getAccessToken');
const getZipPath = require('./getZipPath');
const getExtensionName = require('./getExtensionName');
const getExtensionPackageId = require('./getExtensionPackageId');
const uploadZip = require('./uploadZip');
const monitorStatus = require('./monitorStatus');
const envConfig = require('./envConfig');

const go = async () => {
  const environment = await getEnvironment(argv);
  const envSpecificConfig = envConfig[environment];
  const accessToken = await getAccessToken(envSpecificConfig, argv);
  const zipPath = await getZipPath(argv);
  const extensionName = await getExtensionName(zipPath);
  let extensionPackageId = await getExtensionPackageId(envSpecificConfig, accessToken, extensionName);
  extensionPackageId = await uploadZip(envSpecificConfig, accessToken, extensionPackageId, zipPath);
  await monitorStatus(envSpecificConfig, accessToken, extensionPackageId);
};

(async () => {
  try {
    await go();
  } catch (error) {
    console.log(chalk.bold.red(error.message));
    process.exitCode = 1;
  }
})();

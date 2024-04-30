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
const {hideBin} = require('yargs/helpers');
const fetchWrapper = require('./fetchWrapper');
const argv = require('yargs/yargs')(hideBin(process.argv))
  .scriptName('@adobe/reactor-uploader')
  .usage('Usage: $0 <zipPath> [options]')
  .command('zipPath', 'The local path to the extension package zip file you wish to upload.')
  .options({
    'private-key': {
      type: 'string',
      describe: 'For authentication using an Adobe I/O integration. The local path (relative or absolute) to the RSA private key. Instructions on how to generate this key can be found in the Getting Started guide (https://developer.adobelaunch.com/guides/extensions/getting-started/) and should have been used when creating your integration through the Adobe I/O console. Optionally, rather than passing the private key path as a command line argument, it can instead be provided by setting one of the following environment variables, depending on the environment that will be receiving the extension package: REACTOR_IO_INTEGRATION_PRIVATE_KEY_DEVELOPMENT, REACTOR_IO_INTEGRATION_PRIVATE_KEY_QE, REACTOR_IO_INTEGRATION_PRIVATE_KEY_STAGE, REACTOR_IO_INTEGRATION_PRIVATE_KEY. REACTOR_IO_INTEGRATION_PRIVATE_KEY_QE is deprecated in favor of REACTOR_IO_INTEGRATION_PRIVATE_KEY_STAGE and will be removed in the future.'
    },
    'org-id': {
      type: 'string',
      describe: 'For authentication using an Adobe I/O integration. Your organization ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).'
    },
    'tech-account-id': {
      type: 'string',
      describe: 'For authentication using an Adobe I/O integration. Your technical account ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).'
    },
    'api-key': {
      type: 'string',
      describe: 'For authentication using an Adobe I/O integration. Your API key/Client ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io).'
    },
    'client-secret': {
      type: 'string',
      describe: 'For authentication using an Adobe I/O integration. Your client secret. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io). Optionally, rather than passing the client secret as a command line argument, it can instead be provided by setting one of the following environment variables, depending on the environment that will be receiving the extension package: REACTOR_IO_INTEGRATION_CLIENT_SECRET_DEVELOPMENT, REACTOR_IO_INTEGRATION_CLIENT_SECRET_QE, REACTOR_IO_INTEGRATION_CLIENT_SECRET_STAGE, REACTOR_IO_INTEGRATION_CLIENT_SECRET. REACTOR_IO_INTEGRATION_CLIENT_SECRET_QE is deprecated in favor of REACTOR_IO_INTEGRATION_CLIENT_SECRET_STAGE and will be removed in the future.'
    },
    'upload-timeout': {
      type: 'number',
      describe:
        'The maximum time in seconds to wait for the extension package to be uploaded. If the extension package has not been uploaded within this time, the command will exit with an error.',
      default: 50
    },
    environment: {
      type: 'string',
      describe: 'The environment to which the extension packaqe should be uploaded (for Adobe internal use only).',
      choices: ['development', 'stage', 'qe']
    },
    verbose: {
      type: 'boolean',
      describe: 'Logs additional information useful for debugging.'
    }
  })
  .epilogue('For more information, see https://www.npmjs.com/package/@adobe/reactor-uploader.')
  .argv;

const chalk = require('chalk');
const getEnvironment = require('./getEnvironment');
const getIntegrationAccessToken = require('./getIntegrationAccessToken');
const getZipPath = require('./getZipPath');
const getExtensionPackageManifest = require('./getExtensionPackageManifest');
const getExtensionPackageFromServer = require('./getExtensionPackageFromServer');
const uploadZip = require('./uploadZip');
const monitorStatus = require('./monitorStatus');
const envConfig = require('./envConfig');
const checkOldProductionEnvironmentVariables = require('./checkOldProductionEnvironmentVariables');

(async () => {
  try {
    fetchWrapper.isFetchVerbose = argv.verbose;
    const environment = getEnvironment(argv);
    const envSpecificConfig = envConfig[environment];

    checkOldProductionEnvironmentVariables();
    if (environment === 'qe') {
      console.log(chalk.bold.red("'--environment=qe' is currently redirecting to '--environment=stage' on your behalf, and will be removed in the future."))
      console.log(chalk.bold.red("Prefer usage of '--environment=stage'."))
    }

    const integrationAccessToken = await getIntegrationAccessToken(envSpecificConfig, argv);
    const zipPath = await getZipPath(argv);
    const extensionPackageManifest = await getExtensionPackageManifest(zipPath);
    const extensionPackageFromServer = await getExtensionPackageFromServer(
      envSpecificConfig,
      integrationAccessToken,
      extensionPackageManifest,
      argv
    );
    const extensionPackageId = await uploadZip(
      envSpecificConfig,
      integrationAccessToken,
      extensionPackageManifest,
      extensionPackageFromServer,
      zipPath,
      argv
    );
    await monitorStatus(
      envSpecificConfig,
      integrationAccessToken,
      extensionPackageId,
      argv
    );
  } catch (error) {
    if (argv.verbose || !error.code) {
      console.log(chalk.bold.red('--verbose output:'))
      throw error;
    }

    console.log(chalk.bold.red(error.message));
    console.log(chalk.bold.red('run in --verbose mode for full stack trace'));
    process.exitCode = 1;
  }
})();

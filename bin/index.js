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
const logVerboseHeader = require('./logVerboseHeader');
const fetchWrapper = require('./fetchWrapper');
const argv = require('yargs/yargs')(hideBin(process.argv))
  .scriptName('@adobe/reactor-uploader')
  .usage('Usage: $0 <zipPath> [options]')
  .command('zipPath', 'The local path to the extension package zip file you wish to upload.')
  .options({
    'auth.scheme': {
      type: 'string',
      description: 'The method to obtain an access token',
      choices: ['oauth-server-to-server'],
      default: 'oauth-server-to-server',
    },
    'auth.client-id': {
      type: 'string',
      description: 'For authentication using an Adobe I/O integration. Your Client ID. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io). Optionally, rather than passing the Client ID as a command line argument, it can instead be provided by setting one of the following environment variables, depending on the environment that will be receiving the extension package: REACTOR_IO_INTEGRATION_CLIENT_ID_DEVELOPMENT, REACTOR_IO_INTEGRATION_CLIENT_ID_STAGE, REACTOR_IO_INTEGRATION_CLIENT_ID'
    },
    'auth.client-secret': {
      type: 'string',
      description: 'For authentication using an Adobe I/O integration. Your Client Secret. You can find this on the overview screen for the integration you have created within the Adobe I/O console (https://console.adobe.io). Optionally, rather than passing the Client Secret as a command line argument, it can instead be provided by setting one of the following environment variables, depending on the environment that will be receiving the extension package: REACTOR_IO_INTEGRATION_CLIENT_SECRET_DEVELOPMENT, REACTOR_IO_INTEGRATION_CLIENT_SECRET_STAGE, REACTOR_IO_INTEGRATION_CLIENT_SECRET'
    },
    'auth.scope': {
      type: 'string',
      description: 'a comma-separated list of override scopes to request (e.g. openid,AdobeID,read_organizations,....)'
    },
    'auth.access-token': {
      type: 'string',
      describe: 'An access token to use, as supplied by an environment variable or other means. Replaces the need to supply' +
        ' client-id, client-secret, and scope.'
    },
    'upload-timeout': {
      type: 'number',
      describe:
        'The maximum time in seconds to wait for the extension package to be uploaded. If the extension package has not been uploaded within this time, the command will exit with an error.',
      default: 50
    },
    environment: {
      type: 'string',
      describe: 'The environment to which the extension package should be uploaded.',
      choices: ['development', 'stage', 'production'],
      default: 'production',
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
    console.log('running uploader as local stuff')
    fetchWrapper.isFetchVerbose = argv.verbose;
    const environment = getEnvironment(argv);
    const envSpecificConfig = envConfig[environment];

    checkOldProductionEnvironmentVariables();

    const integrationAccessToken = await getIntegrationAccessToken(envSpecificConfig, argv);
    if (argv.verbose) {
      if (integrationAccessToken?.length) {
        logVerboseHeader('Integration access token was retrieved');
      } else {
        logVerboseHeader('No integration access token was retrieved');
      }
    }
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
    if (true || argv.verbose || !error.code) {
      console.log(chalk.bold.red('--verbose output:'))
      throw error;
    }

    console.log(chalk.bold.red(error.message));
    console.log(chalk.bold.red('run in --verbose mode for full stack trace'));
    process.exitCode = 1;
  }
})();

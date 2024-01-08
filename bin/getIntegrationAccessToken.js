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
const getEnvironment = require('./getEnvironment');
const logVerboseHeader = require('./logVerboseHeader');
const getAuthToken = (...args) => import('@adobe/auth-token').then(({auth}) => auth(...args));

const authSchemes = ['oauth-server-to-server'];
// as of January 11, 2024 we identified that 'read_organizations' and `additional_info.projectedProductContext` were
// the only scopes required to call the API endpoints for extension packages. However, the team identified that it's
// worth asking for these other expected scopes as well.
let scopes = [
  'AdobeID',
  'openid',
  'read_organizations',
  'additional_info.job_function',
  'additional_info.projectedProductContext',
  'additional_info.roles'
];

module.exports = async (
  envConfig,
  argv
) => {
  const { auth: authConfig, verbose } = argv;
  let { scheme: authScheme, clientId, clientSecret, scope: userScopeOverride } = authConfig;
  if (verbose) {
    logVerboseHeader(`authConfig was ${JSON.stringify(authConfig)}`);
  }
  if (!authSchemes.includes(authScheme)) {
    throw new Error(`Unknown auth.scheme of "${authScheme}" provided. Must be one of ${authSchemes.join(',')}`)
  }

  clientId = authConfig.clientId || process.env[envConfig.clientIdEnvVar];
  if (!clientId) {
    ({ clientId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'What is your clientId?',
        validate: true,
      },
    ]));
  }

  clientSecret = authConfig.clientSecret || process.env[envConfig.clientSecretEnvVar];
  if (!clientSecret) {
    ({ clientSecret } = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientSecret',
        message: 'What is your clientSecret?',
        validate: true
      },
    ]));
  }

  if (userScopeOverride?.length) {
    if (!Array.isArray(userScopeOverride)) {
      scopes = [userScopeOverride].filter(s => s?.length > 0);
    }
    if (verbose) {
      logVerboseHeader('user has overridden default scope');
    }
  }

  if (scopes.length === 0) {
    throw new Error('No scopes were provided. Please provide at least one scope.');
  }
  const scopeStr = scopes.join(',');
  if (verbose) {
    logVerboseHeader(`Authenticating with scope: ${scopeStr}`);
  }

  // The technical account could be configured with one of these metascopes (sometimes called roles).
  // We have to try each one until we find the metascope that the account is using
  // because apparently there's no API to figure out which metascope the account is using beforehand.
  // If the account isn't configured for one of these metascopes, retrieving an access token
  // will rightfully fail.
  try {
    const response = await getAuthToken({
      authScheme,
      clientId,
      clientSecret,
      scope: scopeStr,
      environment: getEnvironment(argv)
    });

    return response.access_token;
  } catch (e) {
    // an unexpected error
    if (!e.code || (verbose && 'request_failed' === e.code)) {
      throw e;
    }

    const errorMessage = e.message || 'An unknown authentication error occurred.';
    const isScopeError = 'invalid_scope' === e.code;

    // throw immediately if we've encountered any error that isn't a scope error
    if (!isScopeError) {
      let preAmble = 'Error retrieving your Access Token:';
      const message = `Error Message: ${errorMessage}`;
      const code = `Error Code: ${e.code}`;
      if ('request_failed' === e.code) {
        preAmble += ' This is likely an error within @adobe/auth-token or the IMS token exchange service';
      }

      let preparedError = new Error(
        [preAmble, message, code].join('\n')
      );
      preparedError.code = e.code;
      throw preparedError;
    }
  }
};

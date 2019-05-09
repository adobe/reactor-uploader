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
const inquirer = require('inquirer');
const logVerboseHeader = require('./logVerboseHeader');
const auth = require('@adobe/jwt-auth');

const METASCOPES = [
  'ent_reactor_extension_developer_sdk',
  'ent_reactor_admin_sdk'
];

module.exports = async (
  envConfig,
  {
    privateKey,
    orgId,
    techAccountId,
    apiKey,
    clientSecret,
    verbose
  }
) => {
  privateKey = privateKey || process.env[envConfig.privateKeyEnvVar];
  clientSecret = clientSecret || process.env[envConfig.clientSecretEnvVar];

  if (!privateKey) {
    ({ privateKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'privateKey',
        message: 'What is the path (relative or absolute) to your private key?',
        validate: Boolean
      }
    ]));
  }

  if (!orgId) {
    ({ orgId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'orgId',
        message: 'What is your organization ID?',
        validate: Boolean
      }
    ]));
  }

  if (!techAccountId) {
    ({ techAccountId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'techAccountId',
        message: 'What is your technical account ID?',
        validate: Boolean
      }
    ]));
  }

  if (!apiKey) {
    ({ apiKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'What is your API key?',
        validate: Boolean
      }
    ]));
  }

  if (!clientSecret) {
    ({ clientSecret } = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientSecret',
        message: 'What is your client secret?',
        validate: Boolean
      }
    ]));
  }

  const privateKeyContent = fs.readFileSync(privateKey);

  // The technical account could be configured with one of these metascopes (sometimes called roles).
  // We have to try each one until we find the metascope that the account is using
  // because apparently there's no API to figure out which metascope the account is using beforehand.
  // If the account isn't configured for one of these metascopes, retrieving an access token
  // will rightfully fail.
  for (let i = 0; i < METASCOPES.length; i++) {
    const metascope = METASCOPES[i];

    if (verbose) {
      logVerboseHeader(`Authenticating with metascope ${metascope}`);
    }

    try {
      const response = await auth({
        clientId: apiKey,
        technicalAccountId: techAccountId,
        orgId,
        clientSecret,
        privateKey: privateKeyContent,
        metaScopes: [`${envConfig.scope}${metascope}`],
      });

      return response.access_token;
    } catch (e) {
      if (e.error !== 'invalid_scope' || i === METASCOPES.length - 1) {
        throw new Error(`Error retrieving access token. ${e.error_description}`);
      }
    }
  }
};

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
const jwt = require('jwt-simple');
const request = require('request-promise-native');
const logVerboseHeader = require('./logVerboseHeader');

const METASCOPES = [
  'ent_reactor_extension_developer_sdk',
  'ent_reactor_admin_sdk'
];

const getIntegrationAccessToken = async (
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

  // The technical account could be configured with one of these metascopes (sometimes called roles).
  // We have to try each one until we find the metascope that the account is using
  // because apparently there's no API to figure out which metascope the account is using beforehand.
  // If the account isn't configured for one of these metascopes, retrieving an access token
  // will rightfully fail.
  for (let i = 0; i < METASCOPES.length; i++) {
    const metascope = METASCOPES[i];
    const jwtPayload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      iss: orgId,
      sub: techAccountId,
      aud: envConfig.aud + apiKey,
      [`${envConfig.scope}${metascope}`]: true
    };

    if (verbose) {
      logVerboseHeader(`Authenticating with metascope ${metascope}`);
      console.log('JWT Payload:');
      console.log(jwtPayload);
    }

    const privateKeyContent = fs.readFileSync(privateKey);
    const jwtToken = jwt.encode(jwtPayload, privateKeyContent, 'RS256');
    const requestOptions = {
      method: 'POST',
      url: envConfig.jwt,
      headers: {
        'Cache-Control': 'no-cache'
      },
      form: {
        client_id: apiKey,
        client_secret: clientSecret,
        jwt_token: jwtToken
      },
      transform: JSON.parse
    };

    try {
      const body = await request(requestOptions);
      return body.access_token;
    } catch (error) {
      const parsedErrorObject = JSON.parse(error.error);
      if (parsedErrorObject.error !== 'invalid_scope' || i === METASCOPES.length - 1) {
        throw new Error(`Error retrieving access token. ${parsedErrorObject.error_description}`);
      }
    }
  }
};

const getUserEnteredAccessToken = async () => {
  const { accessToken } = await inquirer.prompt([
    {
      type: 'input',
      name: 'accessToken',
      message: 'What is your access token?',
      validate: Boolean
    }
  ]);

  return accessToken;
};

module.exports = async (envConfig, argv) => {
  if (argv.accessToken) {
    return argv.accessToken;
  }

  // argv.privateKey or argv.clientSecret might be defined if the user has their respective
  // environment variables set. We won't assume they want to use JWT if only the environment
  // variables are set, but instead check to see if there's a more explicit indication that
  // they want to use JWT by seeing if they've explicitly passed one of the
  // other JWT-related options.
  if (
    argv.orgId ||
    argv.techAccountId ||
    argv.apiKey
  ) {
    return getIntegrationAccessToken(envConfig, argv);
  }

  const { authMethod } = await inquirer.prompt([
    {
      type: 'list',
      name: 'authMethod',
      message: 'How would you like to authenticate?',
      choices: [
        {
          name: 'Provide Adobe I/O integration details',
          value: 'integration'
        },
        {
          name: 'Provide access token',
          value: 'accessToken'
        }
      ]
    }
  ]);

  if (authMethod === 'integration') {
    return getIntegrationAccessToken(envConfig, argv);
  }

  return getUserEnteredAccessToken();
};

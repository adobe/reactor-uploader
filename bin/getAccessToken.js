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

const getIntegrationAccessToken = async (
  envConfig,
  {
    privateKey,
    orgId,
    techAccountId,
    apiKey,
    clientSecret
  }
) => {
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

  const jwtPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    iss: orgId,
    sub: techAccountId,
    aud: envConfig.aud + apiKey,
    [envConfig.metascope]: true
  };
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

  let body;

  try {
    body = await request(requestOptions);
  } catch (error) {
    throw new Error(`Error retrieving access token. ${JSON.parse(error.error).error_description}`);
  }

  return body.access_token;
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

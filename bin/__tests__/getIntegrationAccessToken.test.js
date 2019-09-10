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

const proxyquire = require('proxyquire');

const METASCOPES = [
  'ent_reactor_sdk',
  // The below metascopes are necessary to maintain for integrations created before the ent_reactor_sdk metascope existed.
  'ent_reactor_extension_developer_sdk',
  'ent_reactor_admin_sdk',
];

describe('getIntegrationAccessToken', () => {
  let getIntegrationAccessToken;
  let mockInquirer;
  let mockFs;
  let mockLogVerboseHeader;

  beforeEach(() => {
    process.env.TEST_PRIVATE_KEY = 'MyPrivateKey';
    process.env.TEST_CLIENT_SECRET = 'MyClientSecret';
    mockInquirer = {
      prompt: jasmine.createSpy(),
    };
    mockFs = {
      readFileSync: () => 'privateKey',
    };
    mockAuth = jasmine.createSpy().and.returnValue({
      access_token: 'generatedAccessToken',
    });
    mockLogVerboseHeader = jasmine.createSpy();

    getIntegrationAccessToken = proxyquire('../getIntegrationAccessToken', {
      inquirer: mockInquirer,
      fs: mockFs,
      '@adobe/jwt-auth': mockAuth,
      './logVerboseHeader': mockLogVerboseHeader,
    });

    spyOn(console, 'log');
  });

  afterEach(() => {
    delete process.env.TEST_PRIVATE_KEY;
    delete process.env.TEST_CLIENT_SECRET;
  });

  describe('integration authentication method', () => {
    const expectedAuthOptions = (o = {}) =>
      Object.assign(
        {
          clientId: 'MyApiKey',
          clientSecret: 'MyClientSecret',
          technicalAccountId: 'MyTechAccountId',
          orgId: 'MyOrgId',
          privateKey: 'privateKey',
          metaScopes: [
            'https://scope.com/s/ent_reactor_sdk',
          ],
          ims: 'https://ims.com/c/',
        },
        o
      );

    it('prompts for data', async () => {
      mockInquirer.prompt.and.callFake(prompts => {
        switch (prompts[0].name) {
          case 'authMethod':
            return { authMethod: 'integration' };
          case 'privateKey':
            return { privateKey: 'MyPrivateKey' };
          case 'orgId':
            return { orgId: 'MyOrgId' };
          case 'techAccountId':
            return { techAccountId: 'MyTechAccountId' };
          case 'apiKey':
            return { apiKey: 'MyApiKey' };
          case 'clientSecret':
            return { clientSecret: 'MyClientSecret' };
        }
      });

      const accessToken = await getIntegrationAccessToken(
        {
          scope: 'https://scope.com/s/',
          ims: 'https://ims.com/c/',
        },
        {}
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('uses data from arguments', async () => {
      const accessToken = await getIntegrationAccessToken(
        {
          scope: 'https://scope.com/s/',
          ims: 'https://ims.com/c/',
        },
        {
          privateKey: 'MyPrivateKey',
          orgId: 'MyOrgId',
          techAccountId: 'MyTechAccountId',
          apiKey: 'MyApiKey',
          clientSecret: 'MyClientSecret',
        }
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('uses environment variables if respective arguments do not exist', async () => {
      const accessToken = await getIntegrationAccessToken(
        {
          scope: 'https://scope.com/s/',
          ims: 'https://ims.com/c/',
          privateKeyEnvVar: 'TEST_PRIVATE_KEY',
          clientSecretEnvVar: 'TEST_CLIENT_SECRET',
        },
        {
          orgId: 'MyOrgId',
          techAccountId: 'MyTechAccountId',
          apiKey: 'MyApiKey',
        }
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('logs additional detail in verbose mode', async () => {
      const accessToken = await getIntegrationAccessToken(
        {
          ims: 'https://ims.com/c/',
          scope: 'https://scope.com/s/',
        },
        {
          privateKey: 'MyPrivateKey',
          orgId: 'MyOrgId',
          techAccountId: 'MyTechAccountId',
          apiKey: 'MyApiKey',
          clientSecret: 'MyClientSecret',
          verbose: true,
        }
      );

      expect(mockLogVerboseHeader).toHaveBeenCalledWith(
        'Authenticating with metascope ent_reactor_sdk'
      );
      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('reports error retrieving access token', async () => {
      mockAuth.and.returnValue(
        Promise.reject({
          error: 'some error',
          error_description: 'Bad things happened.',
        })
      );

      let errorMessage;

      try {
        await getIntegrationAccessToken(
          {
            scope: 'https://scope.com/s/',
          },
          {
            privateKey: 'MyPrivateKey',
            orgId: 'MyOrgId',
            techAccountId: 'MyTechAccountId',
            apiKey: 'MyApiKey',
            clientSecret: 'MyClientSecret',
          }
        );
      } catch (error) {
        errorMessage = error.message;
      }

      expect(errorMessage).toBe(
        'Error retrieving access token. Bad things happened.'
      );
    });

    it('attempts authenticating with each supported metascope', async () => {
      mockAuth.and.returnValue(
        Promise.reject({
          error: 'invalid_scope',
          error_description: 'Invalid metascope.',
        })
      );

      let errorMessage;
      try {
        await getIntegrationAccessToken(
          {
            ims: 'https://ims.com/c/',
            scope: 'https://scope.com/s/',
          },
          {
            privateKey: 'MyPrivateKey',
            orgId: 'MyOrgId',
            techAccountId: 'MyTechAccountId',
            apiKey: 'MyApiKey',
            clientSecret: 'MyClientSecret',
          }
        );
      } catch (error) {
        errorMessage = error.message;
      }

      expect(mockAuth).toHaveBeenCalledWith(
        expectedAuthOptions({
          metaScopes: [
            'https://scope.com/s/ent_reactor_sdk',
          ],
        })
      );

      expect(mockAuth).toHaveBeenCalledWith(
        expectedAuthOptions({
          metaScopes: [
            'https://scope.com/s/ent_reactor_extension_developer_sdk',
          ],
        })
      );

      expect(mockAuth).toHaveBeenCalledWith(
        expectedAuthOptions({
          metaScopes: ['https://scope.com/s/ent_reactor_admin_sdk'],
        })
      );
      expect(mockAuth.calls.count()).toBe(METASCOPES.length);
      // This tests that if all metascopes fail, the error from the last attempt is ultimately thrown.
      expect(errorMessage).toBe(
        'Error retrieving access token. Invalid metascope.'
      );
    });
  });
});

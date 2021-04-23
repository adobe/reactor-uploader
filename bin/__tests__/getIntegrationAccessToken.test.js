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

const getEnvConfig = o => {
  return Object.assign(
    {},
    {
      scope: 'https://scope.com/s/',
      ims: 'https://ims.com/c/',
    },
    o
  );
};

const getArguments = o => {
  return Object.assign(
    {},
    {
      privateKey: 'MyPrivateKey',
      orgId: 'MyOrgId',
      techAccountId: 'MyTechAccountId',
      apiKey: 'MyApiKey',
      clientSecret: 'MyClientSecret',
    },
    o
  );
};

const mockServerErrorResponse = (message, code) => {
  let newError = new Error(message);
  newError.code = code;
  return newError;
}

const mockUnhandledException = message => {
  // this error has no "code" attribute
  return new Error(message);
}

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
        getEnvConfig(),
        getArguments()
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('uses environment variables if respective arguments do not exist', async () => {
      const accessToken = await getIntegrationAccessToken(
        getEnvConfig({
          privateKeyEnvVar: 'TEST_PRIVATE_KEY',
          clientSecretEnvVar: 'TEST_CLIENT_SECRET',
        }),
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
        getEnvConfig(),
        getArguments({ verbose: true })
      );

      expect(mockLogVerboseHeader).toHaveBeenCalledWith(
        'Authenticating with metascope ent_reactor_sdk'
      );
      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('reports error retrieving access token', async () => {
      const mockedAuthError = mockServerErrorResponse('some error: Bad things happened', 'server_error_code');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        await getIntegrationAccessToken(
          {
            scope: 'https://scope.com/s/',
          },
          getArguments()
        );
      } catch (error) {
        returnedError = error;
      }

      // we bailed after the first call because it wasn't a scoping error
      expect(mockAuth.calls.count()).toBe(1)

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBeTrue();
      expect(returnedError.message.includes('Error Message: some error: Bad things happened')).toBeTrue();
      expect(returnedError.message.includes('Error Code: server_error_code')).toBeTrue();
      expect(returnedError.code).toBe('server_error_code');
    });

    it('attempts authenticating with each supported metascope', async () => {
      const mockedAuthError = mockServerErrorResponse('invalid_scope: Invalid metascope.', 'invalid_scope');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        await getIntegrationAccessToken(getEnvConfig(), getArguments());
      } catch (error) {
        returnedError = error;
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
      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBeTrue();
      expect(returnedError.message.includes('Error Message: invalid_scope: Invalid metascope.')).toBeTrue();
      expect(returnedError.message.includes('Error Code: invalid_scope')).toBeTrue();
      expect(returnedError.code).toBe('invalid_scope');
    });

    it('throws a stack trace when error.code is missing', async () => {
      const mockedAuthError = mockUnhandledException('500 server error');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        // should be going through a bunch of scopes
        await getIntegrationAccessToken(getEnvConfig(), getArguments());
      } catch (error) {
        returnedError = error;
      }

      // however, when we don't see an error.code, we bail and report
      expect(mockAuth.calls.count()).toBe(1);
      // the message should not have any of our pretty formatting
      expect(returnedError.message).toBe('500 server error');
      expect(returnedError.code).toBeFalsy();
    });

    it('throws a stack trace when --verbose and request_failed', async () => {
      const mockedAuthError = mockServerErrorResponse('some error', 'request_failed');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        // should be going through a bunch of scopes
        await getIntegrationAccessToken(getEnvConfig(), getArguments({ verbose: true }));
      } catch (error) {
        returnedError = error;
      }

      // however, when we don't see an error.code, we bail and report
      expect(mockAuth.calls.count()).toBe(1);
      // the message should not have any of our pretty formatting
      expect(returnedError.message).toBe('some error');
      expect(returnedError.code).toBe('request_failed');
    });

    it('shows JS error details in case they happen', async () => {
      const mockedAuthError = mockServerErrorResponse('some error', 'server_error_code');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        await getIntegrationAccessToken(getEnvConfig(), getArguments());
      } catch (error) {
        returnedError = error;
      }

      // we bailed after the first call because it wasn't a scoping error
      expect(mockAuth.calls.count()).toBe(1)

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBeTrue();
      expect(returnedError.message.includes('Error Message: some error')).toBeTrue();
      expect(returnedError.message.includes('Error Code: server_error_code')).toBeTrue();
      expect(returnedError.code).toBe('server_error_code');
    });

    it('contains a fallback message for authentication errors', async () => {
      // don't supply a message during auth failure
      const mockedAuthError = mockServerErrorResponse(undefined, 'server_error_code');
      mockAuth.and.returnValue(
        Promise.reject(mockedAuthError)
      );

      let returnedError;
      try {
        await getIntegrationAccessToken(
          {
            scope: 'https://scope.com/s/'
          },
          {
            privateKey: 'MyPrivateKey',
            orgId: 'MyOrgId',
            techAccountId: 'MyTechAccountId',
            apiKey: 'MyApiKey',
            clientSecret: 'MyClientSecret'
          }
        );
      } catch (error) {
        returnedError = error;
      }

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBeTrue();
      expect(returnedError.message.includes('Error Message: An unknown authentication error occurred')).toBeTrue();
      expect(returnedError.message.includes('Error Code: server_error_code')).toBeTrue();
      expect(returnedError.code).toBe('server_error_code');
    });
  });
});

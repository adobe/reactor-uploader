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
const getEnvConfig = o => {
  return Object.assign(
    {},
    {},
    o
  );
};

const getArguments = o => {
  return Object.assign(
    {},
    {
      auth: {
        clientId: 'MyTestClientId',
        clientSecret: 'MyTestClientSecret',
        scope: 'read_organizations,test_fake_scope',
        scheme: 'oauth-server-to-server'
      },
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
  let mockAuth;
  let consoleSpy;

  beforeEach(async() => {
    process.env.TEST_CLIENT_ID = 'MyTestClientId';
    process.env.TEST_CLIENT_SECRET = 'MyTestClientSecret';
    mockAuth = jest.fn().mockResolvedValue({ access_token: 'getIntegrationAccessToken -- value' });
    jest.mock('@adobe/auth-token', () => ({
      auth: mockAuth
    }));
    mockInquirer = jest.mock('inquirer', () => ({
      prompt: jest.fn().mockImplementation(([ prompt ]) => {
        switch (prompt.name) {
          case 'clientId':
            return { clientId: 'MyTestClientId' };
          case 'clientSecret':
            return { clientSecret: 'MyTestClientSecret' };
        }
      })
    }));
    jest.resetModules();
    // Import the module with dynamic import
    await import('../getIntegrationAccessToken.js').then((module) => {
      getIntegrationAccessToken = module.default;
    });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    delete process.env.TEST_CLIENT_ID;
    delete process.env.TEST_CLIENT_SECRET;
    jest.clearAllMocks();
  });

  describe('integration authentication method', () => {
    const expectedAuthOptions = (o = {}) =>
      Object.assign(
        { // this is the shape from https://github.com/adobe/auth-token
          clientId: 'MyTestClientId',
          clientSecret: 'MyTestClientSecret',
          scope: 'read_organizations,test_fake_scope',
          authScheme: 'oauth-server-to-server',
          environment: 'production'
        },
        o
      );

    it('prompts for data', async () => {
      const accessToken = await getIntegrationAccessToken(
        {},
        {
          auth: {
            scheme: 'oauth-server-to-server'
          }
        }
      );

      // we did not override scope at all here, so it's the full default scope
      expect(mockAuth).toHaveBeenCalledWith(
        {
          ...expectedAuthOptions(),
          scope: 'AdobeID,openid,read_organizations,additional_info.job_function,additional_info.projectedProductContext,additional_info.roles'
        }
      );
      expect(accessToken).toBe('getIntegrationAccessToken -- value');
    });

    it('uses data from arguments', async () => {
      const accessToken = await getIntegrationAccessToken(
        getEnvConfig(),
        getArguments()
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('getIntegrationAccessToken -- value');
    });

    it('uses environment variables if respective arguments do not exist', async () => {
      const accessToken = await getIntegrationAccessToken(
        getEnvConfig({
          privateKeyEnvVar: 'TEST_PRIVATE_KEY',
          clientSecretEnvVar: 'TEST_CLIENT_SECRET',
        }),
        getArguments()
      );

      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('getIntegrationAccessToken -- value');
    });

    it('logs additional detail in verbose mode', async () => {
      const callArgs = getArguments({ verbose: true });
      const accessToken = await getIntegrationAccessToken(
        getEnvConfig(),
        callArgs
      );

      // call fresh for getArguments() because the key of "verbose" is not expected to be in there.
      // Additionally, we aren't logging out the keyword "auth", just the keys inside of that.
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'authConfig was ' + JSON.stringify(getArguments().auth)
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user has overridden default scope')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authenticating with scope: read_organizations,test_fake_scope')
      );
      expect(mockAuth).toHaveBeenCalledWith(expectedAuthOptions());
      expect(accessToken).toBe('getIntegrationAccessToken -- value');
    });

    it('reports error retrieving access token', async () => {
      const mockedAuthError = mockServerErrorResponse('some error: Bad things happened', 'server_error_code');
      mockAuth.mockImplementationOnce(() => Promise.reject(mockedAuthError));

      let returnedError;
      try {
        await getIntegrationAccessToken(
          {},
          getArguments()
        );
      } catch (error) {
        returnedError = error;
      }

      // we bailed after the first call because it wasn't a scoping error
      expect(mockAuth).toHaveBeenCalledTimes(1)

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBe(true);
      expect(returnedError.message.includes('Error Message: some error: Bad things happened')).toBe(true);
      expect(returnedError.message.includes('Error Code: server_error_code')).toBe(true);
      expect(returnedError.code).toBe('server_error_code');
    });

    it('throws a stack trace when error.code is missing', async () => {
      const mockedAuthError = mockUnhandledException('500 server error');
      mockAuth.mockImplementationOnce(() => Promise.reject(mockedAuthError));

      let returnedError;
      try {
        // should be going through a bunch of scopes
        await getIntegrationAccessToken(getEnvConfig(), getArguments());
      } catch (error) {
        returnedError = error;
      }

      // however, when we don't see an error.code, we bail and report
      expect(mockAuth).toHaveBeenCalledTimes(1);
      // the message should not have any of our pretty formatting
      expect(returnedError.message).toBe('500 server error');
      expect(returnedError.code).toBeFalsy();
    });

    it('throws a stack trace when --verbose and request_failed', async () => {
      const mockedAuthError = mockServerErrorResponse('some error', 'request_failed');
      mockAuth.mockImplementationOnce(() => Promise.reject(mockedAuthError));

      let returnedError;
      try {
        // should be going through a bunch of scopes
        await getIntegrationAccessToken(getEnvConfig(), getArguments({ verbose: true }));
      } catch (error) {
        returnedError = error;
      }

      // however, when we don't see an error.code, we bail and report
      expect(mockAuth).toHaveBeenCalledTimes(1);
      // the message should not have any of our pretty formatting
      expect(returnedError.message).toBe('some error');
      expect(returnedError.code).toBe('request_failed');
    });
    //
    it('shows JS error details in case they happen', async () => {
      const mockedAuthError = mockServerErrorResponse('some error', 'server_error_code');
      mockAuth.mockImplementationOnce(() => Promise.reject(mockedAuthError));

      let returnedError;
      try {
        await getIntegrationAccessToken(getEnvConfig(), getArguments());
      } catch (error) {
        returnedError = error;
      }

      // we bailed after the first call because it wasn't a scoping error
      expect(mockAuth).toHaveBeenCalledTimes(1)

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBe(true);
      expect(returnedError.message.includes('Error Message: some error')).toBe(true);
      expect(returnedError.message.includes('Error Code: server_error_code')).toBe(true);
      expect(returnedError.code).toBe('server_error_code');
    });

    it('contains a fallback message for authentication errors', async () => {
      // don't supply a message during auth failure
      const mockedAuthError = mockServerErrorResponse(undefined, 'server_error_code');
      mockAuth.mockImplementationOnce(() => Promise.reject(mockedAuthError));

      let returnedError;
      try {
        await getIntegrationAccessToken(
          {},
          getArguments()
        );
      } catch (error) {
        returnedError = error;
      }

      expect(returnedError.message.includes('Error retrieving your Access Token:')).toBe(true);
      expect(returnedError.message.includes('Error Message: An unknown authentication error occurred')).toBe(true);
      expect(returnedError.message.includes('Error Code: server_error_code')).toBe(true);
      expect(returnedError.code).toBe('server_error_code');
    });
  });
});

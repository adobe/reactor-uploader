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
  'ent_reactor_extension_developer_sdk',
  'ent_reactor_admin_sdk'
];

describe('getAccessToken', () => {
  let getAccessToken;
  let mockInquirer;
  let mockFs;
  let mockJwt;
  let mockRequest;

  beforeEach(() => {
    process.env.TEST_PRIVATE_KEY = 'MyPrivateKey';
    process.env.TEST_CLIENT_SECRET = 'MyClientSecret';
    mockInquirer = {
      prompt: jasmine.createSpy()
    };
    mockFs = {
      readFileSync: () => 'privateKey'
    };
    mockJwt = {
      encode: jasmine.createSpy().and.returnValue('generatedJwtToken')
    };
    mockRequest = jasmine.createSpy().and.returnValue({
      access_token: 'generatedAccessToken'
    });

    getAccessToken = proxyquire('../getAccessToken', {
      inquirer: mockInquirer,
      fs: mockFs,
      'jwt-simple': mockJwt,
      'request-promise-native': mockRequest
    });
  });

  afterEach(() => {
    delete process.env.TEST_PRIVATE_KEY;
    delete process.env.TEST_CLIENT_SECRET;
  });

  it('returns access token argument', async () => {
    const result = await getAccessToken({}, {
      accessToken: 'ABC'
    });

    expect(result).toBe('ABC');
  });

  [
    'orgId',
    'techAccountId',
    'apiKey'
  ].forEach((argName) => {
    it(`assumes user is authenticating via an integration if ${argName} argument is provided`, async () => {
      mockInquirer.prompt.and.returnValue(new Promise((resolve) => {}));

      getAccessToken({}, {
        [argName]: 'ABC'
      });

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'privateKey',
          message: jasmine.any(String),
          validate: Boolean
        }
      ]);
    });
  });

  describe('integration authentication method', () => {
    const expectedRequestOptions = {
      method: 'POST',
      url: 'https://jwtendpoint.com',
      headers: {
        'Cache-Control': 'no-cache'
      },
      form: {
        client_id: 'MyApiKey',
        client_secret: 'MyClientSecret',
        jwt_token: 'generatedJwtToken'
      },
      transform: JSON.parse
    };

    beforeEach(() => {
      mockJwt.encode.and.returnValue('generatedJwtToken');
      mockRequest.and.returnValue({
        access_token: 'generatedAccessToken'
      });
    });

    it('prompts for data', async () => {
      mockInquirer.prompt.and.callFake((prompts) => {
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

      const accessToken = await getAccessToken({
        jwt: 'https://jwtendpoint.com'
      }, {});

      expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('uses data from arguments', async () => {
      const accessToken = await getAccessToken({
        jwt: 'https://jwtendpoint.com'
      }, {
        privateKey: 'MyPrivateKey',
        orgId: 'MyOrgId',
        techAccountId: 'MyTechAccountId',
        apiKey: 'MyApiKey',
        clientSecret: 'MyClientSecret'
      });

      expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('uses environment variables if respective arguments do not exist', async () => {
      const accessToken = await getAccessToken({
        jwt: 'https://jwtendpoint.com',
        privateKeyEnvVar: 'TEST_PRIVATE_KEY',
        clientSecretEnvVar: 'TEST_CLIENT_SECRET',
      }, {
        orgId: 'MyOrgId',
        techAccountId: 'MyTechAccountId',
        apiKey: 'MyApiKey'
      });

      expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
      expect(accessToken).toBe('generatedAccessToken');
    });

    it('reports error retrieving access token', async () => {
      const error = new Error();
      error.error = JSON.stringify({
        error_description: 'Bad things happened.'
      });
      mockRequest.and.throwError(error);

      let errorMessage;

      try {
        await getAccessToken({
          jwt: 'https://jwtendpoint.com'
        }, {
          privateKey: 'MyPrivateKey',
          orgId: 'MyOrgId',
          techAccountId: 'MyTechAccountId',
          apiKey: 'MyApiKey',
          clientSecret: 'MyClientSecret'
        });
      } catch (error) {
        errorMessage = error.message;
      }

      expect(errorMessage).toBe('Error retrieving access token. Bad things happened.');
    });

    it('attempts authenticating with each supported metascope', async () => {
      const error = new Error();
      error.error = '{"error":"invalid_scope","error_description":"Invalid metascope."}';
      mockRequest.and.throwError(error);

      let errorMessage;
      try {
        await getAccessToken({
          jwt: 'https://jwtendpoint.com',
          aud: 'https://aud.com/c/',
          scope: 'https://scope.com/s/'
        }, {
          privateKey: 'MyPrivateKey',
          orgId: 'MyOrgId',
          techAccountId: 'MyTechAccountId',
          apiKey: 'MyApiKey',
          clientSecret: 'MyClientSecret'
        });
      } catch (error) {
        errorMessage = error.message;
      }

      METASCOPES.forEach((metascope) => {
        expect(mockJwt.encode).toHaveBeenCalledWith({
          exp: jasmine.any(Number),
          iss: 'MyOrgId',
          sub: 'MyTechAccountId',
          aud: 'https://aud.com/c/MyApiKey',
          [`https://scope.com/s/${metascope}`]: true
        }, 'privateKey', 'RS256');
      });
      expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
      expect(mockRequest.calls.count()).toBe(METASCOPES.length);
      // This tests that if all metascopes fail, the error from the last attempt is ultimately thrown.
      expect(errorMessage).toBe('Error retrieving access token. Invalid metascope.');
    });
  });

  describe('access token authentication method', () => {
    it('prompts for data', async () => {
      mockInquirer.prompt.and.callFake((prompts) => {
        switch (prompts[0].name) {
          case 'authMethod':
            return { authMethod: 'accessToken' };
          case 'accessToken':
            return { accessToken: 'MyAccessToken' };
        }
      });

      const accessToken = await getAccessToken({}, {});

      expect(accessToken).toBe('MyAccessToken');
    });

    it('uses data from arguments', async () => {
      const accessToken = await getAccessToken({}, {
        accessToken: 'MyAccessToken'
      });

      expect(accessToken).toBe('MyAccessToken');
    });
  })
});

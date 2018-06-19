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
const chalk = require('chalk');
const getReactorHeaders = require('../getReactorHeaders');

describe('getExtensionPackageId', () => {
  const envConfig = {
    extensionPackages: 'https://extensionpackages'
  };
  const accessToken = 'fake-token';
  const extensionPackageName = 'fake-extension';
  let mockRequest;
  let mockHandleResponseError;
  let getExtensionPackageId;

  const expectedRequestOptions = {
    method: 'GET',
    url: 'https://extensionpackages?page[size]=1&page[number]=1&filter[name]=EQ fake-extension',
    headers: getReactorHeaders('fake-token'),
    transform: JSON.parse
  };

  beforeEach(() => {
    mockRequest = jasmine.createSpy();
    mockHandleResponseError = jasmine.createSpy().and.throwError();
    getExtensionPackageId = proxyquire('../getExtensionPackageId', {
      'request-promise-native': mockRequest,
      './handleResponseError': mockHandleResponseError
    });
    spyOn(console, 'log');
  });

  it('returns ID from existing extension package', async () => {
    mockRequest.and.returnValue({
      data: [
        {
          id: 'EP123'
        }
      ]
    });

    const result = await getExtensionPackageId(envConfig, accessToken, extensionPackageName);

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(result).toBe('EP123');
    expect(console.log).toHaveBeenCalledWith(`An existing extension package with ` +
      `the name ${chalk.bold('fake-extension')} was ` +
      `found on the server and will be updated. The extension package ID ` +
      `is ${chalk.bold('EP123')}.`);
  });

  it('returns undefined if no extension package found', async () => {
    mockRequest.and.returnValue({
      data: []
    });

    const result = await getExtensionPackageId(envConfig, accessToken, extensionPackageName);

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(`No extension package was found on the server ` +
      `with the name ${chalk.bold('fake-extension')}. ` +
      `A new extension package will be created.`);
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockRequest.and.throwError(error);

    try {
      await getExtensionPackageId(envConfig, accessToken, extensionPackageName);
    } catch (e) {}

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(mockHandleResponseError).toHaveBeenCalledWith(error, jasmine.any(String));
  });
});

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
const getReactorHeaders = require('../getReactorHeaders');

describe('getExtensionPackageFromServer', () => {
  const envConfig = {
    extensionPackages: 'https://extensionpackages'
  };
  const accessToken = 'fake-token';
  const extensionPackageManifest = {
    name: 'fake-extension',
    platform: 'web'
  };
  let mockRequest;
  let mockHandleResponseError;
  let mockLogVerboseHeader;
  let getExtensionPackageFromServer;

  const expectedRequestOptions = {
    method: 'GET',
    url: 'https://extensionpackages',
    qs: {
      'page[size]': 1,
      'page[number]': 1,
      'filter[name]': 'EQ fake-extension',
      'filter[platform]': 'EQ web',
      'filter[status]': 'EQ succeeded,EQ failed'
    },
    headers: getReactorHeaders('fake-token'),
    transform: JSON.parse
  };

  beforeEach(() => {
    mockRequest = jasmine.createSpy();
    mockHandleResponseError = jasmine.createSpy().and.throwError();
    mockLogVerboseHeader = jasmine.createSpy();
    getExtensionPackageFromServer = proxyquire('../getExtensionPackageFromServer', {
      'request-promise-native': mockRequest,
      './handleResponseError': mockHandleResponseError,
      './logVerboseHeader': mockLogVerboseHeader
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

    const result = await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(result.id).toBe('EP123');
  });

  it('returns null if no extension package found', async () => {
    mockRequest.and.returnValue({
      data: []
    });

    const result = await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(result).toBeNull();
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockRequest.and.throwError(error);

    try {
      await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});
    } catch (e) {}

    expect(mockRequest).toHaveBeenCalledWith(expectedRequestOptions);
    expect(mockHandleResponseError).toHaveBeenCalledWith(error, jasmine.any(String));
  });

  it('logs additional detail in verbose mode', async () => {
    try {
      await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, { verbose: true });
    } catch (e) {}

    expect(mockLogVerboseHeader).toHaveBeenCalledWith('Retrieving extension package from server');
  });
});

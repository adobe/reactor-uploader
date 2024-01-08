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
  let mockFetch;
  let mockFetchJsonHandler;
  let mockHandleResponseError;
  let getExtensionPackageFromServer;
  let consoleSpy;

  const _constructedURL = new URL('https://extensionpackages');
  _constructedURL.search = new URLSearchParams({
    'page[size]': 1,
    'page[number]': 1,
    'filter[name]': 'EQ fake-extension',
    'filter[platform]': 'EQ web',
    'filter[availability]': 'EQ development'
  }).toString();

  const expectedURL = _constructedURL.toString();
  const expectedRequestOptions = {
    method: 'GET',
    headers: getReactorHeaders('fake-token')
  };

  beforeEach(() => {
    mockFetchJsonHandler = jest.fn()
    mockFetch = jest.fn().mockResolvedValue({
      json: mockFetchJsonHandler
    });
    jest.mock('../fetchWrapper', () => ({
      fetch: mockFetch
    }));
    mockHandleResponseError = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    jest.mock('../handleResponseError', () => mockHandleResponseError);
    jest.resetModules();
    getExtensionPackageFromServer = require('../getExtensionPackageFromServer.js');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ID from existing extension package', async () => {
    mockFetchJsonHandler.mockImplementationOnce(() => ({
      data: [
        {
          id: 'EP123'
        }
      ]
    }));

    const result = await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(result.id).toBe('EP123');
  });

  it('returns null if no extension package found', async () => {
    mockFetchJsonHandler.mockImplementationOnce(() => ({
      data: []
    }));

    const result = await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(result).toBeNull();
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockFetchJsonHandler.mockImplementationOnce(() => {
      throw error;
    });

    try {
      await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, {});
    } catch (e) {}

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(mockHandleResponseError).toHaveBeenCalledWith(error, expect.any(String));
  });

  it('logs additional detail in verbose mode', async () => {
    try {
      await getExtensionPackageFromServer(envConfig, accessToken, extensionPackageManifest, { verbose: true });
    } catch (e) {}

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Retrieving extension package from server')
    );
  });
});

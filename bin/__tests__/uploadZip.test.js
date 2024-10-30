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

const chalk = require('chalk');
const getReactorHeaders = require('../getReactorHeaders');

describe('uploadZip', () => {
  let mockFetch;
  let mockFs;
  let mockReadStream;
  let mockHandleResponseError;
  let uploadZip;
  let consoleSpy;

  const extensionPackageManifest = {
    name: 'fake-extension',
    platform: 'web'
  };
  class MockFormData {
    append() {}
  }

  beforeEach(() => {
    mockFetch = jest.fn();
    mockReadStream = {};
    mockFs = {
      createReadStream: jest.fn().mockReturnValue(mockReadStream)
    };
    mockHandleResponseError = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        data: {
          id: 'EP123'
        }
      })
    })
    jest.mock('../fetchWrapper', () => ({
      fetch: mockFetch
    }));
    jest.mock('../handleResponseError', () => mockHandleResponseError);
    jest.mock('form-data', () => MockFormData);
    jest.mock('fs', () => mockFs);

    jest.resetModules();
    uploadZip = require('../uploadZip.js');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uploads a zip for a new extension package', async () => {
    const extensionPackageId = await uploadZip(
      {
        extensionPackages: 'https://extensionpackages.com',
      },
      'generatedAccessToken',
      extensionPackageManifest,
      null,
      '/extension.zip',
      {}
    );

    expect(mockFs.createReadStream).toHaveBeenCalledWith('/extension.zip');
    expect(mockFetch).toHaveBeenCalledWith('https://extensionpackages.com', {
      method: 'POST',
      headers: getReactorHeaders('generatedAccessToken'),
      body: expect.any(MockFormData)
    });
    expect(console.log).toHaveBeenCalledWith(`No development extension package was found on the server with the ` +
      `name ${chalk.bold('fake-extension')}. A new extension package will be created.`);
    expect(console.log).toHaveBeenCalledWith(`The extension package has been assigned the ` +
      `ID ${chalk.bold('EP123')}.`);
    expect(extensionPackageId).toBe('EP123');
  });

  it('uploads a zip for an existing extension package with development availability', async () => {
    const extensionPackageId = await uploadZip(
      {
        extensionPackages: 'https://extensionpackages.com',
      },
      'generatedAccessToken',
      extensionPackageManifest,
      {
        id: 'EP123',
        attributes: {
          availability: 'development'
        }
      },
      '/extension.zip',
      {}
    );

    expect(mockFs.createReadStream).toHaveBeenCalledWith('/extension.zip');
    expect(mockFetch).toHaveBeenCalledWith('https://extensionpackages.com/EP123', {
      method: 'PATCH',
      headers: getReactorHeaders('generatedAccessToken'),
      body: expect.any(MockFormData)
    });
    expect(console.log).toHaveBeenCalledWith(`An existing development extension package with the name ` +
      `${chalk.bold('fake-extension')} was found on the server and will be updated. ` +
      `The extension package ID is ${chalk.bold('EP123')}.`);
    expect(extensionPackageId).toBe('EP123');
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockFetch.mockImplementationOnce(() => {
      throw error;
    });

    try {
      await uploadZip(
        {
          extensionPackages: 'https://extensionpackages.com',
        },
        'generatedAccessToken',
        extensionPackageManifest,
        {
          id: 'EP123',
          attributes: {
            availability: 'development'
          }
        },
        '/extension.zip',
        {}
      );
    } catch (e) {}

    expect(mockHandleResponseError).toHaveBeenCalledWith(error, expect.any(String));
  });

  it('logs additional detail in verbose mode', async () => {
    await uploadZip(
      {
        extensionPackages: 'https://extensionpackages.com',
      },
      'generatedAccessToken',
      extensionPackageManifest,
      null,
      '/extension.zip',
      { verbose: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Uploading zip')
    );
  });

  it('gracefully handles when an extension package id is missing', async function () {
    mockFetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        errors: [{
          id: 'abc-123',
          code: 'invalid version',
          detail: 'The package you uploaded is older than the latest known version.'
        }]
      })
    });

    try {
      await uploadZip(
        {
          extensionPackages: 'https://extensionpackages.com',
        },
        'generatedAccessToken',
        extensionPackageManifest,
        {
          id: 'EP123',
          attributes: {
            availability: 'development'
          }
        },
        '/extension.zip',
        {}
      );
    } catch (e) {}

    expect(mockHandleResponseError).toHaveBeenCalledWith(expect.any(Error), expect.any(String));
    const [error] = mockHandleResponseError.mock.calls[0];
    expect(error.message).toContain('No extension package ID was returned from the API');
    expect(error.message).toContain('invalid version');
    expect(error.message).toContain('The package you uploaded is older than the latest known version.');

    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`No development extension package was found on the server with the ` +
      `name ${chalk.bold('fake-extension')}. A new extension package will be created.`)
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`The extension package has been assigned the ` +
        `ID ${chalk.bold('EP123')}.`)
    );
  });
});

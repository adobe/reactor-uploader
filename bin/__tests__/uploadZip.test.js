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

describe('uploadZip', () => {
  let mockFetch;
  let mockFs;
  let mockReadStream;
  let mockFormData;
  let mockHandleResponseError;
  let mockLogVerboseHeader;
  let uploadZip;

  const extensionPackageManifest = {
    name: 'fake-extension',
    platform: 'web'
  };
  class MockFormData {
    append() {}
  }

  beforeEach(() => {
    mockFetch = jasmine.createSpy();
    mockReadStream = {};
    mockFs = {
      createReadStream: jasmine.createSpy().and.returnValue(mockReadStream)
    };
    mockHandleResponseError = jasmine.createSpy().and.throwError();
    mockLogVerboseHeader = jasmine.createSpy();
    spyOn(console, 'log');
    uploadZip = proxyquire('../uploadZip', {
      fs: mockFs,
      './fetchWrapper': {
        fetch: mockFetch.and.returnValue(
          Promise.resolve({
            json: jasmine.createSpy().and.returnValue(
              Promise.resolve({
                data: {
                  id: 'EP123'
                }
              })
            )
          })
        )
      },
      './handleResponseError': mockHandleResponseError,
      './logVerboseHeader': mockLogVerboseHeader,
      'form-data': MockFormData
    });
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
      body: jasmine.any(MockFormData)
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
      body: jasmine.any(MockFormData)
    });
    expect(console.log).toHaveBeenCalledWith(`An existing development extension package with the name ` +
      `${chalk.bold('fake-extension')} was found on the server and will be updated. ` +
      `The extension package ID is ${chalk.bold('EP123')}.`);
    expect(extensionPackageId).toBe('EP123');
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockFetch.and.throwError(error);

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

    expect(mockHandleResponseError).toHaveBeenCalledWith(error, jasmine.any(String));
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

    expect(mockLogVerboseHeader).toHaveBeenCalledWith('Uploading zip');
  });

  it('gracefully handles when an extension package id is missing', async function () {
    uploadZip = proxyquire('../uploadZip', {
      fs: mockFs,
      './fetchWrapper': {
        fetch: jasmine.createSpy().and.returnValue(
          Promise.resolve({
            json: jasmine.createSpy().and.returnValue(
              Promise.resolve({
                errors: [{
                  id: 'abc-123',
                  code: 'invalid version',
                  detail: 'The package you uploaded is older than the latest known version.'
                }]
              })
            )
          })
        )
      },
      './handleResponseError': mockHandleResponseError,
      './logVerboseHeader': mockLogVerboseHeader,
      'form-data': MockFormData
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

    expect(mockHandleResponseError).toHaveBeenCalledWith(jasmine.any(Error), jasmine.any(String));
    const [error] = mockHandleResponseError.calls.first().args;
    expect(error.message).toContain('No extension package ID was returned from the API');
    expect(error.message).toContain('invalid version');
    expect(error.message).toContain('The package you uploaded is older than the latest known version.');

    expect(console.log).not.toHaveBeenCalledWith(`No development extension package was found on the server with the ` +
      `name ${chalk.bold('fake-extension')}. A new extension package will be created.`);
    expect(console.log).not.toHaveBeenCalledWith(`The extension package has been assigned the ` +
      `ID ${chalk.bold('EP123')}.`);
  });
});

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
  let mockRequest;
  let mockFs;
  let mockReadStream;
  let mockHandleResponseError;
  let mockLogVerboseHeader;
  let uploadZip;

  const extensionPackageManifest = {
    name: 'fake-extension',
    platform: 'web'
  };

  beforeEach(() => {
    mockRequest = jasmine.createSpy().and.returnValue({
      data: {
        id: 'EP123'
      }
    });
    mockReadStream = {};
    mockFs = {
      createReadStream: jasmine.createSpy().and.returnValue(mockReadStream)
    };
    mockHandleResponseError = jasmine.createSpy().and.throwError();
    mockLogVerboseHeader = jasmine.createSpy();
    spyOn(console, 'log');
    uploadZip = proxyquire('../uploadZip', {
      fs: mockFs,
      'request-promise-native': mockRequest,
      './handleResponseError': mockHandleResponseError,
      './logVerboseHeader': mockLogVerboseHeader
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
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://extensionpackages.com',
      headers: getReactorHeaders('generatedAccessToken'),
      formData: {
        package: mockReadStream
      },
      transform: JSON.parse
    });
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
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'PATCH',
      url: 'https://extensionpackages.com/EP123',
      headers: getReactorHeaders('generatedAccessToken'),
      formData: {
        package: mockReadStream
      },
      transform: JSON.parse
    });
    expect(console.log).toHaveBeenCalledWith(`An existing extension package with the name ` +
      `${chalk.bold('fake-extension')} was found on the server and will be updated. ` +
      `The extension package ID is ${chalk.bold('EP123')}.`);
    expect(extensionPackageId).toBe('EP123');
  });

  it('uploads a zip for an existing extension package with non-development availability', async () => {
    const extensionPackageId = await uploadZip(
      {
        extensionPackages: 'https://extensionpackages.com',
      },
      'generatedAccessToken',
      extensionPackageManifest,
      {
        id: 'EP123',
        attributes: {
          availability: 'private'
        }
      },
      '/extension.zip',
      {}
    );

    expect(mockFs.createReadStream).toHaveBeenCalledWith('/extension.zip');
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://extensionpackages.com',
      headers: getReactorHeaders('generatedAccessToken'),
      formData: {
        package: mockReadStream
      },
      transform: JSON.parse
    });
    expect(console.log).toHaveBeenCalledWith(`An existing extension package with the name ` +
      `${chalk.bold('fake-extension')} was found on the server, but because its availability is not ` +
      `${chalk.bold('development')}, a development version of the extension package will be created.`);
    expect(extensionPackageId).toBe('EP123');
  });

  it('calls handleResponseError on response error', async () => {
    const error = new Error();
    mockRequest.and.throwError(error);

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
});

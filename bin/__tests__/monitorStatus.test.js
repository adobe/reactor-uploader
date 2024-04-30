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

const os = require('os');
const chalk = require('chalk');
const proxyquire = require('proxyquire');
const getReactorHeaders = require('../getReactorHeaders');

describe('monitorStatus', () => {
  const envConfig = {
    extensionPackages: 'https://extensionpackages'
  };
  const accessToken = 'fake-token';
  const extensionPackageId = 'EP123';
  let mockFetch;
  let mockFetchJsonHandler;
  let mockLogVerboseHeader;
  let monitorStatus;
  let spinner;

  const expectedURL = 'https://extensionpackages/EP123';
  const expectedRequestOptions = {
    method: 'GET',
    headers: getReactorHeaders('fake-token')
  };

  beforeEach(() => {
    mockFetch = jasmine.createSpy();
    mockFetchJsonHandler = jasmine.createSpy();
    mockLogVerboseHeader = jasmine.createSpy();
    const mockHandleResponseError = jasmine.createSpy().and.throwError();
    monitorStatus = proxyquire('../monitorStatus', {
      './fetchWrapper': {
        fetch: mockFetch.and.returnValue(
          Promise.resolve({
            json: mockFetchJsonHandler
          })
        )
      },
      'ora': () => {
        spinner = jasmine.createSpyObj('spinner', ['start', 'stop', 'succeed']);
        return spinner;
      },
      'delay': () => {},
      './handleResponseError': mockHandleResponseError,
      './logVerboseHeader': mockLogVerboseHeader
    });
  });

  it('reports a successful extension package', async () => {
    mockFetchJsonHandler.and.returnValue({
      data: {
        attributes: {
          status: 'succeeded'
        }
      }
    });

    await monitorStatus(envConfig, accessToken, extensionPackageId, {});

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalled();
  });

  it('continues monitoring a pending extension package up to 50 requests', async () => {
    mockFetchJsonHandler.and.returnValue({
      data: {
        attributes: {
          status: 'pending'
        }
      }
    });

    let errorMessage;

    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, {uploadTimeout: 50});
    } catch (error) {
      errorMessage = error.message;
    }

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).not.toHaveBeenCalled();
    expect(errorMessage).toBe('The extension package failed to be processed within the expected timeframe.');
    expect(mockFetch.calls.count()).toBe(50);
  });

  it('reports a failed extension package', async () => {
    mockFetchJsonHandler.and.returnValue(Promise.resolve({
      data: {
        attributes: {
          status: 'failed'
        },
        meta: {
          status_details: {
            errors: [
              {
                title: 'Bad Thing Happened.',
                detail: 'Something really bad happened.'
              }
            ]
          }
        }
      }
    }));

    let errorMessage;

    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, {});
    } catch (error) {
      errorMessage = error.message;
    }

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.stop).toHaveBeenCalled();
    expect(errorMessage).toBe(`Extension package processing failed. ` +
      `${os.EOL}${chalk.green('title: ')} Bad Thing Happened.${os.EOL}` +
      `${chalk.green('detail: ')}Something really bad happened.`);
  });

  it('logs additional detail in verbose mode', async () => {
    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, { verbose: true });
    } catch (error) {}

    expect(mockLogVerboseHeader).toHaveBeenCalledWith('Checking extension package status');
  });
});

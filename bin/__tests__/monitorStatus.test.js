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
const getReactorHeaders = require('../getReactorHeaders');

describe('monitorStatus', () => {
  const envConfig = {
    extensionPackages: 'https://extensionpackages'
  };
  const accessToken = 'fake-token';
  const extensionPackageId = 'EP123';
  let mockFetch;
  let mockFetchJsonHandler;
  let monitorStatus;
  let mockSpinner;
  let consoleSpy;

  const expectedURL = 'https://extensionpackages/EP123';
  const expectedRequestOptions = {
    method: 'GET',
    headers: getReactorHeaders('fake-token')
  };

  beforeEach(async () => {
    mockFetchJsonHandler = jest.fn();
    mockFetch = jest.fn().mockResolvedValue({ json: mockFetchJsonHandler });
    const mockHandleResponseError = jest.fn().mockImplementation(() => {
      throw new Error('mockHandleResponseError');
    });
    jest.mock('../fetchWrapper', () => ({
      fetch: mockFetch
    }));
    mockSpinner = {
      start: jest.fn(),
      stop: jest.fn(),
      succeed: jest.fn()
    };
    jest.mock('ora', () => () => mockSpinner);
    jest.mock('delay', () => jest.fn());
    jest.mock('../handleResponseError', () => mockHandleResponseError);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    jest.resetModules();
    monitorStatus = require('../monitorStatus');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports a successful extension package', async () => {
    mockFetchJsonHandler.mockReturnValueOnce({
      data: {
        attributes: {
          status: 'succeeded'
        }
      }
    });

    await monitorStatus(envConfig, accessToken, extensionPackageId, { uploadTimeout: 50 });
    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('continues monitoring a pending extension package up to the defined upload timeout', async () => {
    mockFetchJsonHandler.mockReturnValue({
      data: {
        attributes: {
          status: 'pending'
        }
      }
    });

    let errorMessage;

    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, { uploadTimeout: 50 });
    } catch (error) {
      errorMessage = error.message;
    }

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).not.toHaveBeenCalled();
    expect(errorMessage).toBe('The extension package failed to be processed within the expected timeframe.');
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });

  it('reports a failed extension package', async () => {
    mockFetchJsonHandler.mockReturnValueOnce({
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
    });

    let errorMessage;

    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, {});
    } catch (error) {
      errorMessage = error.message;
    }

    expect(mockFetch).toHaveBeenCalledWith(expectedURL, expectedRequestOptions);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(errorMessage).toBe(`Extension package processing failed. ` +
      `${os.EOL}${chalk.green('title: ')} Bad Thing Happened.${os.EOL}` +
      `${chalk.green('detail: ')}Something really bad happened.`);
  });

  it('logs additional detail in verbose mode', async () => {
    try {
      await monitorStatus(envConfig, accessToken, extensionPackageId, { verbose: true });
    } catch (error) {}

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Checking extension package status')
    );
  });
});

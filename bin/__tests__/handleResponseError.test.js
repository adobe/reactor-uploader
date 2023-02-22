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
const handleResponseError = require('../handleResponseError');

describe('handleResponseError', () => {
  it('throws an error for Adobe I/O error response', () => {
    let errorMessage;

    try {
      handleResponseError({
        response: {
          message: 'Out of disk space.'
        }
      }, 'Failed to do something.');
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toBe('Failed to do something. Out of disk space.');
  });

  it('throws an error for Reactor error response', () => {
    let errorMessage;

    try {
      handleResponseError({
        response: {
          errors: [
            {
              title: 'Disk Error.',
              detail: 'Out of disk space.'
            }
          ]
        }
      }, 'Failed to do something.');
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toBe(`Failed to do something. ` +
      `${os.EOL}${chalk.green('title: ')} Disk Error.${os.EOL}${chalk.green('detail: ')}Out of disk space.`);
  });

  it('throws an error for unknown type of error response', () => {
    let errorMessage;
    const error = { something: 'unexpected' };

    try {
      handleResponseError(error, 'Failed to do something.');
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toBe(`Failed to do something. ${JSON.stringify(error)}.`);
  });

  it('throws an error for unknown type of error response', () => {
    let errorMessage;
    const error = new Error('unexpected');

    try {
      handleResponseError(error, 'Failed to do something.');
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toBe(`Failed to do something. ${JSON.stringify(error, Object.getOwnPropertyNames(error))}.`);
  });
});

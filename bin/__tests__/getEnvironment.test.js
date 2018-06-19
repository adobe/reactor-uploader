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

describe('getEnvironment', () => {
  let getEnvironment = require('../getEnvironment');
  let mockInquirer;

  beforeEach(() => {
    mockInquirer = {};
    getEnvironment = proxyquire('../getEnvironment', {
      inquirer: mockInquirer
    });
  });

  it('returns environment argument', async () => {
    const result = await getEnvironment({
      env: 'qe'
    });

    expect(result).toBe('qe');
  });

  it('prompts for environment', async () => {
    mockInquirer.prompt = jasmine.createSpy().and.returnValue({ env: 'qe' });
    const result = await getEnvironment({});

    expect(mockInquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'list',
        name: 'env',
        message: jasmine.any(String),
        choices: [
          {
            name: jasmine.any(String),
            value: 'dev'
          },
          {
            name: jasmine.any(String),
            value: 'qe'
          },
          {
            name: jasmine.any(String),
            value: 'integration'
          },
          {
            name: jasmine.any(String),
            value: 'prod'
          }
        ],
        default: 2
      }
    ]);
    expect(result).toBe('qe');
  });
});

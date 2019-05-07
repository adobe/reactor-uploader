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

  it('returns environment argument', () => {
    const result = getEnvironment({
      environment: 'qe'
    });

    expect(result).toBe('qe');
  });

  it('returns production as default', () => {
    const result = getEnvironment({});
    expect(result).toBe('production');
  });
});

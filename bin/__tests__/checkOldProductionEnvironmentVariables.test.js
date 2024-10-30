/***************************************************************************************
 * (c) 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

let checkOldProductionEnvironmentVariables;
let errorMessage;

describe('checkOldProductionEnvironmentVariables', () => {
  it('throws an error when REACTOR_UPLOADER_PRIVATE_KEY_PRODUCTION environment variable is defined', () => {
    checkOldProductionEnvironmentVariables = require('../checkOldProductionEnvironmentVariables');
    process.env.REACTOR_UPLOADER_PRIVATE_KEY_PRODUCTION = 'somekey';

    try {
      checkOldProductionEnvironmentVariables();
    } catch (e) {
      errorMessage = e.message;
    }
    delete process.env.REACTOR_UPLOADER_PRIVATE_KEY_PRODUCTION;
    expect(errorMessage).toMatch(new RegExp('^The environment variables '))
  });

  it('throws an error when REACTOR_UPLOADER_CLIENT_SECRET_PRODUCTION environment variable is defined', () => {
    checkOldProductionEnvironmentVariables = require('../checkOldProductionEnvironmentVariables');
    process.env.REACTOR_UPLOADER_CLIENT_SECRET_PRODUCTION = 'some secret';

    try {
      checkOldProductionEnvironmentVariables();
    } catch (e) {
      errorMessage = e.message;
    }
    delete process.env.REACTOR_UPLOADER_CLIENT_SECRET_PRODUCTION;
    expect(errorMessage).toMatch(new RegExp('^The environment variables '))
  });

  it('throws an error when REACTOR_UPLOADER_PRIVATE_KEY environment variable is defined', () => {
    checkOldProductionEnvironmentVariables = require('../checkOldProductionEnvironmentVariables');
    process.env.REACTOR_UPLOADER_PRIVATE_KEY = 'somekey';

    try {
      checkOldProductionEnvironmentVariables();
    } catch (e) {
      errorMessage = e.message;
    }
    delete process.env.REACTOR_UPLOADER_PRIVATE_KEY;
    expect(errorMessage).toMatch(new RegExp('^The environment variables '))
  });

  it('throws an error when REACTOR_UPLOADER_CLIENT_SECRET environment variable is defined', () => {
    checkOldProductionEnvironmentVariables = require('../checkOldProductionEnvironmentVariables');
    process.env.REACTOR_UPLOADER_CLIENT_SECRET = 'some secret';

    try {
      checkOldProductionEnvironmentVariables();
    } catch (e) {
      errorMessage = e.message;
    }
    delete process.env.REACTOR_UPLOADER_CLIENT_SECRET;
    expect(errorMessage).toMatch(new RegExp('^The environment variables '))
  });
});

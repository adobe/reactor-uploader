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

const path = require('path');
const inquirer = require('inquirer');
const proxyquire = require('proxyquire');

const fileFromSingleZipDir = path.join(__dirname, 'singleZip', 'helloWorld.zip');
const fileFromMultipleZipsDir = path.join(__dirname, 'multipleZips', 'customFileName.zip');

describe('getZipPath', () => {
  let mockInquirer;
  let getZipPath;

  beforeEach(() => {
    mockInquirer = {};
    getZipPath = proxyquire('../getZipPath', {
      inquirer: mockInquirer
    });
  });

  it('returns valid zipPath argument', async () => {
    const result = await getZipPath({
      _: [
        fileFromSingleZipDir
      ]
    });

    expect(result).toBe(fileFromSingleZipDir);
  });

  it('prompts on invalid zipPath argument', async () => {
    spyOn(console, 'error');
    spyOn(mockInquirer, 'prompt').and.returnValue({ zipPath: fileFromSingleZipDir });

    const result = await getZipPath({
      _: [
        fileFromSingleZipDir + 'invalid'
      ]
    });

    expect(console.error.calls.first().args[0]).toStartWith('No file found at');
    expect(mockInquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'input',
        name: 'zipPath',
        message: jasmine.any(String),
        validate: Boolean
      }
    ]);
    expect(result).toBe(fileFromSingleZipDir);
  });

  it('prompts for single zip in directory', async () => {
    spyOn(process, 'cwd').and.callFake(() => {
      return path.join(__dirname, 'singleZip');
    });

    spyOn(mockInquirer, 'prompt').and.returnValue({ correctZip: true });

    const result = await getZipPath({
      _: []
    });

    expect(mockInquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'correctZip',
        message: jasmine.any(String)
      }
    ]);
    expect(result).toBe(fileFromSingleZipDir);
  });

  it('prompts for multiple zips in directory', async () => {
    spyOn(process, 'cwd').and.callFake(() => {
      return path.join(__dirname, 'multipleZips');
    });

    spyOn(mockInquirer, 'prompt').and.returnValue({ zipPath: fileFromMultipleZipsDir })

    const result = await getZipPath({
      _: []
    });

    expect(mockInquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'list',
        name: 'zipPath',
        message: jasmine.any(String),
        choices: [
          'package-hello-world-1.0.0.zip',
          'customFileName.zip',
          new inquirer.Separator(),
          'None of the files listed',
          new inquirer.Separator()
        ]
      }
    ]);
    expect(result).toBe(fileFromMultipleZipsDir);
  });
});

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
const getExtensionPackageManifest = require('../getExtensionPackageManifest');

describe('getExtensionPackageManifest', () => {
  it('returns name for valid extension package zip', async () => {
    const result = await getExtensionPackageManifest(path.join(__dirname, 'singleZip', 'helloWorld.zip'));
    expect(result.name).toBe('hello-world');
  });

  it('throws error for corrupt extension package zip', async () => {
    let errorMessage;

    try {
      await getExtensionPackageManifest(path.join(__dirname, 'badZips', 'corrupt.zip'));
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toStartWith('Error inspecting zip file for extension info.');
  });

  it('throws error for extension package zip without extension.json', async () => {
    let errorMessage;

    try {
      await getExtensionPackageManifest(path.join(__dirname, 'badZips', 'noExtensionJson.zip'));
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toBe('No extension.json found within the extension package zip file.');
  });
});

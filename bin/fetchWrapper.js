/***************************************************************************************
 * (c) 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

const sendFetchRequest = require('node-fetch');
let debugId = 0;

class FetchWrapper {
  constructor() {
    this.isFetchVerbose = false;
  }
  set isFetchVerbose(isVerbose) {
    // don't flip back to false if ever true
    if (!this.isFetchVerbose && Boolean(isVerbose)) {
      this._isFetchVerbose = true;
    }
  }
  get isFetchVerbose() {
    return this._isFetchVerbose;
  }
  async fetch(url, options, ...args) {
    if (this.isFetchVerbose) {
      debugId++;
      let outputReqHeaders = {
        ...options.headers,
        Authorization: 'Bearer [USER_ACCESS_TOKEN]'
      };

      console.log('\nRequest:', {
        debugId,
        uri: url,
        method: options.method || 'GET',
        host: new URL(url).host,
        headers: outputReqHeaders
      });
    }

    const response = await sendFetchRequest.apply(this, [url, options, ...args]);

    if (!this.isFetchVerbose) {
      return response;
    }

    const body = await response.json();
    let headers = {};
    for(const [headerName, headerValue] of response.headers){
      headers[headerName] = headerValue;
    }
    console.log('\nResponse:', {
      debugId,
      headers,
      statusCode: response.status,
      body: JSON.stringify(body)
    });
    return {
      ...response,
      json: () => Promise.resolve(body)
    };
  }
}

module.exports = new FetchWrapper();

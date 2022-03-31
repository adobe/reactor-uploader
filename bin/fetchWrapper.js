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

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
let debugId = 0;
let verbose = false;

module.exports = {
  setVerbose: (v) => {
    verbose = Boolean(v);
  },
  fetch: async (url, options, ...args) => {
    if (verbose) {
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

    const response = await fetch.apply(this, [url, options, ...args]);

    if (!verbose) {
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

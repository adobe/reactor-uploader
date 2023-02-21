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

const getMessageFromReactorError = require('./getMessageFromReactorError');

module.exports = (error, messagePrefix) => {
  let message;

  if (error.response && error.response.message) { // Error from Adobe I/O
    message = error.response.message;
  } else if (error.response && error.response.errors) { // Error from Reactor
    message = getMessageFromReactorError(error.response.errors[0]);
  } else {
    let errorString;
    try { errorString = JSON.stringify(error, Object.getOwnPropertyNames(error)); }
    catch (e) {}
    message = `An unknown error occurred${errorString ? `: ${errorString}` : ''}.`;
  }

  throw new Error(messagePrefix + ' ' + message);
};

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

module.exports = () => {
  if (
    process.env['REACTOR_UPLOADER_PRIVATE_KEY_PRODUCTION'] ||
    process.env['REACTOR_UPLOADER_CLIENT_SECRET_PRODUCTION']
  ) {
    throw new Error(
      'The environment variables REACTOR_UPLOADER_PRIVATE_KEY_PRODUCTION and ' +
        'REACTOR_UPLOADER_CLIENT_SECRET_PRODUCTION were renamed. The new names are ' +
        'REACTOR_UPLOADER_PRIVATE_KEY and REACTOR_UPLOADER_CLIENT_SECRET. Please ' +
        'update all your places where you use the old variable names!'
    );
  }

  if (
    process.env['REACTOR_UPLOADER_PRIVATE_KEY'] ||
    process.env['REACTOR_UPLOADER_CLIENT_SECRET']
  ) {
    throw new Error(
      'The environment variables REACTOR_UPLOADER_PRIVATE_KEY and ' +
        'REACTOR_UPLOADER_CLIENT_SECRET were renamed. The new names are ' +
        'REACTOR_IO_INTEGRATION_PRIVATE_KEY and REACTOR_IO_INTEGRATION_CLIENT_SECRET. Please ' +
        'update all your places where you use the old variable names!'
    );
  }
};

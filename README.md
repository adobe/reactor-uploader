# Launch Extension Uploader Tool

[![Build Status](https://travis-ci.org/Adobe-Marketing-Cloud/reactor-uploader.svg?branch=master)](https://travis-ci.org/Adobe-Marketing-Cloud/reactor-uploader)
[![npm (scoped)](https://img.shields.io/npm/v/@adobe/reactor-uploader.svg?style=flat)](https://www.npmjs.com/package/@adobe/reactor-uploader)

Launch, by Adobe, is a next-generation tag management solution enabling simplified deployment of marketing technologies. For more information regarding Launch, please visit our [product website](http://www.adobe.com/enterprise/cloud-platform/launch.html).

The uploader tool allows extension developers to easily upload their Launch extension to the Launch extension marketplace. It can be used for uploading brand new extension packages or new versions of existing extension packages.

For more information about developing an extension for Launch, please visit our [extension development guide](https://developer.adobelaunch.com/extensions/).

## Usage

Before running the uploader tool, you must first have [Node.js](https://nodejs.org/en/) installed on your computer. Your npm version (npm comes bundled with Node.js) will need to be at least 5.2.0. You can check the installed version by running the following command from a command line:

```
npm -v
```

You will also need to have already created a zip file containing your extension package. The [@adobe/reactor-packager](https://www.npmjs.com/package/@adobe/reactor-packager) tool can be used to create such a zip file.

Finally, you will need to be authorized to upload extensions to Launch. This is done by first creating an integration through Adobe I/O. Please see the [Access Tokens documentation](https://developer.adobelaunch.com/api/guides/access_tokens/) for detailed steps on creating an integration and procuring extension management rights.

Once your zip file is ready to upload and you've been granted extension management rights, you can use the uploader tool in either a question-answer format or by passing information through command line arguments.

### Question-Answer Format

To use the uploader in a question-answer format, run the uploader tool by executing the following command from the command line within the directory containing your extension package zip file:

```
npx @adobe/reactor-uploader
```

The uploader tool will ask for any information necessary to upload the zip file.

### Command Line Arguments

To skip any of the questions the uploader would typically ask, you can pass the respective information as command line arguments. An example is as follows:

```
npx @adobe/reactor-uploader package-myextension-1.0.0.zip --private-key=/Users/jane/launchkeys/reactor_integration_private.key --org-id=01C20D883A7D42080A494212@AdobeOrg --tech-account-id=14A533A72B181CF90A44410D@techacct.adobe.com --api-key=192ce541b1144160941a83vb74e0e74d --client-secret=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The first positional parameter is the path (relative or absolute) to the zip file you wish to upload. In the example, `package-myextension-1.0.0.zip` is passed as an argument for this parameter.

The named parameters are as follows:

##### --private-key (for authentication using an Adobe I/O integration)

The local path (relative or absolute) to the RSA private key. Instructions on how to generate this key can be found in the [Access Tokens documentation](https://developer.adobelaunch.com/api/guides/access_tokens/) and should have been used when creating your integration through the Adobe I/O console.

Optionally, rather than passing the private key path as a command line argument, it can instead be provided by setting an environment variable. The environment variable should be named `REACTOR_IO_INTEGRATION_PRIVATE_KEY`.

##### --org-id (for authentication using an Adobe I/O integration)

Your organization ID. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

##### --tech-account-id (for authentication using an Adobe I/O integration)

Your technical account ID. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

##### --api-key (for authentication using an Adobe I/O integration)

Your API key. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

##### --client-secret (for authentication using an Adobe I/O integration)

Your client secret. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

Optionally, rather than passing the client secret as a command line argument, it can instead be provided by setting an environment variable. The environment variable should be named `REACTOR_IO_INTEGRATION_CLIENT_SECRET`.

##### --environment (for Adobe internal use only)

The environment to which the extension package should be uploaded. Valid options are `development`, `qe`, `integration`. Users outside of Adobe don't need to use this flag.

Private key path can also be provided by setting an environment variable. The environment variable should be named one of the following, depending on which Launch environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_PRIVATE_KEY_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_PRIVATE_KEY_QE`
* `REACTOR_IO_INTEGRATION_PRIVATE_KEY_INTEGRATION`

Client secret can also be provided by setting an environment variable. The environment variable should be named one of the following, depending on which Launch environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_CLIENT_SECRET_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_CLIENT_SECRET_QE`
* `REACTOR_IO_INTEGRATION_CLIENT_SECRET_INTEGRATION`

##### --verbose

Logs additional information useful for debugging.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

To get started:

1. Install [node.js](https://nodejs.org/).
3. Clone the repository.
4. After navigating into the project directory, install project dependencies by running `npm install`.

To manually test your changes, first run the following command from the uploader tool directory:

```
npm link
```

Then, in a directory where you would like to use the uploader tool, run the following command:

```
npx @adobe/reactor-uploader
```

Npx will execute the uploader tool using your locally linked code rather than the code published on the public npm repository.

### Scripts

To run tests a single time, run the following command:

`npm run test`

To run tests continually while developing, run the following command:

`npm run test:watch`

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.

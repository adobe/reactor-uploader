# Adobe Experience Platform Tags Extension Uploader Tool

[![Build Status](https://travis-ci.com/adobe/reactor-uploader.svg?branch=master)](https://travis-ci.com/adobe/reactor-uploader)
[![npm (scoped)](https://img.shields.io/npm/v/@adobe/reactor-uploader.svg?style=flat)](https://www.npmjs.com/package/@adobe/reactor-uploader)

Adobe Experience Platform Tags is a next-generation tag management solution enabling simplified deployment of marketing technologies. For more information regarding Tags, please visit our [product website](http://www.adobe.com/enterprise/cloud-platform/launch.html).

The uploader tool allows extension developers to easily upload their Platform Tags extension to the extension marketplace. It can be used for uploading brand new extension packages or new versions of existing extension packages.

For more information about developing an extension for Tags, please visit our [extension development guide](https://experienceleague.adobe.com/docs/experience-platform/tags/extension-dev/overview.html?lang=en).

## Usage

Before running the uploader tool, you must first have [Node.js](https://nodejs.org/en/) installed on your computer.

You will also need to have already created a zip file containing your extension package. The [@adobe/reactor-packager](https://www.npmjs.com/package/@adobe/reactor-packager) tool can be used to create such a zip file.

Finally, you will need to be authorized to upload extensions to Tags. This is done by first creating an integration through Adobe I/O. Please see the [Access Tokens documentation](https://experienceleague.adobe.com/docs/experience-platform/landing/platform-apis/api-authentication.html) for detailed steps on creating an integration and procuring extension management rights.

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
npx @adobe/reactor-uploader package-myextension-1.0.0.zip --auth.client-id=abcdefghijklmnopqrstuvwxyz12345 --auth.client-secret=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The first positional parameter is the path (relative or absolute) to the zip file you wish to upload. In the example, `package-myextension-1.0.0.zip` is passed as an argument for this parameter.

The named parameters are as follows:

##### --auth.client-id (for authentication using an Adobe I/O integration)

Your Client ID. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

Client ID can also be provided by setting an environment variable. The environment variable should be named one of the following, depending on which Experience Platform Tags environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_CLIENT_ID_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_CLIENT_ID_STAGE`
* `REACTOR_IO_INTEGRATION_CLIENT_ID` (this is the default, and is used for production environment)

##### --auth.client-secret (for authentication using an Adobe I/O integration)

Your Client Secret. You can find this on the overview screen for the integration you have created within the [Adobe I/O console](https://console.adobe.io).

Client Secret can also be provided by setting an environment variable. The environment variable should be named one of the following, depending on which Experience Platform Tags environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_CLIENT_SECRET_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_CLIENT_SECRET_STAGE`
* `REACTOR_IO_INTEGRATION_CLIENT_SECRET` (this is the default, and is used for production environment)

##### --environment (for Adobe internal use only)

The environment to which the extension package should be uploaded. Valid options are `development`, `stage`, `production`. Users outside of Adobe don't need to use this flag.

##### -- auth.scope (for authentication using an Adobe I/O integration)

The scopes to bind to the Access Token that is returned. Sane defaults are provided on your behalf within this repository, but you may override them if it is necessary.

##### --auth.scheme (for authentication using an Adobe I/O integration)

The type of authentication method when calling Adobe IO. This defaults to `oauth-server-to-server` and is used in conjunction with your Client ID & Client Secret.

##### --auth.access-token

Bypass the call to gain an Access Token if you already have the ability to supply it to the command line or through an environment variable. This is useful if you are running this tool in a CI/CD environment.
We highly encourage only using an environment variable within a CI/CD environment, as it is more secure than passing it through the command line.

The environment variable should be named one of the following, depending on which Experience Platform Tags environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN_STAGE`
* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN` (this is the default, and is used for production environment)

Bypass the call to gain an Access Token if you already have the ability to supply it to the command line or through an environment variable. This is useful if you are running this tool in a CI/CD environment.
We highly encourage only using an environment variable within a CI/CD environment, as it is more secure than passing it through the command line.

The environment variable should be named one of the following, depending on which Experience Platform Tags environment will be receiving the extension package:

* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN_DEVELOPMENT`
* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN_STAGE`
* `REACTOR_IO_INTEGRATION_ACCESS_TOKEN` (this is the default, and is used for production environment)

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

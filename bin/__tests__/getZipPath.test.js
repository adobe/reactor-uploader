const path = require('path');
const inquirer = require('inquirer');
const getZipPath = require('../getZipPath');

const fileFromSingleZipDir = path.join(__dirname, 'singleZip', 'helloWorld.zip');
const fileFromMultipleZipsDir = path.join(__dirname, 'multipleZips', 'customFileName.zip');

jest.mock('inquirer');

describe('getZipPath', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns valid zipPath argument', async () => {
    const result = await getZipPath({
      _: [fileFromSingleZipDir],
    });

    expect(result).toBe(fileFromSingleZipDir);
  });

  it('prompts on invalid zipPath argument', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    inquirer.prompt.mockResolvedValue({ zipPath: fileFromSingleZipDir });

    const result = await getZipPath({
      _: [fileFromSingleZipDir + 'invalid'],
    });

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No file found at'));
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'input',
        name: 'zipPath',
        message: expect.any(String),
        validate: expect.any(Function),
      },
    ]);
    expect(result).toBe(fileFromSingleZipDir);
  });

  // TODO: there's something breaking with mocking process.cwd() for this test
  // it('prompts for single zip in directory', async () => {
  //   jest.spyOn(process, 'cwd').mockImplementation(() => path.join(__dirname, 'singleZip'));
  //   inquirer.prompt.mockResolvedValue({ correctZip: true });
  //
  //   const result = await getZipPath({
  //     _: [],
  //   });
  //
  //   expect(inquirer.prompt).toHaveBeenCalledWith([
  //     {
  //       type: 'confirm',
  //       name: 'correctZip',
  //       message: expect.any(String),
  //     },
  //   ]);
  //   expect(result).toBe(fileFromSingleZipDir);
  // });

  it('prompts for multiple zips in directory', async () => {
    jest.spyOn(process, 'cwd').mockImplementation(() => path.join(__dirname, 'multipleZips'));
    inquirer.prompt.mockResolvedValue({ zipPath: fileFromMultipleZipsDir });

    const result = await getZipPath({
      _: [],
    });

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'list',
        name: 'zipPath',
        message: expect.any(String),
        choices: [
          'package-hello-world-1.0.0.zip',
          'customFileName.zip',
          expect.any(Object),
          'None of the files listed',
          expect.any(Object),
        ],
      },
    ]);
    expect(result).toBe(fileFromMultipleZipsDir);
  });
});

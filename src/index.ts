#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as template from './utils/template';
import * as shell from 'shelljs';
import * as replace from 'replace-in-file';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What template would you like to use?',
    choices: CHOICES,
  },
  {
    name: 'name',
    type: 'input',
    message: 'Please input a new project name:',
  },
  {
    name: 'namespace',
    type: 'input',
    message: 'Please input a new project namespace:',
    default() {
      return '';
    },
  },
];

export interface CliOptions {
  projectName: string;
  templateName: string;
  templatePath: string;
  tartgetPath: string;
}

const CURR_DIR = process.cwd();

let isUpdate: Boolean = false;

let options: CliOptions;

inquirer.prompt(QUESTIONS).then((answers) => {
  // @ts-ignore
  const projectChoice = answers['template'];
  // @ts-ignore
  const projectNamespace = answers['namespace'];
  // @ts-ignore
  const projectName = answers['name'];
  //@ts-ignore
  const templatePath = path.join(__dirname, 'templates', projectChoice);
  //@ts-ignore
  const tartgetPath = path.join(CURR_DIR, projectName);

  options = {
    //@ts-ignore
    projectName,
    //@ts-ignore
    templateName: projectChoice,
    templatePath,
    tartgetPath,
  };

  createProject(tartgetPath);

  //@ts-ignore
  createDirectoryContents(templatePath, projectName);

  replaceProjectName(tartgetPath, projectName, projectNamespace);

  postProcess(options);
});

function replaceProjectName(
  projectPath: string,
  projectName: string,
  projectNameSpace: string
) {
  const packageName =
    projectNameSpace.length > 0
      ? `${projectNameSpace}/${projectName}`
      : projectName;
  const options = {
    files: [
      path.join(projectPath, 'package.json'),
      path.join(projectPath, 'tsconfig.json'),
    ],
    from: /"name": "ts-project"/g,
    to: `"name":"${packageName}"`,
  };
  const options2 = {
    files: [
      path.join(projectPath, 'package.json'),
      path.join(projectPath, 'webpack.config.ts'),
    ],
    from: /ts-project/g,
    to: projectName,
  };
  const options3 = {
    files: path.join(projectPath, 'tsconfig.json'),

    from: /ts-project/g,
    to: packageName,
  };
  const options4 = {
    files: path.join(projectPath, 'pubspec.yaml'),
    from: /ts_project/g,
    to: packageName.replace(/-/g, '_'),
  };
  const optionsTo = [options, options2, options3, options4];
  optionsTo.forEach((options) => {
    try {
      const results = replace.replaceInFileSync(options);
      console.log('Replacement results:', results);
    } catch (error) {
      console.error('Error occurred:', error);
    }
  });
}

function createProject(projectPath: string) {
  if (fs.existsSync(projectPath)) {
    console.log(chalk.yellowBright('Updating the project..'));
    isUpdate = true;
  } else if (!fs.existsSync(projectPath)) {
    console.log(chalk.yellowBright('Creating the project..'));
    fs.mkdirSync(projectPath, { recursive: true });
  }
}

const SKIP_FILES = ['node_modules', '.template.json'];

function createDirectoryContents(templatePath: string, projectName: string) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath);
  // loop each file/folder
  filesToCreate.forEach((file) => {
    const origFilePath = path.join(templatePath, file);

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return;

    if (stats.isFile()) {
      // read file content and transform it using template engine
      let contents = fs.readFileSync(origFilePath, 'utf8');
      contents = template.render(contents, { projectName });
      // write file to destination folder
      const writePath = path.join(CURR_DIR, projectName, file);
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      if (!fs.existsSync(path.join(CURR_DIR, projectName, file))) {
        // create folder in destination folder
        fs.mkdirSync(path.join(CURR_DIR, projectName, file));
      }
      // copy files/folder inside current folder recursively
      createDirectoryContents(
        path.join(templatePath, file),
        path.join(projectName, file)
      );
    }
  });
}

function postProcess(options: CliOptions) {
  const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
  if (isNode) {
    shell.cd(options.tartgetPath);
    const result = shell.exec('yarn install');
    if (result.code !== 0) {
      console.log(chalk.redBright('Failed'));
      return false;
    }
  }

  if (isUpdate) {
    console.log(chalk.greenBright('Project successfully updated'));
  } else {
    console.log(chalk.greenBright('Project successfully created'));
  }

  return true;
}

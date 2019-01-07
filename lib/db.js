// toy db
// better to set it up as a separate server so that if server instance crash, data not corrupted
const fs = require('fs');
const util = require('util');

const [readFile, writeFile] = [
    fs.readFile,
    fs.writeFile
].map(x => util.promisify(x));

const config = require('./config');
const {
    isObject,
    isArray,
    jsonStringify,
    jsonParse
} = require('../utils/functions');

const jsonStringifySpace2 = jsonStringify()(2);

const baseDir = process.cwd();

let scenarios_arr;
let tasks_obj;

const scenariosFilePath = `${baseDir}/${config.scenariosFilePath}`;
const tasksFilePath = `${baseDir}/${config.tasksFilePath}`


const writeToStorage = (scenarios_arr) => (tasks_obj) => {
    writeFile(scenariosFilePath, jsonStringifySpace2(scenarios_arr), 'utf8')
    writeFile(tasksFilePath, jsonStringifySpace2(tasks_obj), 'utf8')
}

const initPromise = () => {
    return Promise.all([
        readFile(scenariosFilePath, 'utf8'),
        readFile(tasksFilePath, 'utf8')
    ])
    .then(([scenarios_str, tasks_str]) => {
        scenarios_arr = jsonParse()(scenarios_str);
        tasks_obj = jsonParse()(tasks_str);

        // write to storage every X ms
        setInterval(() => writeToStorage(scenarios_arr)(tasks_obj), config.writeToStoreInterval);
        // / write to storage every X ms

        return;
    })
    .catch(err => `Unable to start server with err: ${err}`);
};

const getTasks = () => tasks_obj;
const getScenarios = () => scenarios_arr;

setTasks = (newTasks_obj) => tasks_obj = newTasks_obj;
setScenarios = (newScenarios_arr) => scenarios_arr = newScenarios_arr 

module.exports = {
    initPromise,
    getTasks,
    getScenarios,
    setTasks,
    setScenarios
}
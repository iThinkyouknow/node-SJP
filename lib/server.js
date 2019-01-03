// nodejs API
const http = require('http');
const https = require('https');
const url = require('url');
const util = require('util');
const fs = require('fs');
const path = require('path');
const debug = util.debuglog('server');
const StringDecoder = require('string_decoder').StringDecoder;

// other files
const config = require('./config');
const {
    noOp,
    isNumber,
    isArray,
    isString,
    isObject,
    isBoolean,
    isFunction,
    get,
    jsonStringify,
    jsonParse,
    getJsonFromBuffer
} = require('../utils/functions');

// functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const { log } = console;

// todo: put into constants
const contentTypes = {
    json: 'application/json',
    map: 'application/json',
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    jpg: 'image/jpeg',
    png: 'image/png',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
    default: 'text/plain'
};

const allowedTemplates = {
    facebook: { text: "text", image: "image", video: "video", audio: "audio", button: "button", sticker: "sticker" },
    line: { text: "text", image: "image", video: "video", audio: "audio", sticker: "sticker" }
};

// data handlers
const getAllScenariosWTasks_array = ([scenarios_str, tasks_str]) => {
    const scenarios = jsonParse()(scenarios_str);
    const tasks = jsonParse()(tasks_str);
    return scenarios
        .map(scenario => {
            scenario.tasks = tasks[scenario.id]
            return scenario;
        });

};


const readScenariosTasksPromise = () => {
    return Promise
        .all([
            readFile(`${__dirname}/../data/scenarios.json`, 'utf8'),
            readFile(`${__dirname}/../data/tasks.json`, 'utf8'),
        ])
        .then(getAllScenariosWTasks_array);
};
///data handlers

// general abstractions
const outputError = err => console.error(`${Date.now()} Err: ${err}`);

const sendJsonAsResponse = mut_response => obj => {
    const json_str = jsonStringify()()(obj);

    if (isString(json_str)) {
        mut_response.end(json_str);
    } else {
        reqErrHandler(mut_response)()("Obj did not result in valid json string: ${new_allScenariosWTasks_Obj}")
    }
}



//setheaders utils
const setXPowByHeader = mut_res => mut_res.setHeader('X-Powered-By', 'Social-JP-Assessment');

const setContentType = type => mut_res => mut_res.setHeader('Content-Type', (contentTypes[type] || contentTypes['default']));

const setStandardJsonHeaders = mut_res => [
    setXPowByHeader,
    setContentType('json')
].forEach(setPropsTo => setPropsTo(mut_res));




const reqErrHandler = mut_response => () => err => {
    outputError(err);

    mut_response.statusCode = 500;
    mut_response.setHeader('Content-Type', 'text/html');
    setXPowByHeader(mut_response);

    mut_response.end('<html><body><h1>Something went wrong!</h1></body></html>');
};

const reqInputErrHandler = mut_response => () => error => {
    outputError(error);

    mut_response.statusCode = 400;
    setStandardJsonHeaders(mut_response);

    mut_response.end(jsonStringify()()({
        error
    }));
};

const sendReactApp = mut_response => mut_body => () => {
    mut_response.on('error', outputError);

    let bodyString = Buffer.concat(mut_body).toString();
    debug(bodyString);
    mut_response.setHeader('Content-Type', 'text/html');
    setXPowByHeader(mut_response);
    fs.createReadStream(`${__dirname}/../frontend/build/index.html`).pipe(mut_response);
};

const sendStaticAssets = pathname => mut_response => mut_body => () => {
    const type = pathname.split('.').pop();
    [
        setXPowByHeader,
        setContentType(type)
    ].forEach(setPropsTo => setPropsTo(mut_response));
    debug(`pathname: ${pathname}`);

    // todo:handle error
    fs.createReadStream(`${__dirname}/../frontend/build${pathname}`).pipe(mut_response);
};

const getArrIntoObjWTasksPerScenario = arr => {
    return arr.reduce((acc, { id, name, tasks }) => {
        acc[id] = {
            name,
            tasks
        }
        return acc;
    }, {});
}

const sendAllScenarios = mut_response => mut_body => () => {
    setStandardJsonHeaders(mut_response);

    readScenariosTasksPromise()
        .then(allScenariosWTasks_array => {
            debug(JSON.stringify(allScenariosWTasks_array, null, 2));
            const scenariosWTasks = getArrIntoObjWTasksPerScenario(allScenariosWTasks_array);
            sendJsonAsResponse(mut_response)(scenariosWTasks);
        }).catch((err) => {
            console.error(err);
            reqErrHandler(mut_response)()("Obj did not result in valid json string: ${scenariosWTasksJson}")
        });
};

const orderMultiplier = {
    asc: 1,
    desc: -1
};

const sortByProp = (prop) => (orderMultiplier) => (a, b) => {
    if (a[prop] < b[prop]) {
        return -1 * orderMultiplier;
    } else if (a[prop] > b[prop]) {
        return 1 * orderMultiplier;
    } else {
        return 0;
    }
};

const sendScenariosSorted = ({ sortType, orderField }) => mut_response => mut_body => () => {
    if (sortType !== 'asc' && sortType !== 'desc') {
        reqErrHandler(mut_response)()('sortType must be \"asc\" or \"desc\"'); // todo better handling
    }
    setStandardJsonHeaders(mut_response);

    readScenariosTasksPromise()
        .then(allScenariosWTasks_array => {
            const new_allScenariosWTasks_array = [...allScenariosWTasks_array];
            const sortFn = sortByProp(orderField)(orderMultiplier[sortType]);
            const sortedAllScenariosWTasks_array = (orderField === 'name')
                ? new_allScenariosWTasks_array
                    .sort(sortFn)
                : new_allScenariosWTasks_array.map(scenario => {
                    scenario.tasks.sort(sortFn);
                    return scenario;
                });

            const newAllScenariosWTasks_Obj = getArrIntoObjWTasksPerScenario(sortedAllScenariosWTasks_array);
            sendJsonAsResponse(mut_response)(newAllScenariosWTasks_Obj);
        }).catch((err) => {
            console.error(err);
            reqErrHandler(mut_response)()("Obj did not result in valid json string: ${new_allScenariosWTasks_Obj}")
        });

};
const isNotUndefined = val => val !== undefined;
const sendScenariosSearch = ({ filterValue }) => mut_response => mut_body => () => {
    if (!isString(filterValue)) {
        reqErrHandler(mut_response)()(`filterValue must be type string and not ${filterValue}`); // todo better handling
    }
    setStandardJsonHeaders(mut_response);

    readScenariosTasksPromise()
        .then(allScenariosWTasks_array => {
            // assume filterValue = 'Facebook-or-Line'
            // assume filterValue = 'Facebook-and-text-or-line'
            // assume filterValue = 'Facebook-or-Line-or-en_US'
            // assume && precedes || 
            const conditionsAndOperators = filterValue.split('-');
            const conditions = conditionsAndOperators.filter((_, i) => i % 2 === 0);
            const operators = conditionsAndOperators.filter((_, i) => i % 2 === 1);

            const validScenarios_arr = allScenariosWTasks_array
                .map((scenario) => {
                    const { tasks } = scenario;
                    const tasks_filtered = tasks.filter(task_obj => {
                        const found_arr = conditions
                            .map(condition => {
                                return Object.values(task_obj)
                                    .find(text => text === condition)
                            });

                        log('found_arr');
                        log(found_arr);

                        if (operators[0] === 'and' && operators[1] === 'and') {
                            return (conditions.length === found_arr.filter(isNotUndefined).length)
                        } else if (operators[0] === 'or' && operators[1] === 'or') {
                            return (found_arr.filter(isNotUndefined).length > 0);
                        } else if (operators[0] === 'and' && operators[1] === 'or') {
                            return (isNotUndefined(found_arr[0]) && isNotUndefined(found_arr[1]) || isNotUndefined(found_arr[2]));
                        } else if (operators[0] === 'or' && operators[1] === 'and') {
                            return (isNotUndefined(found_arr[0]) || isNotUndefined(found_arr[1]) && isNotUndefined(found_arr[2]));
                        } else if (operators[0] === 'or') {
                            return (found_arr.filter(isNotUndefined).length > 0);
                        } else if (operators[0] === 'and') {
                            return (conditions.length === found_arr.filter(isNotUndefined).length);
                        } else {
                            return false;
                        }

                    });

                    return {
                        ...scenario,
                        tasks: tasks_filtered
                    }
                })
                .filter(({ tasks }) => tasks.length > 0);

            const validScenarios = getArrIntoObjWTasksPerScenario(validScenarios_arr);

            sendJsonAsResponse(mut_response)(validScenarios);

        })
        .catch((err) => {
            console.error(err);
            reqErrHandler(mut_response)()("Obj did not result in valid json string: ${new_allScenariosWTasks_Obj}")
        });
};

const isCarouselNotLast = tasks => {
    const carouselIndex = tasks.findIndex(({ template }) => template === 'carousel');
    return (carouselIndex !== -1 && (carouselIndex !== bodyJson.tasks.length - 1))
};

const isTemplateNotAllowedForPlatform = ({ platform = '', template = '' }) => allowedTemplates[platform.toLowerCase()][template.toLowerCase()] === undefined;

const getTemplateNotAllowedForPlatformForAllTasks = (tasks) => {
    const invalidTasks = tasks.filter(isTemplateNotAllowedForPlatform);
    const invalidTasksErrMsg = invalidTasks.map(({ platform, template }) => `The "template": "${template}" is not allowed for "platform": "${platform}"`).join('\n');
    return invalidTasksErrMsg;
};

const templatePropertyCount = init_count => property => arr => {
    return arr.reduce((count, { template = '' }) => { // todo multiple stickers within existing tasks
        return (template.toLowerCase() === property) ? count + 1 : count
    }, init_count)
};

const getStickersCount = templatePropertyCount(0)('sticker');

const getScenarioAlreadyExistsErrMsg = scenarioTasks_arr => bodyWithID => (scenarioTasks_arr.find(({ id }) => id === bodyWithID.id) !== undefined)
    ? `scenario with same name already exists! Please use a different name (case insensitive)`
    : '';

const getScenarioDoesNotExistErrMsg = scenarioID => scenarioToMod => (scenarioToMod === undefined)
    ? `scenario: ${scenarioID} does not exist. You can try adding a new scenario`
    : '';

const getMoreThan1StickerErrMsg = bodyJson => scenarioToMod => {
    const bodyJsonTasks = get(bodyJson, 'tasks', []);
    const scenarioToModTasks = get(scenarioToMod, 'tasks', [])
    const bodyJsonStickersCount = getStickersCount(bodyJsonTasks);
    return (bodyJsonStickersCount > 1 || (getStickersCount(scenarioToModTasks) > 0 && bodyJsonStickersCount > 0))
        ? `You cannot have more than 1 task of template: "sticker"`
        : ''
}

const getCarouselNotLastErrMsg = ({ tasks = [] }) => isCarouselNotLast(tasks)
    ? `Template: "carousel" must be the last task`
    : '';

const unableToAddTaskCarouselAlreadyLast = scenarioToMod => {
    const scenarioToModTasks = get(scenarioToMod, 'tasks', []);
    const lastTask = scenarioToModTasks[scenarioToModTasks.length - 1];
    return get(lastTask, 'template') === 'carousel'
        ? `Unable to add more tasks to this scenario. Try a different scenario`
        : ''
};

const getErrMsg_arr = msg_arr => msg_arr.filter(msg => isString(msg));

const addScenariosAndReturn = mut_response => mut_body => () => {
    /**
     * validations:
     * no same name as existing √
     * no more than 1 sticker √
     * nothing after carousel √
     * platform must match with template √
     * **/

    /** bodyJson:
    {
           name: "Scenario X",
           tasks: [
               {
                   
                   "template": "audio",
                   "platform": "facebook",
                   "lang": "en_US",
                   
               }
           ]
       }
    */

    const bodyJson = getJsonFromBuffer(mut_body);

    debug(bodyJson);
    const reqInputErrHandlerWErrMissing = reqInputErrHandler(mut_response)();

    readScenariosTasksPromise().then((scenarioTasks_arr) => {
        /**{ id: 'scenario_5',
            name: 'Scenario 5',
            tasks: [ [Object], [Object] ] }, */

        const bodyWithID = {
            ...bodyJson,
            id: get(bodyJson, 'name', '', 'string').trim().replace(/ +/, ' ').replace(/ +/, '_').toLowerCase()
        }
        debug(scenarioTasks_arr);
        debug(bodyWithID.id);

        const err_array = getErrMsg_arr([
            getScenarioAlreadyExistsErrMsg(scenarioTasks_arr)(bodyWithID),
            getTemplateNotAllowedForPlatformForAllTasks(bodyWithID.tasks),
            getMoreThan1StickerErrMsg(bodyWithID)({}),
            getCarouselNotLastErrMsg(bodyWithID)
        ]);

        if (err_array.length > 0) {
            reqInputErrHandlerWErrMissing(err_array.join('\n'));
            return;
        } else if (isObject(bodyWithID)) { //valid
            const newScenarios = [...scenarioTasks_arr, bodyWithID];
            debug('newScenarios');
            debug(jsonStringify()(2)(newScenarios));

            const scenarios = newScenarios.map(({ id, name }) => ({ id, name }));
            const tasks = newScenarios.reduce((acc, { id, tasks }) => {
                acc[id] = tasks.map((task, i) => ({
                    scenario: id,
                    ...task,
                    position: i + 1
                }));
                return acc;
            }, {});

            debug(scenarios);
            debug(tasks);

            const [scenariosJSON_str, tasksJSON_str] = [scenarios, tasks].map(value => jsonStringify()(2)(value));

            Promise.all([
                writeFile(`${__dirname}/../data/scenarios.json`, scenariosJSON_str, 'utf8'),
                writeFile(`${__dirname}/../data/tasks.json`, tasksJSON_str, 'utf8'),
            ])
                .then(() => {
                    const scenariosWTasks_obj = getArrIntoObjWTasksPerScenario(newScenarios);
                    sendJsonAsResponse(mut_response)(scenariosWTasks_obj);
                })
                .catch(err => reqInputErrHandlerWErrMissing(err));
        }
    })
        .catch(reqInputErrHandlerWErrMissing);

};

const addTaskToScenarioAndReturn = mut_response => mut_body => () => {
    /**validations
     * no id
     * no more than 1 sticker
     * nothing after carousel
     */
    const bodyJson = getJsonFromBuffer(mut_body);
    debug(bodyJson);

    const reqInputErrHandlerWErrMissing = reqInputErrHandler(mut_response)();

    readScenariosTasksPromise().then((scenarioTasks_arr) => {

        const scenarioToModIndex = scenarioTasks_arr.findIndex(({ id }) => id === bodyJson.scenario);
        const scenarioToMod = scenarioTasks_arr[scenarioToModIndex];

        debug('getStickersCount(scenarioToMod.tasks)');
        debug(getStickersCount(scenarioToMod.tasks));

        //validations
        const err_array = getErrMsg_arr([
            getScenarioDoesNotExistErrMsg(scenarioToMod)(bodyJson.scenario),
            getTemplateNotAllowedForPlatformForAllTasks(bodyJson.tasks),
            getMoreThan1StickerErrMsg(bodyJson)(scenarioToMod),
            getCarouselNotLastErrMsg(bodyJson),
            unableToAddTaskCarouselAlreadyLast(scenarioToMod)
        ]);


        if (err_array.length > 0) {
            reqInputErrHandlerWErrMissing(err_array.join('\n'));
            return;
        } else if (isObject(bodyJson)) { // valid

            const processedNewTasks = bodyJson.tasks.map((task, index) => {
                return {
                    scenario: bodyJson.scenario,
                    ...task,
                    position: scenarioToMod.tasks.length + index + 1
                }
            });

            const scenarioWNewTask = {
                ...scenarioToMod,
                tasks: [...scenarioToMod.tasks, ...processedNewTasks]
            };

            const mut_allScenariosWNewTask = scenarioTasks_arr.map((scenario, i) => {
                return (i === scenarioToModIndex)
                    ? scenarioWNewTask
                    : scenario;
            });

            const tasks = mut_allScenariosWNewTask.reduce((acc, { id, tasks }) => {
                acc[id] = tasks;

                return acc;
            }, {});

            debug(tasks);

            const tasksJSON_str = jsonStringify()(2)(tasks);

            writeFile(`${__dirname}/../data/tasks.json`, tasksJSON_str, 'utf8')
                .then(() => {
                    const scenariosWTasks_obj = getArrIntoObjWTasksPerScenario(mut_allScenariosWNewTask);
                    sendJsonAsResponse(mut_response)(scenariosWTasks_obj);
                })
                .catch(err => reqInputErrHandlerWErrMissing(err));
        }
    }).catch(reqInputErrHandlerWErrMissing);
};

const handlers = {
    '/': sendReactApp,
    'static': sendStaticAssets,
    '/manifest.json': sendStaticAssets,
    '/favicon.ico': sendStaticAssets,
    '/api/scenarios': sendAllScenarios,
    '/api/scenarios/sortBy': sendScenariosSorted,
    '/api/scenarios/searchBy': sendScenariosSearch,
    '/api/scenarios/add': addScenariosAndReturn,
    '/api/tasks/add': addTaskToScenarioAndReturn
};


/**
 * 
 * GET ALL
 * GET AND OR (up to 3) filterFields=dateCreated&filterFields=name
 * GET Sortby:: orderField=release.name&sortType=asc
 */
const getHandler = pathname => method => queryObj => {
    console.log(queryObj);
    console.log(get(queryObj, 'orderField'));
    if (/\/static\/|\/manifest\.json|\/favicon.ico/.test(pathname)) {
        return handlers['static'](pathname);
    } else if (method === 'GET' && pathname === '/api/scenarios' && isString(get(queryObj, 'filterValue'))) {
        return handlers['/api/scenarios/searchBy'](queryObj);
    } else if (method === 'GET' && pathname === '/api/scenarios' && isString(get(queryObj, 'orderField'))) {
        return handlers['/api/scenarios/sortBy'](queryObj);
    } else if (method === 'GET' && pathname === '/api/scenarios') {
        return handlers[pathname];
    } else if (method === 'POST' && pathname === '/api/scenarios/add') {
        return handlers['/api/scenarios/add'];
    } else if (method === 'POST' && pathname === '/api/tasks/add') {
        return handlers['/api/tasks/add'];
    } else {
        return handlers[pathname] || reqErrHandler;
    }
};


const unifiedServer = (req, res) => {
    const {
        method, //uppercase
        url: URL,
        headers,
    } = req;

    const parsedURL = url.parse(URL, true);
    debug(JSON.stringify(parsedURL, null, 2));

    const { query: queryObj, pathname } = parsedURL;
    // todo: handle favicon and manifest under static
    const handler = getHandler(pathname)(method)(queryObj);

    const [reqErrHandlerWRes, handlerWRes] = [
        reqErrHandler,
        handler
    ].map(fn => fn(res));

    let mut_body = [];

    req.on('error', reqErrHandlerWRes())
        .on('data', chunk => mut_body.push(chunk))
        .on('end', handlerWRes(mut_body));
};

// http
const httpServer = http.createServer(unifiedServer);

//https
const httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../keys/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/../keys/cert.pem')),
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

const init = () => {
    httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `The server is listening on port ${config.httpPort} in ${config.envName} mode now `);
    });

    httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `The server is listening on port ${config.httpsPort} in ${config.envName} mode now `);
    });
}

module.exports = {
    init
};
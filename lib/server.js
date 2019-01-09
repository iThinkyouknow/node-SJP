// nodejs API
const http = require('http');
const https = require('https');
const url = require('url');
const util = require('util');
const fs = require('fs');
const path = require('path');

// other files
const config = require('./config');
const db = require('./db');

const {
    SocialJPAssessment,
    XPoweredBy,
    ContentType,
    filePaths,
    contentTypes,
    allowedTemplates,
    errMessages,
    sortTypes,
    orderFields,
    filterOperators,
    queryObjParams,
    serverListeningOnPort
} = require('./constants.json');

const {
    noOp,
    isNumber,
    isArray,
    isString,
    isObject,
    isBoolean,
    isFunction,
    isNotUndefined,
    get,
    jsonStringify,
    jsonParse,
    getJsonFromBuffer,
    compose,
    getLastFieldFromStringSegments
} = require('../utils/functions');

const baseDir = process.cwd();

const { log } = console;


const getAllScenariosWTasks_array = ([scenarios_arr, tasks_obj]) => {
    return scenarios_arr
        .map(scenario => {
            scenario.tasks = tasks_obj[scenario.id]
            return scenario;
        });

};

const readScenariosPromise = () => {
    return Promise
        .all([
            db.getScenarios(),
            db.getTasks(),
        ])
};

const readScenariosTasksAndTransIntoArrayPromise = () => {
    return readScenariosPromise()
        .then(getAllScenariosWTasks_array);
};


// general abstractions
const outputError = err => console.error(`${Date.now()} Err: ${err}`);

const sendJsonAsResponse = mut_response => obj => {
    const json_str = jsonStringify()()(obj);
    log(json_str);

    if (isString(json_str)) {
        mut_response.end(json_str);
    } else {
        reqErrHandler(mut_response)()(`${errMessages.objNotValidJsonString} ${new_allScenariosWTasks_Obj}`)
    }
}

//setheaders utils
const setXPowByHeader = mut_res => mut_res.setHeader(XPoweredBy, SocialJPAssessment);

const setContentType = type => mut_res => mut_res.setHeader(ContentType, (contentTypes[type] || contentTypes['default']));

const setStandardJsonHeaders = mut_res => [
    setXPowByHeader,
    setContentType('json')
].forEach(setPropsTo => setPropsTo(mut_res));


const reqErrHandler = mut_response => () => err => {
    outputError(err);

    mut_response.statusCode = 500;
    mut_response.setHeader(ContentType, contentTypes.html);
    setXPowByHeader( );

    mut_response.end(errMessages.errHtml);
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
    mut_response.setHeader(ContentType, contentTypes.html);
    setXPowByHeader(mut_response);
    log(`${baseDir}${filePaths.index_html}`);
    fs.createReadStream(`${baseDir}${filePaths.index_html}`).pipe(mut_response);
};

const sendStaticAssets = pathname => mut_response => mut_body => () => {
    const type = pathname.split('.').pop();
    [
        setXPowByHeader,
        setContentType(type)
    ].forEach(setPropsTo => setPropsTo(mut_response));

    fs.createReadStream(`${baseDir}${filePaths.frontend_build}${pathname}`)
        .on('error', reqErrHandler(mut_response)())
        .pipe(mut_response);
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

    readScenariosTasksAndTransIntoArrayPromise()
        .then(allScenariosWTasks_array => {
        
            const scenariosWTasks = getArrIntoObjWTasksPerScenario(allScenariosWTasks_array);
            sendJsonAsResponse(mut_response)(scenariosWTasks);
        }).catch((err) => {
            console.error(err);
            reqErrHandler(mut_response)()(`${errMessages.objNotValidJsonString} ${scenariosWTasksJson}`)
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
    if (sortType !== sortTypes.asc && sortType !== sortTypes.desc) {
        reqErrHandler(mut_response)()(errMessages.invalidSortType);
    }
    setStandardJsonHeaders(mut_response);

    readScenariosTasksAndTransIntoArrayPromise()
        .then(allScenariosWTasks_array => {
            const new_allScenariosWTasks_array = [...allScenariosWTasks_array];
            const sortFn = sortByProp(orderField)(orderMultiplier[sortType]);
            const sortedAllScenariosWTasks_array = (orderField === orderFields.name)
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
            reqErrHandler(mut_response)()(`${errMessages.objNotValidJsonString} ${new_allScenariosWTasks_Obj}`)
        });

};

const sendScenariosSearch = ({ filterValue }) => mut_response => mut_body => () => {
    if (!isString(filterValue)) {
        reqErrHandler(mut_response)()(`${errMessages.invalidFilterType} ${filterValue}`); 
    }
    setStandardJsonHeaders(mut_response);

    readScenariosTasksAndTransIntoArrayPromise()
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

                        if (operators[0] === filterOperators.and && operators[1] === filterOperators.and) {
                            return (conditions.length === found_arr.filter(isNotUndefined).length)
                        } else if (operators[0] === filterOperators.or && operators[1] === filterOperators.or) {
                            return (found_arr.filter(isNotUndefined).length > 0);
                        } else if (operators[0] === filterOperators.and && operators[1] === filterOperators.or) {
                            return (isNotUndefined(found_arr[0]) && isNotUndefined(found_arr[1]) || isNotUndefined(found_arr[2]));
                        } else if (operators[0] === filterOperators.or && operators[1] === filterOperators.and) {
                            return (isNotUndefined(found_arr[0]) || isNotUndefined(found_arr[1]) && isNotUndefined(found_arr[2]));
                        } else if (operators[0] === filterOperators.or) {
                            return (found_arr.filter(isNotUndefined).length > 0);
                        } else if (operators[0] === filterOperators.and) {
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
            reqErrHandler(mut_response)()(`${errMessages.objNotValidJsonString} ${new_allScenariosWTasks_Obj}`)
        });
};

const isCarouselNotLast = tasks => {
    const carouselIndex = tasks.findIndex(({ template }) => template === 'carousel');
    return (carouselIndex !== -1 && (carouselIndex !== tasks.length - 1))
};

const isTemplateNotAllowedForPlatform = ({ platform = '', template = '' }) => allowedTemplates[platform.toLowerCase()][template.toLowerCase()] === undefined;

const getTemplateNotAllowedForPlatformForAllTasks = (tasks) => {
    const invalidTasks = tasks.filter(isTemplateNotAllowedForPlatform);
    const invalidTasksErrMsg = invalidTasks
        .map(({ platform, template }) => errMessages
            .replace('${template}', template)
            .replace('${platform}', platform)
        )   
        .join('\n');
    return invalidTasksErrMsg;
};

const templatePropertyCount = init_count => property => arr => {
    return arr.reduce((count, { template = '' }) => {
        return (template.toLowerCase() === property) ? count + 1 : count
    }, init_count)
};

const getStickersCount = templatePropertyCount(0)(allowedTemplates.facebook.sticker);

const getScenarioAlreadyExistsErrMsg = scenarioTasks_arr => bodyWithID => (scenarioTasks_arr.find(({ id }) => id === bodyWithID.id) !== undefined)
    ? errMessages.existingScenarioName
    : '';

const getScenarioDoesNotExistErrMsg = scenarioID => scenarioToMod => (scenarioToMod === undefined)
    ? errMessages.nonExistingScenarioID.replace('${scenarioID}', scenarioID)
    : '';

const getMoreThan1StickerErrMsg = bodyJson => scenarioToMod => {
    const bodyJsonTasks = get(bodyJson, 'tasks', []);
    const scenarioToModTasks = get(scenarioToMod, 'tasks', [])
    const bodyJsonStickersCount = getStickersCount(bodyJsonTasks);
    return (bodyJsonStickersCount > 1 || (getStickersCount(scenarioToModTasks) > 0 && bodyJsonStickersCount > 0))
        ? errMessages.moreThan1Sticker
        : ''
}

const getCarouselNotLastErrMsg = ({ tasks = [] }) => isCarouselNotLast(tasks)
    ? errMessages.carouselNotLast
    : '';

const unableToAddTaskCarouselAlreadyLast = scenarioToMod => {
    const scenarioToModTasks = get(scenarioToMod, 'tasks', []);
    const lastTask = scenarioToModTasks[scenarioToModTasks.length - 1];
    return get(lastTask, 'template') === allowedTemplates.facebook.carousel
        ? errMessages.unableToAddTasks
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
    const reqInputErrHandlerWErrMissing = reqInputErrHandler(mut_response)();

    readScenariosTasksAndTransIntoArrayPromise().then((scenarioTasks_arr) => {
        /**{ id: 'scenario_5',
            name: 'Scenario 5',
            tasks: [ [Object], [Object] ] }, */

        const bodyWithID = {
            ...bodyJson,
            id: get(bodyJson, 'name', '', 'string').trim().replace(/ +/, ' ').replace(/ +/, '_').toLowerCase()
        };
    
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
        
            const scenarios = newScenarios.map(({ id, name }) => ({ id, name }));
            const tasks = newScenarios.reduce((acc, { id, tasks }) => {
                acc[id] = tasks.map((task, i) => ({
                    scenario: id,
                    ...task,
                    position: i + 1
                }));
                return acc;
            }, {});

            db.setScenarios(scenarios);
            db.setTasks(tasks);

            const scenariosWTasks_obj = getArrIntoObjWTasksPerScenario(newScenarios);
            sendJsonAsResponse(mut_response)(scenariosWTasks_obj);
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
    const reqInputErrHandlerWErrMissing = reqInputErrHandler(mut_response)();

    readScenariosTasksAndTransIntoArrayPromise().then((scenarioTasks_arr) => {

        const scenarioToModIndex = scenarioTasks_arr.findIndex(({ id }) => id === bodyJson.scenario);
        const scenarioToMod = scenarioTasks_arr[scenarioToModIndex];

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

            db.setTasks(tasks);
            const scenariosWTasks_obj = getArrIntoObjWTasksPerScenario(mut_allScenariosWNewTask);
            sendJsonAsResponse(mut_response)(scenariosWTasks_obj);
        }
    }).catch(reqInputErrHandlerWErrMissing);
};

const deleteScenarios = (pathname) => mut_response => mut_body => () => {
    // good to do: check for authenticated user
    const scenarioID = getLastFieldFromStringSegments('/')(pathname);

    if (!/scenario_\S/.test(scenarioID)) return reqInputErrHandler(mut_response)()(errMessages.invalidScenarioID);

    readScenariosPromise()
        .then(([scenarios_arr, tasks_obj]) => {
            const newScenarios_arr = scenarios_arr.filter(({ id }) => id !== scenarioID)

            const newTasks_obj = {
                ...tasks_obj
            };

            delete newTasks_obj[scenarioID];

            db.setScenarios(newScenarios_arr);
            db.setTasks(newTasks_obj)
           
            compose([
                getAllScenariosWTasks_array,
                getArrIntoObjWTasksPerScenario,
                sendJsonAsResponse(mut_response)
            ])([newScenarios_arr, newTasks_obj]);
        })


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
    '/api/tasks/add': addTaskToScenarioAndReturn,
    '/api/scenario/delete': deleteScenarios
};



/**
 * 
 * GET ALL
 * GET AND OR (up to 3) filterFields=dateCreated&filterFields=name
 * GET Sortby:: orderField=release.name&sortType=asc
 */
const getHandler = pathname => method => queryObj => {
    log(`Method: ${method}, pathname: ${pathname}`);
    if (method === 'GET' && pathname === '/') {
        return handlers['/'];
    } else if (method === 'GET' && /\/static\/|\/manifest\.json|\/favicon.ico/.test(pathname)) {
        return handlers['static'](pathname);
    } else if (method === 'GET' && pathname === '/api/scenarios' && isString(get(queryObj, queryObjParams.filterValue))) {
        return handlers['/api/scenarios/searchBy'](queryObj);
    } else if (method === 'GET' && pathname === '/api/scenarios' && isString(get(queryObj, queryObjParams.orderField))) {
        return handlers['/api/scenarios/sortBy'](queryObj);
    } else if (method === 'GET' && pathname === '/api/scenarios') {
        return handlers[pathname];
    } else if (method === 'POST' && pathname === '/api/scenarios/add') {
        return handlers['/api/scenarios/add'];
    } else if (method === 'POST' && pathname === '/api/tasks/add') {
        return handlers['/api/tasks/add'];
    } else if (method === 'DELETE' && pathname.includes('/scenario/')) {
        return handlers['/api/scenario/delete'](pathname);
    } else {
        return reqErrHandler;
    }
};


const unifiedServer = (req, res) => {
    const {
        method, //uppercase
        url: URL,
        headers,
    } = req;

    const parsedURL = url.parse(URL, true);


    const { query: queryObj, pathname } = parsedURL;
    
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
        console.log('\x1b[36m%s\x1b[0m', serverListeningOnPort.replace('${port}', config.httpPort).replace('${envName}', config.envName));
    });

    httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', serverListeningOnPort.replace('${port}', config.httpsPort).replace('${envName}', config.envName));
    });
}

module.exports = {
    init
};
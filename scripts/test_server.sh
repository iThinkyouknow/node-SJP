#!/usr/bin/env node

// assume that the server is already running!
const assert = require('assert');
const querystring = require('querystring');

const {
    jsonParse,
    jsonStringify,
    compose
} = require('../utils/functions');
const { log } = console;

const http = require('http');

const errHandler = err => {
    console.error('Is the server turned on? 🤔');
    console.error(err);
    assert.fail(err);

};

const getManifestJson = () => {
    http.get('http://localhost:8000/manifest.json', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const body_json = jsonParse()(Buffer.concat(body).toString());

                assert.ok(body_json, body_json);
                log('Manifest.json GOTTEN SUCCESSFULLY');
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
};

const getFavIcon = () => {
    http.get('http://localhost:8000/favicon.ico', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const dataBuffer = Buffer.concat(body);
                assert.ok(dataBuffer, dataBuffer);
                log('favicon.ico GOTTEN SUCCESSFULLY');
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
}


const getReactApp = () => {
    // REACT APP GOTTEN SUCCESSFULLY
    http.get('http://localhost:8000/', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const body_str = Buffer.concat(body).toString();

                assert.ok(body_str, body_str);
                log('REACT APP GOTTEN SUCCESSFULLY');
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
}


// api testing

const delScenarioTest = () => {
    // Delete

    const delScenarioReq = {
        path: '/api/scenario/scenario_test',
        port: 8000,
        method: 'DELETE'
    };
    const delScenarioRequest = http.request(delScenarioReq, res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseJson = jsonParse()(returnedResponse);

                log('API: POST NEW SCENARIO ');
                log(jsonStringify()(2)(returnedResponseJson));

            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);

    delScenarioRequest.end();
};

const addTaskTest = () => {
    const addTasksReq = {

        path: '/api/tasks/add',
        port: 8000,
        method: 'POST',
        headers: {
            'Content-Type': 'Application/json'
        }
    };
    const addTasksRequest = http.request(addTasksReq, res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseJson = jsonParse()(returnedResponse);

                log('API: POST NEW SCENARIO ');
                log(jsonStringify()(2)(returnedResponseJson))
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);

    addTasksRequest.write(jsonStringify()()({
        "scenario": 'scenario_test',
        "tasks": [
            {
                "template": "video",
                "platform": "line",
                "lang": "ja_JP"
            },
            {
                "template": "image",
                "platform": "facebook",
                "lang": "ja_JP"
            }
        ]
    }));

    addTasksRequest.end();
};

const addScenarioTest = () => {
    //POST
    const addScenarioReq = {

        path: '/api/scenarios/add',
        port: 8000,
        method: 'POST',
        headers: {
            'Content-Type': 'Application/json'
        }
    };
    const addScenariosRequest = http.request(addScenarioReq, res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseJson = jsonParse()(returnedResponse);

                log('API: POST NEW SCENARIO ');
                log(jsonStringify()(2)(returnedResponseJson));


                // add tasks after adding scenario
                addTaskTest();

            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);

    addScenariosRequest.write(jsonStringify()()({
        "name": 'Scenario Test',
        "tasks": [
            {
                "scenario": "scenario_test",
                "template": "video",
                "platform": "line",
                "lang": "ja_JP",
                "position": 1
            },
            {
                "scenario": "scenario_test",
                "template": "image",
                "platform": "facebook",
                "lang": "ja_JP",
                "position": 2
            }
        ]
    }));

    addScenariosRequest.end();
}

const getAllScenarios = () => {
    http.get('http://localhost:8000/api/scenarios', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseJson = jsonParse()(returnedResponse);

                log('API: GET ALL SCENARIOS');
                log(jsonStringify()(2)(returnedResponseJson));
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
};


const getScenariosByFilter = () => {
    http.get('http://localhost:8000/api/scenarios?filterValue=facebook-and-carousel-and-en_US', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseObj = jsonParse()(returnedResponse);

                log('API: GET FILTERED TASKS BY FACEBOOK AND CAROUSEL AND EN_US!');
                log(jsonStringify()(2)(returnedResponseObj))
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler)
};

const getScenariosByFilterFBOrCarouselAndEN = () => {
    http.get('http://localhost:8000/api/scenarios?filterValue=facebook-or-carousel-or-en_US', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseObj = jsonParse()(returnedResponse);

                log('API FILTER: facebook or carousel or en_US');
                log(jsonStringify()(2)(returnedResponseObj));
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler)
};

const getScenariosByTemplate = () => {
    http.get('http://localhost:8000/api/scenarios?orderField=template&sortType=asc', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseObj = jsonParse()(returnedResponse);

                log('API orderField: template, sortType: asc');
                log(jsonStringify()(2)(returnedResponseObj));
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
};

const getAllScenariosByTemplateDesc = () => {
    http.get('http://localhost:8000/api/scenarios?orderField=template&sortType=desc', res => {
        if (res.statusCode === 200) {
            let body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', _ => {
                const returnedResponse = Buffer.concat(body).toString();
                const returnedResponseObj = jsonParse()(returnedResponse);

                log('API orderField: template, sortType: desc');
                log(jsonStringify()(2)(returnedResponseObj));
            })
            res.on('err', err => errHandler(`err: ${err}`));

        } else {
            errHandler(`err: ${res.statusCode}`);
        }
    }).on('error', errHandler);
}

// other conditions: and, or, and-or, or-and
delScenarioTest();
setTimeout(() => {
    [
        getManifestJson,
        getFavIcon,
        getReactApp,
        addScenarioTest,
        getAllScenarios,
        getScenariosByFilter,
        getScenariosByFilterFBOrCarouselAndEN,
        getScenariosByTemplate,
        getAllScenariosByTemplateDesc
    ].forEach(fn => fn());
}, 500);


setTimeout(delScenarioTest, 1000);






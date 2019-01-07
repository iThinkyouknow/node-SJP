


const environments = {
    staging: {
        httpPort: 8000
        , httpsPort: 8001
        , envName: 'staging'
        , hashingSecret: ''
        , scenariosFilePath: 'data/scenarios.json'
        , tasksFilePath: 'data/tasks.json'
        , writeToStoreInterval: 500
    }
    , production: {
        httpPort: 80
        , httpsPort: 443
        , envName: 'production'
        , hashingSecret: 'data/scenarios_prod.json'
        , tasksFilePath: 'data/tasks_prod.json'
        , writeToStoreInterval: 500
    }
};

const currentEnvironment = (typeof process.env.NODE_ENV === 'string')
    ? process.env.NODE_ENV.toLowerCase()
    : '';

const envToExport = (typeof environments[currentEnvironment] === 'object')
    ? environments[currentEnvironment]
    : environments['staging'];


module.exports = envToExport;

const environments = {
    staging: {
        httpPort: 8000
        , httpsPort: 8001
        , envName: 'staging'
        , hashingSecret: ''
        , maxChecks: 5
        , twilio: {
            accountSid: ''
            , authToken: ''
            , fromPhone: ''
        }
    }
    , production: {
        httpPort: 80
        , httpsPort: 443
        , envName: 'production'
        , hashingSecret: ''
        , maxChecks: 5
        , twilio: {
            accountSid: ''
            , authToken: ''
            , fromPhone: ''
        }
    }
};

const currentEnvironment = (typeof process.env.NODE_ENV === 'string')
    ? process.env.NODE_ENV.toLowerCase()
    : '';

const envToExport = (typeof environments[currentEnvironment] === 'object')
    ? environments[currentEnvironment]
    : environments['staging'];


module.exports = envToExport;
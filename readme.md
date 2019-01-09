# Node App

## Server
A Node.js Server written without frameworks

### Mock Data
A script is provided to generate mock data.  
You may generate any number of scenarios that you want by modifying the scenario_num constants on line 7
```
node scripts/make_mock_data.js

const senario_num = 3;
```

### 1. Start the server
It runs on Node 10.15.0
```
node index.js
```
The port is `8000`.  
You can change it in the lib/config.js if you so desire.  

### 2. Use the server
You may wish to use the script provided to run all the requests automagically.  
```
scripts/test_server.sh
```
Permissions modification on that file may be required.  

Else,  
You can hit the server manually:  
It contains the following the requests to the server:  
Eg. http://localhost:8000  
GET the frontend (not done, will only see a React default page)  
GET the assets from React FrontEnd  

#### Api
##### GET all scenarios  
Eg. `http://localhost:8000/api/scenarios`

###### GET scenarios by filter
`Eg. http://localhost:8000/api/scenarios?filterValue=facebook-and-carousel-and-en_US`

```
filterValue format = param-operator-param  
param = any of template, platform, or lang  
opeator = {and, or}
```
  

##### GET scenarios sorted by field
```
http://localhost:8000/api/scenarios?orderField=template&sortType=asc  
orderField = {template, platform, lang}  
sortType = {asc, desc}
```

##### DELETE scenario
/api/scenario/scenario_test/{scenario_id}  
Eg.  
```
METHOD: DELETE  
http://localhost:8000/api/scenario/scenario_test/scenario_test  
```

##### POST add new scenario with tasks
Eg:
```
url: /api/scenarios/add
body: "{
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
    }"
```

##### POST add new tasks
Eg.
```
url: /api/tasks/add
body: "{
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
    }"
```

## FrontEnd
*Not Done*


# Node App

## Server
To Run, you may use the test script provided:

### 1. Start the server
```
node index.js
```
The port is `8000`.  
You can change it in the lib/config.js if you so desire.  
  
It contains the following the request to the server:  
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
http://localhost:8000/api/scenarios?orderField=template&sortType=asc  
  
```
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


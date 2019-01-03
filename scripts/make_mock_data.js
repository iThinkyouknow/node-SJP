const fs = require('fs');
const templates_fb = ['text', 'image', 'video', 'audio', 'button'];
const templates_line = ['text', 'image', 'video', 'audio']
const langs = ['en_US', 'ja_JP'];
const platforms = ['facebook', 'line'];

const senario_num = 23;

const scenearios_array = Array.from(Array(senario_num)).map((_, i) => ({
    "id": `scenario_${i + 1}`,
    "name": `Scenario ${i + 1}`
}));

console.log(scenearios_array);

fs.writeFile(
    `${__dirname}/../data/scenarios.json`,
    JSON.stringify(scenearios_array, null, 2),
    err => console.error(err));


const getRandomCount = num => Math.floor(Math.random() * num);

const tasks_obj = scenearios_array.map((scenario, j) => {


    const taskEmptyArrayWCount = Array(Math.max(1, getRandomCount(templates_fb.length)));
    const mut_tasksArray = Array.from(taskEmptyArrayWCount, (_, index) => {
        const platform = platforms[getRandomCount(platforms.length)];
        const templatesToUse = platform === 'facebook'
            ? templates_fb
            : templates_line;

        return {
            "scenario": scenario.id,
            "template": templatesToUse[getRandomCount(templatesToUse.length)],
            "platform": platform,
            "lang": langs[getRandomCount(langs.length)],
            "position": index + 1
        };
    });

    const shouldAddSticker = getRandomCount(2);
    const platform = platforms[getRandomCount(platforms.length)];
    const shouldAddCarousel = (platform === 'facebook') && getRandomCount(2);

    if (shouldAddSticker) {
        mut_tasksArray.push({
            "scenario": scenario.id,
            "template": 'sticker',
            "platform": platforms[getRandomCount(platforms.length)],
            "lang": langs[getRandomCount(langs.length)],
            "position": mut_tasksArray.length + 1
        });
    }

    if (shouldAddCarousel) {
        mut_tasksArray.push({
            "scenario": scenario.id,
            "template": 'carousel',
            "platform": platform,
            "lang": langs[getRandomCount(langs.length)],
            "position": mut_tasksArray.length + 1
        });
    }
    return mut_tasksArray;

}).reduce((acc, tasks) => {
    acc[tasks[0].scenario] = tasks;
    return acc;
}, {});

console.log(JSON.stringify(tasks_obj, null, 2));

fs.writeFile(
    `${__dirname}/../data/tasks.json`,
    JSON.stringify(tasks_obj, null, 2),
    err => console.error(err));


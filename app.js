#!/usr/bin/node
const fetch = require("node-fetch");
require("dotenv").config();

const url = "https://intranet.hbtn.io/users/auth_token.json";
const keyApi = "6bbf669e90187d7d48ccde6473b9e35b";
const mail = "3430@holbertonschool.com";
const password = process.env.SECRET_KEY;
const idProjectSetteur = process.argv[2];

const axios = require("axios");

const options = {
  method: "GET",
  url: "https://zenquotes.io/api/quotes/courage",
  headers: { "Content-Type": "application/json" },
};
const getQuote = async () => {
  await axios.request(options).then(async function (response) {
    const result = await response.data[0]
    console.log(result.q);
    return;
  });
};

// good
const getToken = async () => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: keyApi,
      email: mail,
      password: password,
      scope: "checker",
    }),
  });
  let result = await response.json();
  return result.auth_token;
};

// good
async function getProject() {
  let tokenGet = await getToken();
  let idProject = idProjectSetteur;
  let url =
    "https://intranet.hbtn.io/projects/" +
    idProject +
    ".json?auth_token=" +
    tokenGet;
  let response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  let result = await response.json();
  return result.tasks;
}

// good
async function dictProject() {
  let tasks = await getProject();
  let taskInDict = {};
  for (let i of tasks) {
    for (let key in tasks) {
      let taskInDictInfo = {};
      taskInDictInfo["github_file"] = tasks[key].github_file;
      taskInDictInfo["checker_available"] = tasks[key].checker_available;
      taskInDictInfo["github_dir"] = tasks[key].github_dir;
      taskInDictInfo["github_repo"] = tasks[key].github_repo;
      taskInDictInfo["position"] = tasks[key].position;
      taskInDictInfo["title"] = tasks[key].title;
      taskInDict[tasks[key].id] = taskInDictInfo;
    }
  }
  return taskInDict;
}

// good
async function correctProject(idTask) {
  let tokenGet = await getToken();
  let url =
    "https://intranet.hbtn.io/tasks/" +
    idTask +
    "/start_correction.json?auth_token=" +
    tokenGet;
  let response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  let result = await response.json();
  return result.id;
}

//
async function checkCorrection(idCorrection) {
  let tokenGet = await getToken();
  let url =
    "https://intranet.hbtn.io/correction_requests/" +
    (await idCorrection) +
    ".json?auth_token=" +
    tokenGet;
  let response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  let result = await response.json();
  return result;
}

//
async function ProjectCorrection() {
  var dictTasks = await dictProject();
  var tasksCorrected = 0;
  for (const [key, value] of Object.entries(dictTasks)) {
    let dictKeyValue = dictTasks[key];
    if (value["checker_available"] === true) {
      let idCorrection = await correctProject(key);
      dictKeyValue["idCorrection"] = idCorrection;
      tasksCorrected++;
      console.log("Task (" + value["title"] + ") correction asked");
    } else {
      dictKeyValue["idCorrection"] = undefined;
      console.log(
        "🚀 Task (" + value["title"] + ") skipped no checker available"
      );
    }
    dictTasks[key] = dictKeyValue;
  }
  console.log("In waiting...");
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log("Done correction");
  for (const [key, value] of Object.entries(dictTasks)) {
    if (value["idCorrection"] != undefined) {
      const result = await checkCorrection(value["idCorrection"]);
      if (result.result_display.all_passed === false) {
        getQuote();
        console.log("Task (" + value["title"] + ") failed");
        return;
      }
    }
  }
  if (tasksCorrected === 0) {
    console.log(tasksCorrected + " checked!");
    return;
  } else {
    getQuote();
    console.log(
      tasksCorrected + "/" + Object.keys(dictTasks).length + " checked!"
    );
  }
}
ProjectCorrection();

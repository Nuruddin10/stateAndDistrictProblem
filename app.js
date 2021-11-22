const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const DBPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

const initializingDbAndServer = async () => {
  try {
    db = await open({
      filename: DBPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server And DB Initislised Successfully");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializingDbAndServer();

const GettingStateDetails = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

const GettingDistrictDetails = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

const GettingStateStats = (StateDetails) => {
  return {
    totalCases: StateDetails["sum(cases)"],
    totalCured: StateDetails["sum(cured)"],
    totalActive: StateDetails["sum(active)"],
    totalDeaths: StateDetails["sum(deaths)"],
  };
};

app.get("/states/", async (request, response) => {
  const QueryForGettingStateList = `select * from state ;`;
  const ResponseDb = await db.all(QueryForGettingStateList);
  response.send(ResponseDb.map((eachState) => GettingStateDetails(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const QueryForGettingStateDetails = `select * from state where state_id = ${stateId} ;`;
  const ResponseDb = await db.get(QueryForGettingStateDetails);
  response.send(GettingStateDetails(ResponseDb));
});

app.post("/districts/", async (request, response) => {
  let districtDetailsBody = request.body;
  let {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetailsBody;
  const QueryForUpdatingStateDetails = `
    insert into district(district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(QueryForUpdatingStateDetails);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const QueryForReturningRequiredDistrict = `select * from district where district_id = ${districtId} ;`;
  const dbResponse = await db.get(QueryForReturningRequiredDistrict);
  response.send(GettingDistrictDetails(dbResponse));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const QueryForDeletingRequestedDistrict = `delete from district where district_id = ${districtId} ;`;
  await db.run(QueryForDeletingRequestedDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  let requestBody = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const QueryForUpdatingTheGivenDistrict = `
    update district set 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} 
    where district_id = ${districtId} ;`;
  await db.run(QueryForUpdatingTheGivenDistrict);
  response.send("District Details Updated");
});

app.get("states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const QueryForGettingRequestedStateStats = `
  SELECT
     SUM(cases),
     SUM(cured),
     SUM(active),
     SUM(deaths) 
     FROM 
        district
     WHERE 
        state_id = ${stateId};`;
  const dbResponse = await db.get(QueryForGettingRequestedStateStats);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});

const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null
const dbPath = path.join(__dirname, 'covid19India.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`server running at http://localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

/* get states API */
const convertDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
 SELECT
 *
 FROM
 state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(eachState => convertDbObjectToResponseObject(eachState)),
  )
})

/* get state API */
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select 
    *
  from
      state
  where
   state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  const {state_id, state_name, population} = state
  const dbResponse = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  }
  response.send(dbResponse)
})

/* create districts API */
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const adddistrictQuery = `
    INSERT INTO
    district ( district_name, state_id, cases, cured, active, deaths)
    VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`

  const dbResponse = await db.run(adddistrictQuery)
  const districtId = dbResponse.lastID
  response.send('District Successfully Added')
})

/* get district API */
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `
  SELECT * FROM
  district
  WHERE 
  district_id=${districtId};
  `
  const district = await db.get(getdistrictQuery)
  const {district_id, district_name, state_id, cases, cured, active, deaths} =
    district
  const dbResponse = {
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  }
  response.send(dbResponse)
})

/* delete district API */
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deletedistrictQuery = `
  DELETE 
  FROM district
  WHERE 
  district_id=${districtId};`
  await db.run(deletedistrictQuery)
  response.send('District Removed')
})

/* update district API */
app.put('/districts/:districtId/', async (request, response) => {
  const districtDetails = request.body
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
  UPDATE district
  SET 
  
  district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'
  WHERE district_id=${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

/* Get stats API  */
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
    SELECT 
    sum(cases),
    sum(cured),
    sum(active),
    sum(deaths)
    FROM
    district
    WHERE
    state_id=${stateId} ;`
  const stats = await db.get(getStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['sum(cases)'],
    totalCured: stats['sum(cured)'],
    totalActive: stats['sum(active)'],
    totalDeaths: stats['sum(deaths)'],
  })
})

/* get state name API */
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`
  //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`
  //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
}) //sending the required response
module.exports = app

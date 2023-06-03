const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

const convertToDbResponse = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertToDbResponseMatchDetails = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

const convertToDBResponseScores = (object) => {
  return {
    playerId: object.playerId,
    playerName: object.playerName,
    totalScore: object.totalScore,
    totalFours: object.totalFours,
    totalSixes: object.totalSixes,
  };
};

app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details;`;
  const dbResponse = await database.all(query);
  response.send(
    dbResponse.map((eachPlayer) => convertToDbResponse(eachPlayer))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await database.get(query);
  response.send(convertToDbResponse(dbResponse));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const query = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await database.run(query);
  response.send("Player Details Updated");
});

// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await database.get(query);
  console.log(dbResponse);
  response.send(convertToDbResponseMatchDetails(dbResponse));
});

// API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const dbResponse = await database.all(query);
  console.log(dbResponse);
  response.send(
    dbResponse.map((eachMatch) => convertToDbResponseMatchDetails(eachMatch))
  );
});

// API6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName FROM match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id INNER JOIN player_details ON player_match_score.player_id = player_details.player_id WHERE match_details.match_id = ${matchId};`;
  const dbResponse = await database.all(query);
  console.log(dbResponse);
  response.send(dbResponse);
});

// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const dbResponse = await database.get(getPlayerScored);
  console.log(dbResponse);
  response.send(convertToDBResponseScores(dbResponse));
});

module.exports = app;

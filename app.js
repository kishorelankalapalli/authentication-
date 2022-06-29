let express = require("express");

let { open } = require("sqlite");

let path = require("path");

let dbPath = path.join(__dirname, "userData.db");

let sqlite3 = require("sqlite3");

let bcrypt = require("bcrypt");

let app = express();

app.use(express.json());

let database = null;

let initializeDBAndServer = () => {
  try {
    database = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Successfully at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const passwordCheck = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO 
    user (username , name, password , gender , location )
                                VALUES
                                ('${username}',
                                '${name}',
                                '${hashedPassword}',
                                '${gender}',
                                '${location}';`;

    if (passwordCheck(password)) {
      await database.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API  2

app.post("/login", async (request, response) => {
  let { username, password } = request.body;

  let selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let ispasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (ispasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;

  let selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

    if (isPasswordMatched === true) {
      if (passwordCheck(newPassword)) {
        let hashedPassword = await bcrypt.hash(newPassword, 10);
        let updatePassword = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        await database.run(updatePassword);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

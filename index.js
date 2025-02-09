const knex = require("./knex-config");
const { v4: uuidv4 } = require("uuid");

// Create the User table
async function createUserTable() {
  console.log("Creating User table if it does not exist...");
  try {
    const client = knex.client;
    const tables = await client.listTables();
    if (!tables.some((table) => table[0].value === "User")) {
      await client.database.updateSchema({
        statements: [
          `CREATE TABLE User (
            id STRING(36) NOT NULL,
            firstName STRING(100),
            lastName STRING(100),
            age INT64
          ) PRIMARY KEY (id)`,
        ],
      });
      console.log("User table created.");
    } else {
      console.log("User table already exists.");
    }
  } catch (error) {
    console.error("Error creating User table:", error);
  }
}

// Create a user
async function createUser(firstName, lastName, age) {
  const id = uuidv4();
  console.log(
    `Creating user with ID ${id}, firstName ${firstName}, lastName ${lastName}, and age ${age}...`
  );
  try {
    await knex("User").insert({
      id,
      firstName,
      lastName,
      age,
    });
    // ISSUE: The following log is not executed even when the record is created successfully.
    console.log(`User created successfully`);
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

// Get users
async function getUsers() {
  console.log("Fetching users...");
  try {
    const query = knex("User").select("*");
    console.log("Constructed query:", query.toString());
    await query;
    // ISSUE: The following log is not executed even when the query get the users successfully.
    console.log("Users fetched successfully");
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Test connection
async function testConnection() {
  const client = knex.client;
  await client.testConnection();
}

// List tables
async function listTables() {
  const client = knex.client;
  const tables = await client.listTables();
  console.log("Tables in the database:", tables);
}

// Run example queries
(async () => {
  try {
    console.log("Starting example queries...");
    await testConnection();
    await createUserTable();
    await listTables();
    // Get Users will fail for some reason after a couple of executions,
    // stop/delete the docker container and run the runme.sh script again if it happens.
    // await getUsers();
    await createUser("Alice", "Smith", 30);
  } catch (error) {
    console.error("Error during example queries:", error);
  } finally {
    await knex.destroy();
    console.log("Database connection closed.");
  }
})();

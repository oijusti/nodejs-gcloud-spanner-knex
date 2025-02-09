const Knex = require("knex");
const SpannerClient = require("./spanner-client");

process.env.SPANNER_EMULATOR_HOST = "localhost:9010";

// Configuration for Knex with Spanner client
const knexConfig = {
  client: SpannerClient,
  clientConfig: {
    projectId: "test-project",
    instance: "test-instance",
    database: "test-db",
    apiEndpoint: "localhost:9010",
  },
};

const knex = Knex(knexConfig);

module.exports = knex;

const Knex = require("knex");
const { Spanner } = require("@google-cloud/spanner");

class SpannerClient extends Knex.Client {
  constructor(knexConfig) {
    super(knexConfig);
    this.spanner = new Spanner({
      projectId: knexConfig.clientConfig.projectId,
    });
    this.instance = this.spanner.instance(knexConfig.clientConfig.instance);
    this.database = this.instance.database(knexConfig.clientConfig.database);
  }

  // Overriding the 'acquireRawConnection' method to establish a connection
  acquireRawConnection() {
    return new Promise((resolve, reject) => {
      this.database.runTransaction((err, transaction) => {
        if (err) {
          return reject(err);
        }
        resolve(transaction);
      });
    });
  }

  // Overriding the 'acquireConnection' method to establish a connection
  acquireConnection() {
    return this.acquireRawConnection();
  }

  // Overriding the 'query' method to execute queries
  query(connection, queryContext) {
    return new Promise(async (resolve, reject) => {
      console.log("Query context:", queryContext);
      let query = queryContext.sql;
      const params = queryContext.bindings;

      // Remove double quotes from table names
      query = query.replace(/"([^"]+)"/g, "$1");

      // Convert positional parameters to named parameters
      const namedParams = {};
      query = query.replace(/\?/g, (match, offset) => {
        const paramName = `param${offset}`;
        namedParams[paramName] = params.shift();
        return `@${paramName}`;
      });

      console.log(
        `Executing query: ${query} with params: ${JSON.stringify(namedParams)}`
      );

      try {
        // Run the query on Spanner
        const [rows] = await connection.run({
          sql: query,
          params: namedParams,
        });
        console.log(
          `Query executed successfully. Rows: ${JSON.stringify(rows)}`
        );
        console.log(`queryContext: ${queryContext.method}`);
        if (
          queryContext.method === "insert" ||
          queryContext.method === "update" ||
          queryContext.method === "delete"
        ) {
          try {
            await connection.commit();
            console.log("Transaction committed.");
          } catch (err) {
            console.error("Error committing transaction:", err);
            reject(err);
          }
        }
        // ISSUE: Something is wrong after resolving the promise. No further logs are printed.
        resolve({
          rows,
          rowCount: rows.length,
          warningCount: 0,
          duration: 0,
          __knexQueryUid: queryContext.__knexQueryUid,
        });
      } catch (err) {
        console.error(`Error executing query: ${err}`);
        reject(err);
      }
    });
  }

  // Overriding the 'destroy' method to close the Spanner connection
  destroy() {
    return this.database.close();
  }

  // Overriding the 'releaseConnection' method to release the connection
  releaseConnection(connection) {
    return new Promise((resolve, reject) => {
      connection.end((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Method to test the connection
  async testConnection() {
    try {
      await this.database.run({ sql: "SELECT 1" });
      console.log("Connection test successful.");
    } catch (err) {
      console.error("Connection test failed:", err);
    }
  }

  // Method to list tables in the database
  async listTables() {
    try {
      const [tables] = await this.database.run({
        sql: "SELECT table_name FROM information_schema.tables WHERE table_catalog = '' AND table_schema = ''",
      });
      return tables;
    } catch (err) {
      console.error("Error listing tables:", err);
      throw err;
    }
  }

  // Add additional necessary methods as required (e.g., schema creation, migrations, etc.)
}

module.exports = SpannerClient;

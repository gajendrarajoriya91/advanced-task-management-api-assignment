const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors"); // Import the cors package
const connectDB = require("./config/db");
const schema = require("./schema");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

app.use("/graphql", (req, res, next) => {
  const query = req.body.query;
  if (query.includes("mutation login") || query.includes("mutation register")) {
    next();
  } else {
    authMiddleware(req, res, next);
  }
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

module.exports = app;

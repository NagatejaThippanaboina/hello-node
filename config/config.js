require("dotenv").config();

module.exports = {
    development: {
        username: "postgres",
        password: process.env.POSTGRES_PASSWORD,
        database: "todo_development",
        host: "127.0.0.1",
        dialect: "postgres",
    },
    test: {
        username: "postgres",
        password: process.env.POSTGRES_PASSWORD,
        database: "todo_test",
        host: "127.0.0.1",
        dialect: "postgres",
    },
    production: {
        username: "postgres",
        password: process.env.POSTGRES_PASSWORD,
        database: "todo_development",
        host: "127.0.0.1",
        dialect: "postgres",
    },
};
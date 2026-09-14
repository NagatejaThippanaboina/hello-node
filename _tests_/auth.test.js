const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../index");
const db = require("../models");

describe("Authentication", () => {
  let createdUsers = [];

  afterEach(async () => {
    for (const user of createdUsers) {
      await db.Todo.destroy({
        where: {
          userId: user.id,
        },
      });

      await db.User.destroy({
        where: {
          id: user.id,
        },
      });
    }

    createdUsers = [];
  });

  async function createUser(firstName, email, password) {
    const user = await db.User.create({
      firstName,
      email,
      password,
    });

    createdUsers.push(user);

    return user;
  }

  async function getCsrfToken(agent, page) {
    const response = await agent.get(page);

    expect(response.statusCode).toBe(200);

    const match = response.text.match(/name="_csrf"\s+value="([^"]+)"/);

    expect(match).not.toBeNull();

    return match[1];
  }

  test("GET /signup displays signup page", async () => {
    const agent = request.agent(app);

    const response = await agent.get("/signup");

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Create Account");
  });

  test("POST /signup creates a user", async () => {
    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent, "/signup");

    const response = await agent
      .post("/signup")
      .set("X-CSRF-Token", csrfToken)
      .send({
        firstName: "John",
        email: `john${Date.now()}@example.com`,
        password: "password123",
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");

    const user = await db.User.findOne({
      where: {
        firstName: "John",
      },
      order: [["id", "DESC"]],
    });

    expect(user).not.toBeNull();
    expect(user.firstName).toBe("John");
    expect(user.password).not.toBe("password123");

    const passwordMatches = await bcrypt.compare("password123", user.password);

    expect(passwordMatches).toBe(true);

    createdUsers.push(user);
  });

  test("POST /login rejects invalid password", async () => {
    const password = await bcrypt.hash("correctpassword", 10);

    const user = await createUser(
      "Login User",
      `login${Date.now()}@example.com`,
      password,
    );

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent, "/login");

    const response = await agent
      .post("/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: user.email,
        password: "wrongpassword",
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test("POST /login accepts correct password", async () => {
    const password = await bcrypt.hash("correctpassword", 10);

    const user = await createUser(
      "Login User",
      `success${Date.now()}@example.com`,
      password,
    );

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent, "/login");

    const response = await agent
      .post("/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: user.email,
        password: "correctpassword",
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/todos");

    const todosPage = await agent.get("/todos");

    expect(todosPage.statusCode).toBe(200);
  });

  test("GET /todos redirects unauthenticated users to login", async () => {
    const response = await request(app).get("/todos");

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
  });
});

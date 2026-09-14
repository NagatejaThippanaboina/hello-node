const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../index");
const db = require("../models");

describe("Todo web endpoints", () => {
  let user;
  let todo;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    user = await db.User.create({
      firstName: "Test User",
      email: `test${Date.now()}@example.com`,
      password: hashedPassword,
    });

    todo = await db.Todo.create({
      title: "Test Todo",
      dueDate: "2026-09-20",
      completed: false,
      userId: user.id,
    });
  });

  afterEach(async () => {
    if (user) {
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
  });

  async function login(agent) {
    const loginPage = await agent.get("/login");

    const match = loginPage.text.match(/name="_csrf"\s+value="([^"]+)"/);

    expect(match).not.toBeNull();

    const csrfToken = match[1];

    const response = await agent
      .post("/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: user.email,
        password: "password123",
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/todos");
  }

  async function getCsrfToken(agent) {
    const response = await agent.get("/todos");

    expect(response.statusCode).toBe(200);

    const match = response.text.match(/name="_csrf"\s+value="([^"]+)"/);

    expect(match).not.toBeNull();

    return match[1];
  }

  test("POST /todos creates a new Todo", async () => {
    const agent = request.agent(app);

    await login(agent);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post("/todos")
      .set("X-CSRF-Token", csrfToken)
      .send({
        title: "New Todo",
        dueDate: "2026-09-25",
      });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/todos");

    const createdTodo = await db.Todo.findOne({
      where: {
        title: "New Todo",
        userId: user.id,
      },
    });

    expect(createdTodo).not.toBeNull();
    expect(createdTodo.dueDate).toBe("2026-09-25");
    expect(createdTodo.completed).toBe(false);
  });

  test("PUT /todos/:id marks a Todo complete", async () => {
    const agent = request.agent(app);

    await login(agent);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .put(`/todos/${todo.id}`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        completed: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.completed).toBe(true);

    const updatedTodo = await db.Todo.findByPk(todo.id);

    expect(updatedTodo.completed).toBe(true);
  });

  test("PUT /todos/:id marks a Todo incomplete", async () => {
    await todo.setCompletionStatus(true);

    const agent = request.agent(app);

    await login(agent);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .put(`/todos/${todo.id}`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        completed: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.completed).toBe(false);

    const updatedTodo = await db.Todo.findByPk(todo.id);

    expect(updatedTodo.completed).toBe(false);
  });

  test("DELETE /todos/:id deletes a Todo", async () => {
    const agent = request.agent(app);

    await login(agent);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .delete(`/todos/${todo.id}`)
      .set("X-CSRF-Token", csrfToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(true);

    const deletedTodo = await db.Todo.findByPk(todo.id);

    expect(deletedTodo).toBeNull();
  });

  test("POST /todos rejects requests without CSRF token", async () => {
    const agent = request.agent(app);

    await login(agent);

    const response = await agent.post("/todos").send({
      title: "CSRF Attack",
      dueDate: "2026-09-25",
    });

    expect(response.statusCode).toBe(403);
  });
});

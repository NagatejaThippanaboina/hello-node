const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../index");
const db = require("../models");

describe("DELETE /todos/:id", () => {
  let user;
  let todo;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    user = await db.User.create({
      firstName: "Delete User",
      email: `delete${Date.now()}@example.com`,
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

  test("should delete a todo", async () => {
    const agent = request.agent(app);

    const loginPage = await agent.get("/login");

    const match = loginPage.text.match(/name="_csrf"\s+value="([^"]+)"/);

    expect(match).not.toBeNull();

    const loginCsrfToken = match[1];

    const loginResponse = await agent
      .post("/login")
      .set("X-CSRF-Token", loginCsrfToken)
      .send({
        email: user.email,
        password: "password123",
      });

    expect(loginResponse.statusCode).toBe(302);
    expect(loginResponse.headers.location).toBe("/todos");

    const page = await agent.get("/todos");

    expect(page.statusCode).toBe(200);

    const csrfMatch = page.text.match(/name="_csrf"\s+value="([^"]+)"/);

    expect(csrfMatch).not.toBeNull();

    const csrfToken = csrfMatch[1];

    const response = await agent
      .delete(`/todos/${todo.id}`)
      .set("X-CSRF-Token", csrfToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(true);

    const deletedTodo = await db.Todo.findByPk(todo.id);

    expect(deletedTodo).toBeNull();
  });
});

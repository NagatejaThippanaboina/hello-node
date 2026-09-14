const request = require("supertest");
const db = require("../models");

const app = require("../index");

describe("DELETE /todos/:id", () => {
  test("should delete a todo", async () => {
    const todo = await db.Todo.create({
      title: "Test Todo",
      dueDate: "2026-09-16",
      completed: false,
    });

    const response = await request(app).delete(`/todos/${todo.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(true);

    const deletedTodo = await db.Todo.findByPk(todo.id);

    expect(deletedTodo).toBeNull();
  });
});

afterAll(async () => {
  await db.sequelize.close();
});

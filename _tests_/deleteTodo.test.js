const request = require("supertest");
const app = require("../index");
const db = require("../models");

describe("DELETE /todos/:id", () => {
    let todo;

    beforeEach(async () => {
        todo = await db.Todo.create({
            title: "Test Todo",
            dueDate: "2026-09-20",
            completed: false,
        });
    });

    afterEach(async () => {
        await db.Todo.destroy({
            where: {},
        });
    });

    afterAll(async () => {
        await db.sequelize.close();
    });

    test("should delete a todo", async () => {
        const agent = request.agent(app);

        const page = await agent.get("/todos");

        const match = page.text.match(
            /name="_csrf"\s+value="([^"]+)"/,
        );

        expect(match).not.toBeNull();

        const csrfToken = match[1];

        const response = await agent
            .delete(`/todos/${todo.id}`)
            .set("X-CSRF-Token", csrfToken);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(true);

        const deletedTodo = await db.Todo.findByPk(todo.id);

        expect(deletedTodo).toBeNull();
    });
});
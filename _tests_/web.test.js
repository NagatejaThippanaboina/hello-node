const request = require("supertest");
const app = require("../index");
const db = require("../models");

describe("Todo web endpoints", () => {
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

    async function getCsrfToken(agent) {
        const response = await agent.get("/todos");

        expect(response.statusCode).toBe(200);

        const match = response.text.match(
            /name="_csrf"\s+value="([^"]+)"/,
        );

        expect(match).not.toBeNull();

        return match[1];
    }

    // CREATE TODO
    test("POST /todos creates a new Todo", async () => {
        const agent = request.agent(app);
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
            },
        });

        expect(createdTodo).not.toBeNull();
        expect(createdTodo.dueDate).toBe("2026-09-25");
        expect(createdTodo.completed).toBe(false);
    });

    // MARK TODO COMPLETE
    test("PUT /todos/:id marks a Todo complete", async () => {
        const agent = request.agent(app);
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

    // MARK TODO INCOMPLETE
    test("PUT /todos/:id marks a Todo incomplete", async () => {
        await todo.setCompletionStatus(true);

        const agent = request.agent(app);
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

    // DELETE TODO
    test("DELETE /todos/:id deletes a Todo", async () => {
        const agent = request.agent(app);
        const csrfToken = await getCsrfToken(agent);

        const response = await agent
            .delete(`/todos/${todo.id}`)
            .set("X-CSRF-Token", csrfToken);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(true);

        const deletedTodo = await db.Todo.findByPk(todo.id);

        expect(deletedTodo).toBeNull();
    });

    // CSRF PROTECTION
    test("POST /todos rejects requests without CSRF token", async () => {
        const agent = request.agent(app);

        const response = await agent
            .post("/todos")
            .send({
                title: "CSRF Attack",
                dueDate: "2026-09-25",
            });

        expect(response.statusCode).toBe(403);
    });
});
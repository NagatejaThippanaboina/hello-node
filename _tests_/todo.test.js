const { todoList } = require("../todo");

describe("Todo List", () => {
  test("should create a new todo", () => {
    const todos = todoList();

    const todo = {
      title: "Submit assignment",
      dueDate: "2026-09-20",
      completed: false,
    };

    todos.add(todo);

    expect(todos.all).toContain(todo);
  });

  test("should mark a todo as completed", () => {
    const todos = todoList();

    todos.add({
      title: "Pay rent",
      dueDate: "2026-09-20",
      completed: false,
    });

    todos.markAsComplete(0);

    expect(todos.all[0].completed).toBe(true);
  });

  test("should retrieve overdue todos", () => {
    const todos = todoList();

    todos.add({
      title: "Overdue task",
      dueDate: "2020-01-01",
      completed: false,
    });

    const overdueTodos = todos.overdue();

    expect(overdueTodos).toHaveLength(1);
    expect(overdueTodos[0].title).toBe("Overdue task");
  });

  test("should retrieve todos due today", () => {
    const todos = todoList();

    const date = new Date();

    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

    todos.add({
      title: "Today's task",
      dueDate: today,
      completed: false,
    });

    const todayTodos = todos.dueToday();

    expect(todayTodos).toHaveLength(1);
    expect(todayTodos[0].title).toBe("Today's task");
  });

  test("should retrieve todos due later", () => {
    const todos = todoList();

    todos.add({
      title: "Future task",
      dueDate: "2099-12-31",
      completed: false,
    });

    const laterTodos = todos.dueLater();

    expect(laterTodos).toHaveLength(1);
    expect(laterTodos[0].title).toBe("Future task");
  });

  test("should create a displayable todo list", () => {
    const todos = todoList();

    todos.add({
      title: "Pay rent",
      dueDate: "2020-01-01",
      completed: true,
    });

    const result = todos.toDisplayablelist(todos.all);

    expect(result).toBe("[x] Pay rent 2020-01-01");
  });
});

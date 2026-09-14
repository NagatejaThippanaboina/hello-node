const { todoList } = require("./todo");

const todos = todoList();

const formattedDate = (d) => {
  return d.toISOString().split("T")[0];
};

const dateToday = new Date();

const today = formattedDate(dateToday);

const yesterday = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() - 1)),
);

const tomorrow = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() + 1)),
);

todos.add({
  title: "Submit assignment",
  dueDate: yesterday,
  completed: false,
});

todos.add({
  title: "Pay rent",
  dueDate: today,
  completed: true,
});

todos.add({
  title: "Service Vehicle",
  dueDate: today,
  completed: false,
});

todos.add({
  title: "Pay electric bill",
  dueDate: tomorrow,
  completed: false,
});

console.log("My Todo-list\n\n");

console.log("Overdue");

const overdues = todos.overdue();
console.log(todos.toDisplayablelist(overdues));

console.log("\n\n");

console.log("Due Today");

const itemsDueToday = todos.dueToday();
console.log(todos.toDisplayablelist(itemsDueToday));

console.log("\n\n");

console.log("Due Later");

const itemsDueLater = todos.dueLater();
console.log(todos.toDisplayablelist(itemsDueLater));

console.log("\n\n");

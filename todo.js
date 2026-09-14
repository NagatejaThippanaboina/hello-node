const todoList = () => {
  const all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    const today = getToday();

    return all.filter((item) => item.dueDate < today);
  };

  const dueToday = () => {
    const today = getToday();

    return all.filter((item) => item.dueDate === today);
  };

  const dueLater = () => {
    const today = getToday();

    return all.filter((item) => item.dueDate > today);
  };

  const toDisplayablelist = (list) => {
    const today = getToday();

    return list
      .map((item) => {
        const checkbox = item.completed ? "[x]" : "[ ]";

        if (item.dueDate === today) {
          return `${checkbox} ${item.title}`;
        }

        return `${checkbox} ${item.title} ${item.dueDate}`;
      })
      .join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayablelist,
  };
};

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

module.exports = { todoList };

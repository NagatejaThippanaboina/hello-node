"use strict";

const { Model, Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static async addTask(params) {
      return await Todo.create(params);
    }

    static async showList() {
      console.log("My Todo-list\n");

      console.log("Overdue");

      const overdueItems = await Todo.overdue();

      overdueItems.forEach((todo) => {
        console.log(todo.displayableString());
      });

      console.log("\n");
      console.log("Due Today");

      const todayItems = await Todo.dueToday();

      todayItems.forEach((todo) => {
        console.log(todo.displayableString());
      });

      console.log("\n");
      console.log("Due Later");

      const laterItems = await Todo.dueLater();

      laterItems.forEach((todo) => {
        console.log(todo.displayableString());
      });
    }

    static async overdue() {
      const today = new Date().toISOString().split("T")[0];

      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueToday() {
      const today = new Date().toISOString().split("T")[0];

      return await Todo.findAll({
        where: {
          dueDate: today,
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueLater() {
      const today = new Date().toISOString().split("T")[0];

      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: today,
          },
        },
        order: [["id", "ASC"]],
      });
    }

    static async markAsComplete(id) {
      await Todo.update(
        {
          completed: true,
        },
        {
          where: {
            id,
          },
        },
      );
    }

    static associate(models) {
      // define association here
    }

    displayableString() {
      const checkbox = this.completed ? "[x]" : "[ ]";

      const today = new Date().toISOString().split("T")[0];

      if (this.dueDate === today) {
        return `${this.id}. ${checkbox} ${this.title}`;
      }

      return `${this.id}. ${checkbox} ${this.title} ${this.dueDate}`;
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );

  return Todo;
};

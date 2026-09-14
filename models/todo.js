const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static async findAllTodos() {
      return await this.findAll();
    }

    static async createTodo(title, dueDate, userId) {
      return await this.create({
        title,
        dueDate,
        completed: false,
        userId,
      });
    }

    async setCompletionStatus(completed) {
      this.completed = completed;

      await this.save();

      return this;
    }

    async deleteTodo() {
      await this.destroy();

      return true;
    }

    displayableString() {
      return `${this.title} - ${this.dueDate}`;
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,

        validate: {
          notEmpty: {
            msg: "Todo title cannot be empty.",
          },
        },
      },

      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,

        validate: {
          notEmpty: {
            msg: "Due date cannot be empty.",
          },
        },
      },

      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },

    {
      sequelize,
      modelName: "Todo",
    },
  );

  return Todo;
};

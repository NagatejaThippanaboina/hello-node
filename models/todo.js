const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Todo extends Model {
        static associate(models) {
            // No associations
        }

        static async findAllTodos() {
            return await this.findAll();
        }

        static async createTodo(title, dueDate) {
            return await this.create({
                title,
                dueDate,
                completed: false,
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
            },

            dueDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },

            completed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: "Todo",
        },
    );

    return Todo;
};
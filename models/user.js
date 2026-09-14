const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: "userId",
      });
    }

    async verifyPassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,

        validate: {
          notEmpty: {
            msg: "First name cannot be empty.",
          },
        },
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,

        validate: {
          notEmpty: {
            msg: "Email cannot be empty.",
          },

          isEmail: {
            msg: "Please provide a valid email address.",
          },
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,

        validate: {
          notEmpty: {
            msg: "Password cannot be empty.",
          },
        },
      },
    },

    {
      sequelize,
      modelName: "User",
    },
  );

  return User;
};

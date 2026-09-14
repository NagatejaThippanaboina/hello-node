const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const db = require("../../models");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },

    async (email, password, done) => {
      try {
        const user = await db.User.findOne({
          where: {
            email: email.trim(),
          },
        });

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password.",
          });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
          return done(null, false, {
            message: "Invalid email or password.",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// =========================
// SERIALIZE USER
// =========================

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// =========================
// DESERIALIZE USER
// =========================

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.User.findByPk(id);

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;

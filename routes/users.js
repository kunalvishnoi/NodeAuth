var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "./uploads" });
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var User = require("../models/users");
const { check, validationResult } = require("express-validator");

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.send("respond with a resource");
});

router.get("/login", function(req, res, next) {
  res.render("login");
});

router.get("/register", function(req, res, next) {
  res.render("register");
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new localStrategy(function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
      if (err) throw err;
      if (!user) {
        console.log("Unknown User");
        return done(null, false, { message: "Unknown User" });
      }

      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          console.log("Invalid Password");
          return done(null, false, { message: "Invalid Password" });
        }
      });
    });
  })
);

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login",
    failureFlash: "Invalid username or password.",
    successFlash: "Welcome!"
  }),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    console.log("authentication done");
    res.redirect("/" + req.user.username);
  }
);

router.post(
  "/register",
  upload.single("profileimage"),
  [
    check("name")
      .not()
      .isEmpty()
      .withMessage("Name is required"),
    check("email")
      .isEmail()
      .withMessage("Email is not Valid"),
    check("username")
      .not()
      .isEmpty()
      .withMessage("UserName is required"),
    check("password")
      .not()
      .isEmpty()
      .withMessage("Password is required"),
    check(
      "password2",
      "passwordConfirmation field must have the same value as the password field"
    )
      .exists()
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Password not Matched")
  ],
  (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    if (req.file) {
      var profileimage = req.file.filename;
    } else {
      var profileimage = "noimage.jpg";
    }
    const result = validationResult(req);
    const error = validationResult(req).array();
    const hasErrors = !result.isEmpty();
    if (hasErrors) {
      for (var i = 0; i < error.length; i++) console.log(error[i].msg);
      console.log(Array.isArray(error));
      res.render("register", { errors: error });
    } else {
      var newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
        profileimage: profileimage
      });

      User.createUser(newUser, (err, user) => {
        if (err) throw err;
        console.log(user, "register successfull");
      });
      req.flash("success", "You are now registered!");
      res.redirect("/");
    }

    // console.log(errors);
  }
);

router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "You are logged out");
  res.redirect("/users/login");
});

module.exports = router;

const express = require("express");
const router = express.Router();

//Insert Model
const User = require("../models/User");

//Insert User Controller
const UserController = require("../controllers/authController");

// User endpoints
router.get("/", UserController.getAllUsers);
router.post("/add", UserController.addUser);

module.exports = router;
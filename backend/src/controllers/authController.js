const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

//display users
const getAllUsers = async (req, res, next) => {

    let users;
    //Get all users from DB
    try {
        users = await User.find();
    } catch (err) {
        console.error(err);
        return next(new Error("Failed to fetch users"));
    }

    //not found
    if (!users){
        return res.status(404).json({ message: "No users found" });
    }

    //Display all users
    return res.status(200).json({users});
};

//Data insert un user
const addUser = async (req, res, next) => {
    const { name, email, phone, passwordHash } = req.body;

    let users;

    try {
        //Check if user already exists
        users = new User({
            name,
            email,
            phone,
            passwordHash
        });
        await users.save();
    } catch (err) {
        console.error(err);
        return next(new Error("Failed to create user"));
    }

    //not insert users
    if (!users) {
      return res.status(404).json({ message: "Unable to create user" });
    }

    //Display new user
    return res.status(200).json({users});
}

exports.getAllUsers = getAllUsers;
exports.addUser = addUser;
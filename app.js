require("dotenv").config();
require('./config/database').connect()
const express = require('express')
const bcrypt =  require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require("./model/user");
const auth = require("./middleware/auth");
const authLogout = require("./middleware/authLogout");
const cookieParser = require("cookie-parser");


const app = express(); 


app.use(cookieParser())

app.use(express.json());
app.get("/", (req, res)=>{
    res.send("<h1>Hello From auth system - LCO </h1>")
})

app.post("/register", async (req, res) => {
    try {
        const {firstname, lastname, email, password} = req.body;

        if (!(email && password && firstname && lastname)) {
            res.status(400).send('All fields are required')
        }
        const existingUser = await User.findOne({email: email});  //PROMISE ISSUE

        if(existingUser){
            res.status(401).send('User already exist');
        }

        const myEncPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstname,
            lastname,
            email: email.toLowerCase(),
            password : myEncPassword
        })
        //token 

        const token = jwt.sign(
            {user_id: user._id, email},
            process.env.SECRET_KEY,
            {
                expiresIn: "2h"
            }
        )
        user.token = token
        //update or not

        // : handle password situaution

        user.password = undefined;

        res.status(201).json(user)
    } catch (error) {
        console.log(error);
    }

})

app.post("/login", async (req, res)=>{
    try {
        const {email, password} = req.body
        if(!(email && password)){
            res.status(400).send("Field is missing")
        }
        
        const user = await User.findOne({email})
        // if(!user){
        //     res.status(400).send("You are not registered in our app")
        // }

        if(user && (await bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                {user_id: user._id, email},
                process.env.SECRET_KEY,
                {
                    expiresIn: "2h"
                }
            )

            user.token = token
            user.password = undefined
            // res.status(200).json(user)

            //if you want to use cookies
            const options = {
                expires: new Date(
                    Date.now() + 3 * 24 * 60 * 60 *1000
                ),
                httpOnly : true,
            };
            res.status(200).cookie('token', token, options).json({
                success: true,
                token,
                user
            }) 
        }

        res.status(400).send("email or password is incorrect")



    } catch (error) {
        console.log(error);
    }
})


app.get("/dashboard", auth,  (req, res)=>{
    res.send("<h1>Welcome to LCO Secret Dashboard</h1>")
})


app.get("/logout", authLogout, (req, res)=>{
    res.send("<h1> User Logged Out </h1>")
})
module.exports = app;
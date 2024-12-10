import bodyParser from "body-parser";
import express from "express";
import auth from "./routes/auth.js"

import play from "./routes/play.js"
import { config } from "dotenv";
import passport from "passport";
import session from "express-session";
const app = express()
const port = 3000;
 
app.use(
    session({
        secret: 'jesterkey',
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());


app.use(express.static("public"));
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/",auth);
app.use(play)

app.listen(port,()=>{
    console.log(`Listening on Port ${port}`);
})




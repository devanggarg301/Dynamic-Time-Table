const express = require('express');
const app = express();
const port = 8080;
const mysql = require('mysql2');
const methodOveride = require('method-override')
const path = require('path');
app.use(methodOveride("_method"));
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,"public")));

const connection = mysql.createConnection({
    host:'localhost',   
    user:'root',
    database:'timetable',
    password:'1234'
});

app.listen(port,()=>{
    console.log("Listening to port ",port);
})

app.get('/',(req,res)=>{
    res.render("land.ejs");
})

app.get('/login',(req,res)=>{
    res.render("login.ejs");
})

app.get('/signup',(req,res)=>{
    res.render("signup.ejs");
})
app.post('/page',(req,res)=>{
    let {username,password} = req.body;
    let q = `SELECT * FROM users WHERE username = ? AND password = ? `;
    try{
        connection.query(q,[username,password],(err,results)=>{
            if(err) throw err;
            else if(results.length>0){
                res.render(`page.ejs`,{username});
            }else{
                res.send("Invalid username or password");
            }
        })
    }catch(err){
        console.log(err);
        res.send("Some Error Occured, Try again later!");
    }
})

app.post('/signup',(req,res)=>{
    let {username,password} = req.body;
    let q1 = `SELECT * FROM users WHERE username = ?`;
    let q = `INSERT INTO users (username,password) VALUES (?,?)`;
    try{
        connection.query(q1,[username],(err,results)=>{
            if(results.length>0){
                return res.send("Username already exists");
            }
            connection.query(q,[username,password],(err,results)=>{
                if(err) throw err;
                res.redirect('/login');
            })
        })
    }catch(err){
        console.log(err);
        res.send("Some Error Occured, Try again later!");
    }
})
// app.get('/page',(req,res)=>{
//     res.render("page.ejs");
// })

app.get("/page", (req, res) => {
    let today = new Date().toLocaleString("en-US", { weekday: "long" });

    let q = `
        SELECT start_time, end_time, subject, room, teacher 
        FROM timetable 
        WHERE day = ? 
        ORDER BY start_time;
    `;

    connection.query(q, [today], (err, results) => {
        if (err) {
            console.error(err);
        } else {
            res.render("page.ejs", { todayTimetable: results });
        }
    });
});




app.get('/announcement',(req,res)=>{
    let q = `SELECT * FROM announcement`;
    connection.query(q,(err,results)=>{
        if(err){
            res.send("Some error");
        }
        let post = results;
        res.render("announcement.ejs",{post});
    })
})
app.get('/timetable',(req,res)=>{
    res.render("timetable.ejs");
})

app.get("/announcement/add",(req,res)=>{
    res.render('newannouncement.ejs');
})
app.post("/announcement/add",(req,res)=>{
    let {title,message} = req.body;
    let q = `INSERT INTO announcement (title,message) VALUES (?,?)`;
    try{
            connection.query(q,[title,message],(err,results)=>{
                if(err) throw err;
                res.redirect('/announcement');
            })
        
    }catch(err){
        console.log(err);
        res.send("Some Error Occured, Try again later!");
    }
})

app.delete("/announcement/:id",(req,res)=>{
    let {id} = req.params;
    let q = `DELETE FROM announcement WHERE id = ?`;
    connection.query(q,[id],(err,results)=>{
        if(err){
            res.send("Some error occured");
        }
        res.redirect("/announcement");
    })
})

app.get("/timetable/1/cse/B",(req,res)=>{
    res.render("timetable1cseb.ejs");
})
app.get("/timetable/1/csd/NA",(req,res)=>{
    res.render("timetable1csds.ejs");
})
app.get("/timetable/1/csg/NA",(req,res)=>{
    res.render("timetable1csg.ejs");
})
app.get("/timetable/1/ece/B",(req,res)=>{
    res.render("timetable1eceb.ejs");
})
app.get("/timetable/1/iot/NA",(req,res)=>{
    res.render("timetable1iot.ejs");
})
app.get('/notifications',(req,res)=>{
    res.render("notifications.ejs");
})
app.get('/settings',(req,res)=>{
    res.render("settings.ejs");
})


app.get("/timetable/:year/:branch/:section", (req, res) => {
    const { year, branch, section } = req.params;
    let q = `
        SELECT day, TIME_FORMAT(start_time, '%H:%i:%s') AS start_time, 
                     TIME_FORMAT(end_time, '%H:%i:%s') AS end_time, subject 
        FROM timetable 
        WHERE year = ? AND branch = ? AND section = ? 
        ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), start_time;
    `;

    connection.query(q, [year, branch, section], (err, results) => {
        if (err) {
            return res.send("Error fetching timetable");
        }

        let structuredTimetable = {};

        results.forEach(row => {
            if (!structuredTimetable[row.day]) {
                structuredTimetable[row.day] = {};
            }
            
            let timeSlot = `${row.start_time}-${row.end_time}`;
            structuredTimetable[row.day][timeSlot] = row.subject;
        });
        let headingText = `${year} Year - ${branch.toUpperCase()} - Section ${section.toUpperCase()} Timetable`;
        res.render("time_table.ejs", { timetable: structuredTimetable,headingText });
    });
});
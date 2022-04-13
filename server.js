const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const db = require("./database")
// Require minimist module
const args = require('minimist')(process.argv.slice(2))
// See what is stored in the object produced by minimist
console.log(args)
// Store help text 

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

const port = (args.port >= 1 && args.port <= 65535) ? args.port : 5555

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Start server
const server = app.listen(port, () => {
    console.log('App is running on port %PORT%'.replace('%PORT%',port))
})

if (args.log == 'false') {
    console.log("Not creating a new access.log")
} else {
    // Use morgan for logging to files
    // Create a write stream to append (flags: 'a') to a file
    const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a' })
        // Set up the access logging middleware
    app.use(morgan('combined', { stream: WRITESTREAM }))
}

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr,remoteuser,time,method,url,protocol,httpversion,status,referer,useragent) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const info = stmt.run(logdata.remoteaddr,logdata.remoteuser, logdata.time, logdata.method,logdata.url,logdata.protocol,logdata.httpversion, logdata.status,logdata.referer, logdata.useragent)

    next()
    })

if (args.debug == 'true') {
    app.get("/app/log/access", (req, res) => {
        try {
            const stmt = db.prepare('SELECT * FROM accesslog').all()
            res.status(200).json(stmt)
        } catch (e) {
            console.error(e)
        }

})
    app.get('/app/error', (req, res) => {
        throw new Error("Error test successful.")
})
}

// coin functions
function coinFlip() {
    var ran = Math.random();
    if (ran < 0.5) {
        return "heads";
    }
    else {
        return "tails";
    }
}

function coinFlips(flips) {
    if (flips < 0 || flips == '' || flips == null) {
        console.log('Error: no input');
    } else {
        var list = [];
        for(var i = 0; i < flips; i++) {
        list.push(coinFlip());
        }
        return list;
        }
}

function countFlips(array) {
    var heads = 0;
    var tails = 0;
    for(var i = 0; array.length > i; i++) {
        if (array[i] == "heads") {
            heads++;
        }
    else {
            tails++
        }
}
return {'heads' : heads, 'tails' : tails}
}


function flipACoin(call) {
    var flip = coinFlip();
    var result = ""
    if (call == flip) {
        result = "win"
    }
    else {
        result = "lose"
        }
    return {"call": call, "flip": flip, "result": result};
}

// API calls

app.get('/app/flip/', (req, res) => {
    const flip = coinFlip()
    res.status(200).json({"flip" : flip})
  });
  
app.get('/app/flips/:number', (req, res) => {
    let flips = coinFlips(req.params.number)
    let final = countFlips(flips)
    res.status(200).json({ 'raw' : flips, 'summary' : final})
});
  
app.get('/app/flip/call/tails', (req, res) => {
    const resultFlip = flipACoin('tails')
    res.status(200).json({ 'call' : resultFlip.call, 'flip': resultFlip.flip, 'result': resultFlip.result})
});
  
app.get('/app/flip/call/heads', (req, res) => {
    const resultFlip = flipACoin('heads')
    res.status(200).json({ 'call' : resultFlip.call, 'flip': resultFlip.flip, 'result': resultFlip.result})
});

// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});
  
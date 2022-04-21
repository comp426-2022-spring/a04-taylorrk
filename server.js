const fs = require('fs')
const morgan = require('morgan')

const express = require('express')

const app = express()
const args = require('minimist')(process.argv.slice(2))

// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(`
    server.js [options]
    --port, -p	Set the port number for the server to listen on. Must be an integer
                between 1 and 65535.
    --debug, -d If set to true, creates endlpoints /app/log/access/ which returns
                a JSON access log from the database and /app/error which throws 
                an error with the message "Error test successful." Defaults to 
                false.
    --log		If set to false, no log files are written. Defaults to true.
                Logs are always written to database.
    --help, -h	Return this message and exit.
    `)
    process.exit(0)
}

const db = require('./database.js')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const port = args.port ||  5555

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`)
});

if (args.log == 'false') {
    console.log("I'm not creating shit here")

} else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    next();
})
app.get("/app", (req, res, next) => {
	res.status(200).send("Your API works! (200)");
});

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = db.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}

app.use(function(req, res) {
    res.status(404).send("404 NOT FOUND")
    res.type("text/plain")  
})



function coinFlips(flips) {
    var coinArray = new Array()
    for (let i=0; i < flips; i++) {
      coinArray[i] = coinFlip()
    }
  
    return coinArray 
  }
  
  function coinFlip() {
      let randomNum = Math.random()
      if (randomNum < .5){
        return "tails"
      } else{
        return "heads"
      }
    }
  
    
  
    function countFlips(myArray) {
      var headCount = 0
      var tailCount = 0
      for (let i=0; i<myArray.length; i++) {
        if (myArray[i] == 'heads') {
          headCount = headCount + 1
        } else {
          tailCount = tailCount + 1
        }
      }
      /*if (headCount ==0) {
        return "{ tails: " + tailCount + " }"
      }
      if (tailCount ==0) {
        return "{ heads: " + headCount + " }"
      }*/
      let results = {
        tails: tailCount,
        heads: headCount
      }
      return results
    }
  

  
  app.get('/app/flip', (req, res)  => {
      res.status(200).json({'flip' : coinFlip()})
  })
  
  // need to return game as from screenshot
  app.get('/app/flip/call/heads', (req, res)  => {
    var flip = coinFlip()
    if (flip == "heads") {
      result = "win"
    } else {
      result = "lose"
    }
    res.status(200).json({'call':'heads', 'flip':flip, 'result':result})
  })
  // test
  app.get('/app/flip/call/tails', (req, res)  => {
    var flip = coinFlip()
    if (flip == "tails") {
      result = "win"
    } else {
      result = "lose"
    }
    res.status(200).json({'call':'tails', 'flip':flip, 'result':result})
  })
  // making sure I committed right
  
  
  
  
  app.get('/app/echo/:repeat', (req, res) => {
      res.status(200).json({'message': req.params.repeat})
  })
  
  app.get('/app/flips/:number', (req, res) => {
    var coinArray = coinFlips(req.params.number)
    var mySummary = countFlips(coinArray)
    res.status(200).json({'raw': coinArray, "summary": mySummary})
  })
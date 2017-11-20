var tress = require('tress'); // Asynchronous job queue with concurrency
var needle = require('needle'); // HTTP client
var log = require('cllc')(); // Simple logger and counter for console
var sqlite3 = require("sqlite3").verbose(); // SQLite3 bindings

const CONCURENCY = -100;  // 100 ms delay between jobs
const X_START = -90;
const X_END = 40;
const Y_START = -95;
const Y_END = 50;
const DIRECTIONS = ['right', 'left', 'top', 'bottom'];

var results = [];
var jobs_done = 0;

// Function for processing response data domehow
function process_response(body) {
    results.push(body);
}

// Create and configure job queue
var q = tress(function(job, done_callback) { // worker
    url = 'http://dofus-map.com/huntTool/getData.php?x='+job.x+'&y='+job.y+'&direction='+job.di+'&world=0&language=en'
    needle.get(url, function(err, response){
        if (err) throw err;
        if (response.statusCode == 200) {
            process_response(response.body);
            if (jobs_done % 10 == 0) {
                console.log(jobs_done + ' jobs done');
            }
            jobs_done++;
            //log.step();
            done_callback(); // must call that callback when job finished
        }
    });
}, CONCURENCY);

q.drain = function() {
    //require('fs').writeFileSync('./data.json', JSON.stringify(results, null, 0));

    var db = new sqlite3.Database("data.sqlite"); // Open a database handle
    db.serialize(function() {

        db.run('DROP TABLE IF EXISTS data');
        db.run('CREATE TABLE data(json_object TEXT)');
        var statement = db.prepare("INSERT INTO data VALUES (?)");
        for (var i = 0; i < results.length; i++) {
            statement.run(JSON.stringify(results[i], null, 0));
        }
        statement.finalize();
        db.close();
    });

    //log.finish();
    //log('Finished');
    console.log('Finished');
}

q.error = function(err) {
    log.e('Job ' + this + ' failed with error ' + err);
};

//process.exit(0);

// Here we go
//log('Start');
console.log('Start');
var jobs_n = (X_END - X_START + 1) * (Y_END - Y_START + 1) * DIRECTIONS.length;
//log.start('job %s of ' + jobs_n);
// Push jobs to queue and... wait until all well be done
for (var x = X_START; x <= X_END; x++) {
    for (var y = Y_START; y <= Y_END; y++) {
        for (var di = 0; di < DIRECTIONS.length; di++) {
            q.push({x:x, y:y, di:DIRECTIONS[di]});
        }
    }
}

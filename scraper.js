var tress = require('tress'); // Asynchronous job queue with concurrency
var needle = require('needle'); // HTTP client
var log = require('cllc')(); // Simple logger and counter for console

const CONCURENCY = -100;
const X_START = -100;
const X_END = 100;
const Y_START = -100;
const Y_END = 100;
const DIRECTIONS = ['right', 'left', 'top', 'bottom'];

var results = [];

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
            log.step();
            done_callback(); // must call that callback when job finished
        }
    });
}, CONCURENCY);

q.drain = function() {
    require('fs').writeFileSync('./data.json', JSON.stringify(results, null, 0));
    log.finish();
    log('Finished');
}

q.error = function(err) {
    log.e('Job ' + this + ' failed with error ' + err);
};

//process.exit(0);

// Here we go
log('Start');
var jobs_n = (X_END - X_START + 1) * (Y_END - Y_START + 1) * DIRECTIONS.length;
log.start('job %s of ' + jobs_n);
// Push jobs to queue and... wait until all well be done
for (var x = X_START; x <= X_END; x++) {
    for (var y = Y_START; y <= Y_END; y++) {
        for (var di = 0; di < DIRECTIONS.length; di++) {
            q.push({x:x, y:y, di:DIRECTIONS[di]});
        }
    }
}

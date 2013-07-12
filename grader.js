#! /usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function( infile ) {
    var instr = infile.toString();
    if ( !fs.existsSync(instr) ) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); 
    }
    return instr;
};

var cheerioHtmlFile = function( htmlfile ) {
    return cheerio.load(fs.readFileSync( htmlfile ));
};

var loadChecks = function( checksfile ) {
    return JSON.parse(fs.readFileSync( checksfile ));
};

var checkHtmlFile = function( htmlfile, checksfile ) {
    $ = cheerioHtmlFile( htmlfile );
    var checks = loadChecks( checksfile ).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

// hack
var clone = function( fn ) {
    return fn.bind({});
};

var checkURL = function( url, checksfile ) {
    rest.get(url).on('complete', function( result, response ) {
        if (result instanceof Error) {
            console.error("Url %s no good!", url);
        } else {
           $ = cheerio.load(result); 
           var checks = loadChecks( checksfile ).sort();
           var out = {};
           for (var ii in checks) {
               var present = $(checks[ii]).length > 0;
               out[checks[ii]] = present;
            }
            var outJson = JSON.stringify( out, null, 4 );
            console.log(outJson);
        }
    });
};


if ( require.main == module ) {
    program
        .option( '-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT )
        .option( '-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT )
        .option('-u, --url <url_link>', 'URL to Check')
        .parse( process.argv );
    if ( !program.url ) {
        // we have a file
        var checkJson = checkHtmlFile( program.file, program.checks );
        var outJson = JSON.stringify( checkJson, null, 4 );
        console.log(outJson);
    } else {
        checkURL( program.url, program.checks );
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkURL = checkURL;
}



// Requirements
var util = require('util'),
    fs = require('fs'),
    less = require('less'),
    glob = require('glob')
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify;

// Config options
var CSS_FILES = {
        input: 'styles.less',
        path: './css/',
        output: './css/main.css',
        compress: true
    },
    JS_FILES = {
        input: [
            'js/html5shiv.js',
            'js/zepto.js',
            'js/scripts.js'
        ],
        output: './js/main.js',
        compress: true
    };

desc('This is the default task');
task('default', function () {
    util.puts('This is the default task');
});

var buildLess = function () {
    var parser = new(less.Parser)({
        paths: [CSS_FILES.path]
    });

    // Parse LESS files
    buildLessFile(parser, CSS_FILES.path + CSS_FILES.input, CSS_FILES.output);
};

var buildLessFile = function(parser, lessFile, cssFile, callback) {
    fs.readFile(lessFile, 'utf-8', function (err, data) {
        if (err) {
            console.log(err);
        } else {
            parser.parse(data, function (e, tree) {
                if (e) {
                    console.log(e);
                } else {
                    try {
                        fs.writeFile(cssFile, tree.toCSS({compress: CSS_FILES.compress}), 'utf-8', function (err) {
                            if (err) throw err;
                            util.puts('Less files built to -> ' + cssFile);
                            
                            if(callback) callback.call(this);
                        });
                    } catch (err) {
                        console.log('\033[31mError: ' + err.message);
                        console.log('\033[31mFile: ' + err.filename);
                        console.log('\033[31mLine: ' + err.line);
                        console.log('\033[31mExtract: ' + err.extract[0] + '\033[0m');
                    }
                }
            });
        }
    });
};

var buildScripts = function (buildObject) {
    var contents = [],
        writeContents = function () {
            var output = '(function () {\n' + contents.join('') + '\n})();';
            if (JS_FILES.compress === true) {
                var ast = jsp.parse(output);
                ast = pro.ast_mangle(ast);
                ast = pro.ast_squeeze(ast);
                output = pro.gen_code(ast);
            }
            fs.writeFile(buildObject.output, output, 'utf-8', function (err) {
                if (err) throw err;
                util.puts('Scripts built to -> ' + buildObject.output);
            });
        };

    buildObject.input.forEach(function (filePath, i) {
        fs.readFile('./' + filePath, 'utf-8', function (err, data) {
            if (err) throw err;
            contents[i] = data;

            if (contents.length === buildObject.input.length) {
                writeContents();
            }
        });
    });
};

desc('This builds the less files.');
task('build', function () {
    buildLess();
    buildScripts(JS_FILES);
});

desc('This watches the less files and builds them when a change is made.');
task('watch', function () {
    var files = glob.sync(CSS_FILES.path + '**/*.less');
    util.puts('Now watching less files for changes');
    files.forEach(function (file) {
        fs.watchFile(file, {interval: 50}, function(prev, curr) {
            if(+prev.mtime !== +curr.mtime) {
                buildLess();
            }
        });
    });

    util.puts('Now watching script files for changes.');
	JS_FILES.input.forEach(function (file) {
		fs.watchFile('./' + file, {interval: 50}, function (prev, curr) {
			if (+prev.mtime !== +curr.mtime) {
				util.log('Change detected in ' + file);
				buildScripts(JS_FILES);
			}
		});
	});
});

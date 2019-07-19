var express = require('express');
var app = express();
var crawler = require('crawler-request');
var $ = require('cheerio');
var rp = require('request-promise');
var fs = require('fs');
var spawn = require("child_process").spawn;
var router = express.Router();
var port = process.env.PORT || 7777;
all_text = []
router.get('/', function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	if (req.query.choice == 'run_word2vec') {
		var process = spawn('python', ["bridge_point.py", req.query.function_choice]);
		process.stdout.once('data', function(data) {
			console.log(req.query)
			res.json({
				"response": data.toString('utf8')
			})
			fs.appendFileSync("logs/py_log.log", data)
		});
		process.stderr.once('data', function(err) {
			res.json({
				"error": err.toString('utf8')
			});
			fs.appendFileSync("logs/py_log.log", err)
		})
	}
	if (req.query.choice == 'scrape_arxiv') {
		var options = {
			uri: 'https://arxiv.org/list/stat.ML/recent',
			headers: {
				'User-Agent': 'Request-Promise'
			}
		}
		rp(options).then(function(html) {
			outer = []
			$(".list-identifier a", html).each(function(k, v) {
				inner = {}
				if ($(this).attr('href').includes('pdf')) {
					inner.url = "https://arxiv.org" + $(this).attr('href') + ".pdf"
				}
				outer.push(inner)
			})
			outer_cleaned = outer.filter(value => Object.keys(value).length !== 0);
			return (outer_cleaned)
		}).then(function(outer_cleaned) {
			outer_cleaned.forEach(function(url_obj, index) {
				crawler(url_obj.url).then(function(response) {
					all_text.push(response.text) //replace(/[^a-zA-Z ]/g, " ")
				}).catch(function(err) {
					console.log('err1 ' + err)
				})
			})
		}).catch(function() {})
		call_once_satisfied({
			"condition": "all_text.length == 25",
			"function": function() {
				fs.writeFile("data/all_text.txt", all_text.join(' '), function(err) {
					if (err) {
						return console.log(err);
					}
					console.log("The file was saved!");
				});
			}
		})
	}
})

function call_callback(cb) {
	cb
}

function call_once_satisfied(props) {
	if (eval(props['condition'])) {
		if (typeof(props.function) == 'function') {
			call_callback(props.function())
		} else {
			eval(props['function'])
		}
	} else {
		setTimeout(function() {
			call_once_satisfied(props)
		}, 100)
	}
}
app.use('/api', router);
app.listen(port);
console.log('Running Python backbone API on port: ' + port);
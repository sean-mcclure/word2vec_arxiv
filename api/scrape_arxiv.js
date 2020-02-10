var express = require('express');
var app = express();
var crawler = require('crawler-request');
var $ = require('cheerio');
var rp = require('request-promise');
var fs = require('fs');
var spawn = require("child_process").spawn;
var router = express.Router();
var port = process.env.PORT || 7777;
outer_cleaned = new Array(50)
all_text = {}
stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']

function remove_stopwords(str) {
    res = []
    words = str.split(' ')
    for (i = 0; i < words.length; i++) {
        if (!stopwords.includes(words[i])) {
            res.push(words[i])
        }
    }
    return (res.join(' '))
}
router.get('/', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.query.choice == 'run_doc_or_word2vec') {
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
        console.log('scraping arXiv at: ' + req.query.arxiv_url)
        var options = {
            uri: req.query.arxiv_url,
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
                    all_text['doc' + index] = response.text.split(' ')
                }).catch(function(err) {
                    console.log('err1 ' + err)
                })
            })
        }).catch(function() {})
        call_once_satisfied({
            "condition": "Object.keys(all_text).length == outer_cleaned.length",
            "function": function() {
                fs.writeFile(req.query.filename, JSON.stringify(all_text), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("arxiv scrape saved!");
                    outer_cleaned = new Array(50)
                    all_text = {}
                });
                res.json({
                    "response": "finished scraping",
                    "scraped_urls": outer_cleaned
                })
            }
        })
    }
    if (req.query.choice == 'scrape_single_paper') {
        console.log('scraping single arXiv paper at: ' + req.query.single_url)
        all_text_single = new Array(0)
        crawler(req.query.single_url).then(function(response) {
            all_text_single.push(response.text)
        }).catch(function(err) {
            console.log('err1 ' + err)
        })
        call_once_satisfied({
            "condition": "all_text_single.length > 0",
            "function": function() {
                words_lower = all_text_single.map(v => v.toLowerCase())
                no_specials = words_lower.join(' ').replace(/[^a-zA-Z ]/g, "")
                no_stops = remove_stopwords(no_specials)
                fs.writeFile(req.query.filename, JSON.stringify(no_stops), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("arxiv single scrape saved!");
                })
                res.json({
                    "response": "finished scraping single"
                })
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
console.log('Running arXiv Discovery Tool on port: ' + port);
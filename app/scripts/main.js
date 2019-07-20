function parse_arxiv_pdf(options) {
	params = {
		"choice": "scrape_arxiv",
		"arxiv_url" : options.arxiv_url,
		"filename" : options.filename
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": "az.hold_value.pdf_parser_results = data['response']",
		"fail": "alert('Could not connect to the server.')"
	})
}

function run_word2vec() {
	params = {
		"choice": "run_word2vec",
		"function_choice": "word2vec()"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": "az.hold_value.pdf_parser_results = data['response']",
		"fail": "alert('Could not connect to the server.')"
	})
}
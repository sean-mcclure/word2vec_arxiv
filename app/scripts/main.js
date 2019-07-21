function parse_arxiv_pdf() {
	params = {
		"choice": "scrape_arxiv",
		"arxiv_url": az.hold_value.chosen1_value,
		"filename": "data/domain_1.txt"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": "az.hold_value.pdf_parser_results = data['response']",
		"fail": "alert('Could not connect to the server.')"
	})
	az.add_spinner({
		"this_class": "scraping_spinner",
		"condition": "az.hold_value.pdf_parser_results == 'finished scraping'"
	})
	az.call_once_satisfied({
		"condition": "az.hold_value.pdf_parser_results == 'finished scraping'",
		"function": function() {
			az.hold_value.pdf_parser_results = ''
			params = {
				"choice": "scrape_arxiv",
				"arxiv_url": az.hold_value.chosen2_value,
				"filename": "data/domain_2.txt"
			}
			az.call_api({
				"url": "http://localhost:7777/api/",
				"parameters": params,
				"done": "az.hold_value.pdf_parser_results = data['response']",
				"fail": "alert('Could not connect to the server.')"
			})
			az.add_spinner({
				"this_class": "scraping_spinner2",
				"condition": "az.hold_value.pdf_parser_results == 'finished scraping'"
			})
			az.call_once_satisfied({
				"condition": "az.hold_value.pdf_parser_results == 'finished scraping'",
				"function": function() {
					az.hold_value.pdf_parser_results = ''
					$("select").each(function() { this.selectedIndex = 0 })
					run_word2vec()
				}
			})
		}
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
		"done": "az.hold_value.word2vec_results = data['response']",
		"fail": "alert('Could not connect to the server.')"
	})
}
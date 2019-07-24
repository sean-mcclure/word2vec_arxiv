function parse_arxiv_pdf() {
	params = {
		"choice": "scrape_arxiv",
		"arxiv_url": az.hold_value.chosen1_value,
		"filename": "data/domain_1.json"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": "az.hold_value.pdf_parser_results = data['response']; az.hold_value.scraped_urls = data['scraped_urls']",
		"fail": "alert('Could not connect to the server.')"
	})
	az.add_spinner({
		"this_class": "scraping_spinner",
		"condition": "typeof(az.hold_value.word2vec_results) !== 'undefined'"
	})
	az.style_spinner('scraping_spinner', 1, {
		"section_color": "#b31b1a",
		"background": "rgba(47, 179, 79, 0.7)"
	})
	az.call_once_satisfied({
		"condition": "az.hold_value.pdf_parser_results == 'finished scraping'",
		"function": function() {
			az.hold_value.pdf_parser_results = ''
			//run_word2vec(az.grab_value('search_term', 1))
			run_doc2vec(az.grab_value('search_term', 1))
			az.all_style_dropdown('domain1_dropdown', {
				"pointer-events": "auto",
				"opacity": 1
			})
			az.all_remove_element('domain_chosen')
			az.add_value('search_term', 1, {
				"value": ""
			})
			az.empty_contents('hold_searching_text', 1)
			setTimeout(function() {
				$("select").each(function() {
					this.selectedIndex = 0
				})
			}, 300)
			az.hold_value.chosen1_text = undefined
			az.call_once_satisfied({
				"condition": "typeof(az.hold_value.word2vec_results)  !== 'undefined'",
				"function": function() {
					az.add_text('hold_searching_text', 1, {
						"this_class": "show_wordvec_results",
						"text": az.hold_value.word2vec_results
					})
					az.hold_value.doc2vec_results_obj = JSON.parse(az.hold_value.word2vec_results.split("'").join('"'))
					closet_obj = az.hold_value.doc2vec_results_obj.filter(function(value, index) {
						return value.distance === Math.max.apply(null, az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance'))
					})
					az.style_text('show_wordvec_results', 1, {
						"width": "300px",
						"background": "#b31b1a",
						"border-radius": "4px",
						"padding": "5px",
						"color": "white"
					})
					$('.top_article_frame').attr('src', az.hold_value.scraped_urls[closet_obj[0].index].url)
					az.post_message_to_frame('top_article_force_diagram', 1, {
						"function": function() {
							main.redefine('data', parent.create_d3_data_b())
						}
					})
				}
			})
		}
	})
}

function run_word2vec(search_term) {
	params = {
		"choice": "run_doc_or_word2vec",
		"function_choice": "word2vec('" + search_term + "')"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": function(data) {
			az.hold_value.word2vec_results = data['response']
			setTimeout(function() {
				az.hold_value.word2vec_results = undefined
			}, 2000)
		},
		"fail": "alert('Could not connect to the server.')"
	})
}

function run_doc2vec(search_term) {
	params = {
		"choice": "run_doc_or_word2vec",
		"function_choice": "doc2vec('" + search_term + "')"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": function(data) {
			az.hold_value.word2vec_results = data['response']
			setTimeout(function() {
				az.hold_value.word2vec_results = undefined
			}, 2000)
		},
		"fail": "alert('Could not connect to the server.')"
	})
}
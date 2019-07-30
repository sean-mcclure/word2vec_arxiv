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
		"condition": "typeof(az.hold_value.doc2vec_results) !== 'undefined'"
	})
	az.style_spinner('scraping_spinner', 1, {
		"section_color": "#b31b1a",
		"background": "rgba(47, 179, 79, 0.7)"
	})
	pop_search_info("Domain: " + az.hold_value.chosen1_text + "<br>Terms: " + az.grab_value('search_term', 1))
	az.call_once_satisfied({
		"condition": "az.hold_value.pdf_parser_results == 'finished scraping'",
		"function": function() {
			az.hold_value.pdf_parser_results = ''
			az.hold_value.search_term = az.grab_value('search_term', 1)
			run_doc2vec(az.hold_value.search_term)
			az.all_style_dropdown('domain1_dropdown', {
				"pointer-events": "auto",
				"opacity": 1
			})
			az.all_remove_element('domain_chosen')
			az.add_value('search_term', 1, {
				"value": ""
			})
			setTimeout(function() {
				$("select").each(function() {
					this.selectedIndex = 0
				})
			}, 300)
			az.call_once_satisfied({
				"condition": "typeof(az.hold_value.doc2vec_results)  !== 'undefined'",
				"function": function() {
					console.log('doc2vec_results: ' + az.hold_value.doc2vec_results)
					az.all_remove_element('view_doc_buttons')
					az.hold_value.doc2vec_results_obj = JSON.parse(az.hold_value.doc2vec_results.split("'").join('"'))
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
					az.post_message_to_frame('top_article_barchart', 1, {
						"function": function() {
							main.redefine('data', parent.get_doc_data())
						}
					})
					az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj.slice(0, 5), 'index').forEach(function(value, index) {
						az.add_button('hold_elements_cells', 6, {
							"this_class": "view_doc_buttons",
							"text": "DOC " + value
						})
						az.all_style_button('view_doc_buttons', {
							"background": "whitesmoke",
							"border": "1px solid black",
							"margin-top": "60px",
							"margin-left": "5px",
							"color": "black",
							"outline": 0
						})
					})
					az.all_add_event('view_doc_buttons', {
						"type": "click",
						"function": function(this_id) {
							az.all_style_button('view_doc_buttons', {
								"background": "whitesmoke",
								"color": "black"
							})
							az.style_button('view_doc_buttons', az.get_target_instance(this_id), {
								"background": "#b31b1a",
								"color": "white"
							})
							az.hold_value.most_recent_url = az.hold_value.scraped_urls[az.hold_value.doc2vec_results_obj[az.get_target_instance(this_id) - 1].index].url
							$('.top_article_frame').prop('src', az.hold_value.most_recent_url)
							az.add_spinner({
								"this_class": "view_doc_spinner",
								"duration": 2000
							})
							az.style_spinner('view_doc_spinner', 1, {
								"section_color": "#b31b1a",
								"background": "rgba(47, 179, 79, 0.7)"
							})
							az.post_message_to_frame('top_article_barchart', 2, {
							    "function" : function() {
							        main.redefine('data', [{"name":"DOC 1","percent":0,"value":0},{"name":"DOC 2","percent":0,"value":0},{"name":"DOC 3","percent":0,"value":0},{"name":"DOC 4","percent":0,"value":0},{"name":"DOC 5","percent":0,"value":0}])
							    }
							})
						}
					})
					setTimeout(function() {
						az.click_element('view_doc_buttons', 1)
					}, 1000)
				}
			})
		}
	})
}

function parse_arxiv_single_paper() {
	params = {
		"choice": "scrape_single_paper",
		"single_url": az.hold_value.most_recent_url,
		"filename": "data/domain_1_single.txt"
	}
	az.call_api({
		"url": "http://localhost:7777/api/",
		"parameters": params,
		"done": function(data) {
			az.hold_value.pdf_parser_single_result = data['response']
		},
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
		"condition": "az.hold_value.pdf_parser_single_result == 'finished scraping single'",
		"function": function() {
			az.hold_value.pdf_parser_single_result = ''
			run_word2vec(az.hold_value.search_term)
			az.call_once_satisfied({
				"condition": "typeof(az.hold_value.word2vec_results)  !== 'undefined'",
				"function": function() {
					console.log('word2vec_results: ' + az.hold_value.word2vec_results)
					az.hold_value.word2vec_results_obj = JSON.parse(az.hold_value.word2vec_results.split("'").join('"'))
					az.post_message_to_frame('top_article_barchart', 2, {
						"function": function() {
							main.redefine('data', parent.get_word_data())
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
			az.hold_value.doc2vec_results = data['response']
			setTimeout(function() {
				az.hold_value.doc2vec_results = undefined
			}, 2000)
		},
		"fail": "alert('Could not connect to the server.')"
	})
}

function pop_search_info(msg) {
	az.all_remove_element('hold_pop')
	az.add_html('main_section', 1, {
		"html": "<div class='hold_pop'></div>"
	})
	az.style_html('hold_pop', 1, {
		"width": "auto",
		"height": "auto",
		"background": "#b31b1a",
		"position": "fixed",
		"padding": "10px",
		"top": 100,
		"left": 0,
		"border": "1px solid darkgrey",
		"box-shadow": "2px 2px 6px white",
		"border-radius": "4px"
	})
	az.add_text('hold_pop', 1, {
		"this_class": "hold_pop_msg",
		"text": msg
	})
	az.style_text('hold_pop_msg', 1, {
		"color": "white",
		"font-size": "18px",
		"align": "center"
	})
	az.style_word('hold_pop_msg', 1, {
		"this_class": "yellow_word_pop",
		"word": "Domain",
		"color": "yellow"
	})
	az.style_word('hold_pop_msg', 1, {
		"this_class": "yellow_word_pop2",
		"word": "Terms",
		"color": "yellow"
	})
}
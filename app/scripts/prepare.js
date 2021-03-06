az.call_once_satisfied({
	"condition": "typeof(add_dropdowns) == 'function' && typeof(parse_arxiv_pdf ) == 'function'",
	"function": function() {
		az.load_font('Anton')
		az.style_body({
			"background": "#64E8E8",
			"font-family": "Anton",
			"min-width" : "1200px",
			"max-width" : "1400px"
		})
		az.add_sections({
			"this_class": "main_section",
			"sections": 1
		})
		az.style_sections('main_section', 1, {
			"background": "#1ab2b3",
			"height": "auto",
			"width": "90%",
			"padding-top": "10px"
		})
		az.add_layout('main_section', 1, {
			"this_class": "hold_elements",
			"row_class": "hold_elements_rows",
			"cell_class": "hold_elements_cells",
			"number_of_rows": 10,
			"number_of_columns": 2
		})
		az.style_layout('hold_elements', 1, {
			"margin-bottom": "-10px",
			"border": 0
		})
		az.style_layout('hold_elements_cells', 1, {
			"colspan": 2
		})
		az.style_layout('hold_elements_cells', 3, {
			"rowspan": 2
		})
		az.all_style_layout('hold_elements_cells', {
			"halign": "center"
		})
		az.add_image('hold_elements_cells', 1, {
			"this_class": "logo",
			"image_path": "https://pbs.twimg.com/profile_images/958432197987401728/QLeEVLC__400x400.jpg"
		})
		az.style_image('logo', 1, {
			"align": "center",
			"width": "100px"
		})
		az.add_text('hold_elements_cells', 1, {
			"this_class": "choose_title",
			"text": "DISCOVERY TOOL"
		})
		az.style_text('choose_title', 1, {
			"font-style": "italic",
			"font-size": "140px"
		})
		az.style_text('choose_title', 1, {
			"margin-top": "-30px",
			"margin-bottom": "30px",
			"color": "yellow"
		})
		az.add_text('hold_elements_cells', 2, {
			"this_class": "choose_title",
			"text": "1&nbsp;CHOOSE DOMAIN"
		})
		az.add_text('hold_elements_cells', 4, {
			"this_class": "choose_title",
			"text": "2&nbsp;SEARCH FOR DOCUMENTS"
		})
		az.style_text('choose_title', 3, {
			"margin-top": "30px"
		})
		az.add_text('hold_elements_cells', 6, {
			"this_class": "choose_title",
			"text": "3&nbsp;VIEW DOCUMENTS"
		})
		az.add_text('hold_elements_cells', 7, {
			"this_class": "choose_title",
			"text": "4&nbsp;FIND CLOSEST WORDS TO SEARCH TERM"
		})
		json_files = ['physics.json', 'mathematics.json', 'computer_science.json', 'quantitative_biology.json', 'quantitative_finance.json', 'statistics.json']
		az.call_multiple({
			"iterations": json_files.length,
			"function": function(elem, index) {
				az.read_local_file({
					"file_path": '../data/' + json_files[index],
					"done": function(data) {
						add_dropdowns('hold_elements_cells', 2, {
							"classname": "domain1_dropdown",
							"data": data,
							"index": index
						})
						if (index == 5) {
							add_drop_events('domain1_dropdown')
						}
					}
				})
			}
		})
		az.add_input('hold_elements_cells', 4, {
			"this_class": "search_term",
			"placeholder": "search terms..."
		})
		az.style_input('search_term', 1, {
			"margin-top": "0px",
			"margin-bottom": "10px",
			"width": "300px"
		})
		az.add_text('hold_elements_cells', 4, {
			"this_class": "explain_input",
			"text": "<br>terms separated by space"
		})
		az.style_text('explain_input', 1, {
			"color": "lightgrey",
			"margin-top": "-24px"
		})
		az.add_button('hold_elements_cells', 4, {
			"this_class": "run_scrape_and_model",
			"text": "RUN DOC2VEC"
		})
		az.add_button('hold_elements_cells', 7, {
			"this_class": "run_scrape_and_model",
			"text": "RUN WORD2VEC"
		})
		az.all_style_button('run_scrape_and_model', {
			"background": "white",
			"border": "1px solid black",
			"display": "block",
			"color": "black",
			"margin-top": "20px",
			"margin-bottom": "10px",
			"width": "auto",
			"outline": 0
		})
		az.add_event('run_scrape_and_model', 1, {
			"type": "click",
			"function": function() {
				if (typeof(az.hold_value.chosen1_text) !== 'undefined' && az.grab_value('search_term', 1) !== '') {
					parse_arxiv_pdf()
				} else {
					alert('Choose a domain and search term.')
				}
			}
		})
		az.add_event('run_scrape_and_model', 2, {
			"type": "click",
			"function": function() {
				if (az.check_exists('hold_pop', 1)) {
					parse_arxiv_single_paper()
				} else {
					alert('Run DOC2VEC first.')
				}
			}
		})
		az.add_text('hold_elements_cells', 5, {
			"this_class": "choose_title",
			"text": "DOCUMENT SIMILARITY"
		})
		az.add_iframe('hold_elements_cells', 3, {
			"this_class": "top_article_frame",
			"source": "https://blank.org/"
		})
		az.style_iframe('top_article_frame', 1, {
			"width": "95%",
			"height": "96%"
		})
		az.add_text('hold_elements_cells', 8, {
			"this_class": "choose_title",
			"text": "WORD SIMILARITY"
		})
		az.add_iframe('hold_elements_cells', 5, {
			"this_class": "top_article_barchart",
			"source": "visuals/horizontal-bar-chart/"
		})
		az.add_iframe('hold_elements_cells', 8, {
			"this_class": "top_article_barchart",
			"source": "visuals/horizontal-bar-chart/"
		})
		az.all_style_iframe('top_article_barchart', {
			"width": "90%",
			"height": "170px",
			"border": "none",
			"pointer-events": "none",
			"outline": 0
		})
		az.style_layout('hold_elements_cells', 1, {
			"background": "#b31b1a"
		})
		az.style_layout('hold_elements_cells', 2, {
			"background": "#b31b1a"
		})
		az.style_layout('hold_elements_cells', 4, {
			"background": "#b31b1a"
		})
		az.style_layout('hold_elements_cells', 5, {
			"background": "#1ab2b3"
		})
		az.style_layout('hold_elements_cells', 6, {
			"background": "#1ab2b3"
		})
		az.style_layout('hold_elements_cells', 7, {
			"background": "#b31b1a"
		})
		az.style_layout('hold_elements_cells', 8, {
			"background": "#b31b1a"
		})
		az.style_layout('hold_elements_cells', 3, {
			"valign": "bottom"
		})
		az.style_layout('hold_elements_cells', 6, {
			"valign": "top"
		})
		az.all_style_text('choose_title', {
			"color": "white",
			"font-size": "22px",
			"margin-top": "10px",
			"margin-bottom": "10px"
		})
		az.style_text('choose_title', 1, {
			"margin-top": "-30px",
			"margin-bottom": "30px",
			"color": "yellow"
		})
		az.style_word('choose_title', 2, {
			"this_class": "yellow_word",
			"word": "1",
			"color": "yellow"
		})
		az.style_word('choose_title', 3, {
			"this_class": "yellow_word2",
			"word": "2",
			"color": "yellow"
		})
		az.style_word('choose_title', 5, {
			"this_class": "yellow_word3",
			"word": "3",
			"color": "yellow"
		})
		az.style_word('choose_title', 6, {
			"this_class": "yellow_word4",
			"word": "4",
			"color": "yellow"
		})
	}
})
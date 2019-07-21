function add_drop_events(target_class) {
	az.call_multiple({
		"iterations": az.number_of_elements(target_class),
		"function": function(elem, index) {
			az.add_event(target_class, index + 1, {
				"type": "change",
				"function": function(this_id) {
					if(target_class == 'domain1_dropdown') {
					az.hold_value.chosen1_text = az.grab_text_from_dropdown('domain1_dropdown', az.get_target_instance(this_id))
					az.hold_value.chosen1_value = az.grab_value('domain1_dropdown', az.get_target_instance(this_id))
					} else {
					az.hold_value.chosen2_text = az.grab_text_from_dropdown('domain2_dropdown', az.get_target_instance(this_id))
					az.hold_value.chosen2_value = az.grab_value('domain2_dropdown', az.get_target_instance(this_id))
					}
					az.all_style_dropdown(target_class, {
						"pointer-events": "none",
						"opacity": 0.5
					})
					if (target_class == 'domain1_dropdown') {
						az.add_icon('choose_title', 1, {
							"this_class": "domain_chosen",
							"icon_class": "fa-check"
						})
					} else {
						az.add_icon('choose_title', 2, {
							"this_class": "domain_chosen",
							"icon_class": "fa-check"
						})
					}
					az.all_style_icon('domain_chosen', {
						"color": "yellow"
					})
					if (az.number_of_elements('domain_chosen') == 2) {
						az.add_text('hold_searching_text', 1, {
							"this_class": "searching_text_title",
							"text": "Comparing<br>" + az.hold_value.chosen1_text + "<br>to<br>" + az.hold_value.chosen2_text
						})
						az.style_text('searching_text_title', 1, {
							"color": "white",
							"font-size": "18px",
							"margin-top": "10px"
						})
						az.style_word('searching_text_title', 1, {
						    "this_class" : "highlight_choice",
						    "word" : az.hold_value.chosen1_text,
						    "color" : "yellow",
						    "font-weight" : "bold"
 						})
 						az.style_word('searching_text_title', 1, {
						    "this_class" : "highlight_choice2",
						    "word" : az.hold_value.chosen2_text,
						    "color" : "yellow",
						    "font-weight" : "bold"
 						})
az.style_text('searching_text_title', 1, {
    "width" : "300px",
    "background" : "#b31b1a",
    "border-radius" : "4px",
    "padding" : "5px"
})
					}
				}
			})
		}
	})
}
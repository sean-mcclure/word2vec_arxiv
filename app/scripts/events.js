function add_drop_events(target_class) {
	az.call_multiple({
		"iterations": az.number_of_elements(target_class),
		"function": function(elem, index) {
			az.add_event(target_class, index + 1, {
				"type": "change",
				"function": function(this_id) {
					az.hold_value.chosen1_text = az.grab_text_from_dropdown('domain1_dropdown', az.get_target_instance(this_id))
					az.hold_value.chosen1_value = az.grab_value('domain1_dropdown', az.get_target_instance(this_id))
					az.all_style_dropdown(target_class, {
						"pointer-events": "none",
						"opacity": 0.5
					})
					az.animate_element('search_term', 1, {
						"type": "rubberBand"
					})
					az.focus_element('search_term', 1)
				}
			})
		}
	})
}
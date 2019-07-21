function add_dropdowns(target_class, target_instance, options) {
	drop_id = 'drop_' + az.makeid()
	az.add_dropdown(target_class, target_instance, {
		"this_class": options.classname,
		"title": json_files[options.index].replace('json', '..').replace('_', ' '),
		"options": az.get_unique_keys_from_object(options.data, 'title'),
		"values": az.get_unique_keys_from_object(options.data, 'url'),
		"this_id": drop_id
	})
	az.all_style_dropdown(options.classname, {
		"display": "block",
		"margin-top": "5px",
		"width": "95%"
	})
}
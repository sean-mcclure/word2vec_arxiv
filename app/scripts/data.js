function normalize(min, max) {
	var delta = max - min;
	return function(val) {
		return (val - min) / delta;
	};
}

function get_doc_data() {
	document_titles = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'index')
	distances = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance')
	distances_norm = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance').map(normalize(Math.min.apply(null, distances), Math.max.apply(null, distances))).map(function(each_element) {
		return Number(each_element.toFixed(2));
	});
	outer = []
	document_titles.forEach(function(value, i) {
		if (i < 5) {
			inner = {}
			inner.name = 'DOCUMENT ' + document_titles[i]
			inner.percent = distances_norm[i]
			inner.value = distances_norm[i]
			outer.push(inner)
		}
	})
	return (outer)
}

function get_word_data() {
	document_titles = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'word')
	distances = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'distance')
	distances_norm = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'distance').map(normalize(Math.min.apply(null, distances), Math.max.apply(null, distances))).map(function(each_element) {
		return Number(each_element.toFixed(2));
	});
	outer = []
	document_titles.forEach(function(value, i) {
		if (i < 5) {
			inner = {}
			inner.name = document_titles[i]
			inner.percent = distances_norm[i]
			inner.value = distances_norm[i]
			outer.push(inner)
		}
	})
	return (outer)
}
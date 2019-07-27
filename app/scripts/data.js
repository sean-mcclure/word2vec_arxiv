az.read_local_file({
    "file_path" : "../data/links.json",
    "done" : "az.hold_value.data = data"
})

function normalize(min, max) {
    var delta = max - min;
    return function (val) {
        return (val - min) / delta;
    };
}

draw_data = {}
draw_data.nodes = []
draw_data.links=[]

function create_d3_data() {

    //document_titles = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'index')

    distances = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance').map(function(val) { // take the inverse since plotting distances
        res = 100/val
        return(res)
        })



        distances = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance')

        distances_norm = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance').map(normalize(Math.min.apply(null, distances), Math.max.apply(null, distances))).map(function(each_element){
            return Number(each_element.toFixed(2));
        });

        document_titles = distances_norm

    src = 'root'

    document_titles.forEach(function(value, i) {

    nodes_obj = {}
    nodes_obj.id = document_titles[i]
    nodes_obj.group = 1
    draw_data.nodes.push(nodes_obj)

    links_obj = {}
    if(value !== src) {
    links_obj.source = document_titles[i]

    links_obj.target = src
    links_obj.value = distances_norm[i]
    }

    draw_data.links.push(links_obj)

    })

    draw_data.nodes = draw_data.nodes.filter(value => Object.keys(value).length !== 0)
    draw_data.links = draw_data.links.filter(value => Object.keys(value).length !== 0)

    draw_data.nodes.push({
		"id": "root",
		"group": 1
	})

    return(draw_data)
}




function create_d3_data_b() {
	document_titles = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'index')
	distances = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance')
	distances_norm = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance').map(normalize(Math.min.apply(null, distances), Math.max.apply(null, distances))).map(function(each_element) {
		return Number(each_element.toFixed(2));
	});
	outer = []
	document_titles.forEach(function(value, i) {
		if(i < 5) {
		inner = {}
		inner.name = 'DOCUMENT ' + document_titles[i]
		inner.percent = distances_norm[i]
		inner.value = distances_norm[i]
		outer.push(inner)
		}
	})

	return (outer)
}


function create_d3_data_words() {
	document_titles = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'word')
	distances = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'distance')
	distances_norm = az.get_unique_keys_from_object(az.hold_value.word2vec_results_obj, 'distance').map(normalize(Math.min.apply(null, distances), Math.max.apply(null, distances))).map(function(each_element) {
		return Number(each_element.toFixed(2));
	});
	outer = []
	document_titles.forEach(function(value, i) {
		if(i < 5) {
		inner = {}
		inner.name = 'WORD ' + document_titles[i]
		inner.percent = distances_norm[i]
		inner.value = distances_norm[i]
		outer.push(inner)
		}
	})

	return (outer)
}
az.read_local_file({
    "file_path" : "../data/links.json",
    "done" : "az.hold_value.data = data"
})

document_titles = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6', 'doc7']
distances = [50, 100, 50, 150, 200, 100, 300]

draw_data = {}
draw_data.nodes = []
draw_data.links=[]

function create_d3_data() {

    document_titles = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'index')
    distances = az.get_unique_keys_from_object(az.hold_value.doc2vec_results_obj, 'distance')

    src = 15

    document_titles.forEach(function(value, i) {

    nodes_obj = {}
    nodes_obj.id = document_titles[i]
    nodes_obj.group = 1
    draw_data.nodes.push(nodes_obj)

    links_obj = {}
    if(value !== src) {
    links_obj.source = document_titles[i]

    links_obj.target = src
    links_obj.value = distances[i]
    }

    draw_data.links.push(links_obj)

    })

    draw_data.nodes = draw_data.nodes.filter(value => Object.keys(value).length !== 0)
    draw_data.links = draw_data.links.filter(value => Object.keys(value).length !== 0)

    return(draw_data)
}

// https://observablehq.com/@mojotliu/horizontal-bar-chart@258
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md
)});
  main.variable(observer("chart")).define("chart", ["d3","DOM","width","height","data","x","y"], function(d3,DOM,width,height,data,x,y)
{
  const svg = d3.select(DOM.svg(width, height));
  
  svg.append("g")
      .attr("fill", "rgb(179, 27, 26)")
    .selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.name))
      .attr("width", d => x(d.percent) - x(0))
      .attr("height", y.bandwidth());
  
  svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font", "18px arial")
    .selectAll("text")
    .data(data)
    .join("text")
      .attr("x", d => x(d.percent) / 2 + 15)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d.name);
  
    svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "after-edge")
      .style("font", "18px arial")
    .selectAll("text")
    .data(data)
    .join("text")
      .attr("x", d => x(d.percent) + 5)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d.value);
    
  return svg.node();
}
);
  main.variable(observer("data")).define("data", function(){return(
new Object([{
  "name": "Deviation from Profile Expectations",
  "percent": 47,
  "value": 116
}, {
  "name": "Suspicious Trade Activity",
  "percent": 26,
  "value": 64
}, {
  "name": "High Risk Terms",
  "percent": 16,
  "value": 40,
}, {
  "name": "Structuring",
  "percent": 11,
  "value": 26,
}])
)});
  main.variable(observer("format")).define("format", ["x"], function(x){return(
x.tickFormat(20)
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","data","margin","height"], function(d3,data,margin,height){return(
d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.top, height - margin.bottom])
    .padding(0.1)
)});


  main.variable(observer("xAxis")).define("xAxis", ["margin","d3","x","width"], function(margin,d3,x,width){return(
g => g
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(width / 80))
    .call(g => g.select(".domain").remove())
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y"], function(margin,d3,y){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
)});

  main.variable(observer("height")).define("height", ["data","margin"], function(data,margin){return(
data.length * 25 + margin.top + margin.bottom
)});

  main.variable(observer("margin")).define("margin", function(){return(
{top: 30, right: 30, bottom: 10, left: 30}
)});

  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});

  return main;
}

var w = 250,
    h = 300,
    t = 1,
    delta = .0025,
    padding = 10,
    points = [{x: 10, y: 250}, {x: 0, y: 0}, {x: 100, y: 0}, {x: 200, y: 250}],//, {x: 225, y: 125}],
    bezier = {},
    line = d3.svg.line().x(x).y(y),
    n = 4,
    stroke = d3.scale.category20b(),
    orders = [4];

var vis = d3.select("#vis").selectAll("svg")
    .data(orders)
  .enter().append("svg")
    .attr("width", w + 2 * padding)
    .attr("height", h + 2 * padding)
    .append("g")
      .attr("transform", "translate(" + padding + "," + padding + ")");

var iii = 0;
update();

var last = 0;
d3.timer(function(elapsed) {
  t = (t + (elapsed - last) / 5000) % 1;
  last = elapsed;
  update();
})


function update() {
  var interpolation = vis.selectAll("g")
      .data(function(d) { return getLevels(d, t); });

  if (iii === 1)
  interpolation.enter().append("g")
      .style("fill", colour)
      .style("stroke", colour);

  var curve = vis.selectAll("path.curve")
      .data(function(d) {
        console.log(d);
        return getCurve(d);
      });


 if (iii === 1)
  curve.enter().append("path")
      .attr("class", "curve " + (iii++));

  iii++;

  curve.attr("d", line);

}

function interpolate(d, p) {
  if (arguments.length < 2) p = t;
  var r = [];
  for (var i=1; i<d.length; i++) {
    var d0 = d[i-1], d1 = d[i];
    r.push({x: d0.x + (d1.x - d0.x) * p, y: d0.y + (d1.y - d0.y) * p});
  }
  return r;
}

function getLevels(d, t_) {
  if (arguments.length < 2) t_ = t;
  var x = [points.slice(0, d)];
  for (var i=1; i<d; i++) {
    x.push(interpolate(x[x.length-1], t_));
  }
  return x;
}

function getCurve(d) {
  var curve = bezier[d];
  if (!curve) {
    curve = bezier[d] = [];
    for (var t_=0; t_<=1; t_+=delta) {
      var x = getLevels(d, t_);
      curve.push(x[x.length-1][0]);
    }
  }
  return [curve.slice(0, t / delta + 1)];
}

function x(d) { return d.x; }
function y(d) { return d.y; }
function colour(d, i) {
  stroke(-i);
  return d.length > 1 ? stroke(i) : "red";
}

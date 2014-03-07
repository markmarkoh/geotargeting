(function() {
  var $el = $('#body');
  var width = 1200,
      height = 900,
      centered;
  var projection = projector = d3.geo.mercator()
      .scale(width)
      .translate([0, 0]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select("#body").append("svg:svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("svg:rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height)
      .on("click", click);

  svg.append("svg:defs")
      .append("svg:pattern")
        .attr("id", "dots")
        .attr("patternUnits", "userSpaceOnUse")
        //.attr("viewBox", "0 0 3 3")
        .attr("width", 1)
        .attr("height", 1)
        .attr("x", 0)
        .attr("y", 0)
          .append("svg:circle")
            .attr("cy", 1)
            .attr("cx", 1)
            .attr("r", 1)
            .attr("stroke", "#000")
            //.attr("stroke-width", "4")
            .attr("fill", "#222");


  var g = svg.append("svg:g")
      .attr("id", "wrapper")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .append("svg:g")
      .attr("id", "states");

  d3.json("js/world-countries.json", function(json) {
    g.selectAll("path")
        .data(json.features)
      .enter().append("svg:path")
        .attr("d", path)
        .style("fill", "#CCC")
        .style('stroke-width', 0.1)
        .style('stroke', '#555')
        .on("click", click);

    startAnimation();

  });



  function click(d, isRealClick) {
    var x = 0,
        y = 0,
        k = 1;

    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = -centroid[0];
      y = -centroid[1];

      var area = path.area(d);

      if (isRealClick === false) {
        k = width / (50 + Math.ceil(path.area(d))); //zoom to "appropriate" levels
      }
      else {
        k = 4;
      }

      centered = d;
    } else {
      centered = null;
    }

    console.log(x, y, centered, d, path.area(d));
    g.selectAll("path")
        .classed("active", centered && function(d) { return d === centered; });

    g.transition()
        .duration(1000)
        .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
        .style("stroke-width", (0.5 / k) + "px");
  }


  function target(coords, isOrigin) {

    var targetCoords = projector([coords.longitude, coords.latitude]);
    console.log(targetCoords, 'pos');

    var lineColor = (isOrigin ? "rgba(255, 120, 120, 1)" : "rgba(120, 120, 255, 1)");

    d3.select("#states")
      .append("svg:line")
        .attr("stroke", lineColor)
        .attr("x1", (isOrigin === true ? 1 : -1) * (width/2))
        .attr("x2", (isOrigin === true ? 1 : -1) * (width/2))
        .attr("y1", -1000)
        .attr("opacity", 1)
        .attr("y2", height)
        .transition()
          .duration(2500)
          .attr("x1", targetCoords[0])
          .attr("x2", targetCoords[0]);

    d3.select("#states")
      .append("svg:line")
        .attr("stroke", lineColor)
        .attr("x1", -1000)
        .attr("x2", width)
        .attr("y1", -1 * (height / 2))
        .attr("y2", -1 * (height / 2))
        .attr("opacity", 1)
        .transition()
          .duration(2500)
          .attr("y1", targetCoords[1])
          .attr("y2", targetCoords[1]);

    d3.select("#states")
      .append("svg:text")
        .attr("x", targetCoords[0] + 1)
        .attr("y", targetCoords[1] - 1)
        .attr("stroke", "none")
        .attr("fill", "#777")
        .attr("width", 0)
        .attr("font-size", "1")
        .attr("font-family", "monospace")
        .transition()
          .delay(4000)
          .text(coords.longitude + ',' + coords.latitude);

    d3.select("#states")
      .append("svg:circle")
        .attr("cx", targetCoords[0])
        .attr("cy", targetCoords[1])
        .attr("r", 1800)
        .attr("stroke", lineColor)
        .attr("stroke-width", ".5px")
        .style("fill", "rgba(0,0,0,0)")
        .transition()
          .delay(5000)
          .duration(2000)
            .attr("r", 1);


    if ( isOrigin === true) {
      window.setTimeout(function() {
        focus();
      }, 3000);
    }

  }

function drawArc (startCoords, endCoords, light) {

  if (typeof light === "undefined") {
    light = false;
  }

  var targetXY = projector([startCoords.longitude, startCoords.latitude]);
  var sourceXY = projector([endCoords.longitude, endCoords.latitude]);
  var midpointXY = [((targetXY[0] + sourceXY[0]) / 2), ((targetXY[1] + sourceXY[1]) / 2)];

  var w = 250,
    h = 300,
    t = 1,
    delta = .005,
    padding = 10,
    points = [{x: targetXY[0], y: targetXY[1]}, {x: midpointXY[0], y: midpointXY[1] - (light ? 25 : 25)}, {x: sourceXY[0], y: sourceXY[1]}],//, {x: 225, y: 125}],
    line = d3.svg.line().x(x).y(y),
    n = 3,
    stroke = d3.scale.category20b(),
    orders = [3];
bezier = {};


var lC = d3.select("#states")
  .append("svg:path")
  .attr("class", "boobs")
  .style("stroke-width", ".3px")
  //.style("stroke-dasharray", "1,1,1,1,1,1,3,1,3,1,3,1") //SOS
  //.style("stroke-dasharray", "2,2")
  .style("stroke-dasharray", "1,1")
  .style("stroke", "#222222")
  .attr("fill-color", "rgba(0,0,0,0)");

var i = 1;
d3.timer(function(d) {
      lC.data([getCurve(3)[0].slice(0, i)])
      .attr("d", line);
  i += 3;
  if (i > t / delta) return true;
});

 function getLevels(d, t_) {
  if (arguments.length < 2) t_ = t;
  var x = [points.slice(0, d)];
  for (var i=1; i<d; i++) {
    x.push(interpolate(x[x.length-1], t_));
  }
  return x;
};

function getCurve(d) {
  var curve = bezier[d];
  if (!curve) {
    curve = bezier[d] = [];
    for (var t_=0; t_<=1; t_+=delta) {
      var x = getLevels(d, t_);
      curve.push(x[x.length-1][0]);
    }
  }
  return [curve];
};

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

function x(d) { return d.x; }
function y(d) { return d.y; }
function colour(d, i) {
  stroke(-i);
  return d.length > 1 ? stroke(i) : "red";
}

  function focus(feature) {
    if (!feature) {

      //create a small box to focus in on.
      feature = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[]]}};
      feature.geometry.coordinates[0] = [
        [targetCoords.longitude, targetCoords.latitude],
        [targetCoords.longitude + 0.5, targetCoords.latitude + 0.5],
        [hostCoords.longitude, hostCoords.latitude],
        [hostCoords.longitude - 0.5, hostCoords.latitude - 0.5]
      ];

      click(feature, false);
    }
  }

  //key largo
  hostCoords = {longitude: -80.32, latitude: 25.5};
  //new york
  //hostCoords = {longitude: -74.14, latitude: 41.31};
  //iceland
  //hostCoords = {longitude: -21.14, latitude: 64.56};
  //tokyo
  //hostCoords = {longitude: 139.41, latitude: 35.41};
  //austin
  //hostCoords = {longitude: -97.42, latitude: 30.42};
  //talahasee
  hostCoords = {longitude: -81.32, latitude: 25.9};
  //houston
  //hostCoords = {longitude: -95.22, latitude: 29.45};

  function startAnimation() {
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function(position) {

          console.log(position);
            target(position.coords);

            //save
            targetCoords = position.coords;

            window.setTimeout(function() {

              target(hostCoords, true);


              window.setTimeout(function() {
                d3.selectAll("line")
                  .transition()
                  .duration(700)
                  .attr("opacity", 0);

                window.setTimeout(function() {
                  drawArc(hostCoords, targetCoords);
                  drawArc(hostCoords, targetCoords, true);
                }, 1500);
              }, 6000);

            },600);

          }, function(err) {
            alert('please share');
          });
    }
    else {
      console.log('hey');
    }
  }

})();

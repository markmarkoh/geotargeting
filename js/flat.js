(function() {
  var width = 1200,
      height = 800,
      centered;

  var projection = projector = d3.geo.equirectangular()
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

  var g = svg.append("svg:g")
      .attr("id", "wrapper")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .append("svg:g")
      .attr("id", "states");

  d3.json("/js/world-countries.json", function(json) {
    g.selectAll("path")
        .data(json.features)
      .enter().append("svg:path")
        .attr("d", path)
        .on("click", click);
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
        .style("stroke-width", 1/ k + "px");
  }


  function target(coords, isOrigin) {

    var targetCoords = projector([coords.longitude, coords.latitude]);
    console.log(targetCoords, 'pos');

    var lineColor = (isOrigin ? "rgba(0, 255, 255, 1)" : "rgba(255, 0, 0, 1)");

    d3.select("#states")
      .append("svg:line")
        .attr("stroke", lineColor)
        .attr("x1", (isOrigin === true ? 1 : -1) * (width/2))
        .attr("x2", (isOrigin === true ? 1 : -1) * (width/2))
        .attr("y1", -1000)
        .attr("y2", height)
        .transition()
          .duration(2500)
          //.attr("transform", "translate(" + targetCoords[0] + ")");
          .attr("x1", targetCoords[0])
          .attr("x2", targetCoords[0]);

    d3.select("#states")
      .append("svg:line")
        .attr("stroke", lineColor)
        .attr("x1", -1000)
        .attr("x2", width)
        .attr("y1", -1 * (height / 2))
        .attr("y2", -1 * (height / 2))
        .transition()
          .duration(2500)
          .attr("y1", targetCoords[1])
          .attr("y2", targetCoords[1]);

    if ( isOrigin === true) {
      window.setTimeout(function() {
        focus();
      }, 3000);
    }

  }

  function focus(feature) {
    if (!feature) {

      console.log('hey');
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
  var hostCoords = {longitude: -80.32, latitude: 25};
  //new york
  hostCoords = {longitude: -74.14, latitude: 41.31};
  //iceland
  //hostCoords = {longitude: -21.14, latitude: 64.56};
  //tokyo
  //hostCoords = {longitude: 139.41, latitude: 35.41};

  if (navigator.geolocation) {
    window.onload = function() {
      navigator.geolocation.getCurrentPosition(function(position) {

          target(position.coords);

          //save
          targetCoords = position.coords;

          window.setTimeout(function() {

            target(hostCoords, true);

          },600);

        });
    };
  }
  else {
    console.log('hey');
  }

})();
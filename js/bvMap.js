(function($) {
  var data,
      xy = d3
            .geo
            .equirectangular()
            .scale($('#map_container').width())
            .translate([$('#map_container').width() / 2, $('#map_container').height() / 2]),
      path = d3
              .geo
              .path()
              .projection(xy),
      svg = d3
              .select('#map_container')
              .append('svg:svg'),
      countries = svg
                    .append('svg:g')
                    .attr('id', 'countries');

  window.drawing = []; //global for debugging
  var line = d3.svg.line().x(x).y(y),
      last = 0,
      elapsed,
      t = .5,
      delta = .0666,
      steps = Math.ceil(1 / delta),
      sleep = 50,
      padding = 10;

  /* World Map */
  countries.selectAll('path')
    .data(window.countries_data.features)
    .enter()
    .append('svg:path')
    .attr('d', path)
   .attr('fill', 'rgba(29,91,85,1)')
   .attr('stroke', 'rgba(29,91,85,1)')
   .attr('stroke-width', 1);

  /* Container for links */
  var links = svg.append('svg:g');

  /*
  data is expected to be an Object of the form:
  {
    source:
    { type: "Point", coordinates: [x,y] },
    target:
    { type: "Point", coordinates: [x2,y2] }
  }

  where x,y,x2,y2 are GPS coordinates in decimal form
  */
  function addLink(data) {
    var x1, x2, y1, y2;
    /* Add source point */
    links
      .append('svg:path')
      .attr('d', function() {
        var d = path(data.source );
        //grab onscreen location of point
        screen_coords = parsePathCoords(d);
        x1 = screen_coords.x;
        y1 = screen_coords.y;
        return d;
      })
      .attr('fill', 'none').remove();

    /* Add target points */
    links
      .append('svg:path')
      .attr('d', function() {
        var d = path(data.target );
        screen_coords = parsePathCoords(d);
        x2 = screen_coords.x;
        y2 = screen_coords.y;
        return d;
      })
      .attr('fill', 'none').remove();

    /* Connect source & target points. Insert 3rd point offset by (-100, -100)
    as a Bezier curve point to create an arc effect */

    var dist = Math.sqrt ( Math.pow( Math.abs( x1 - x2), 2) + Math.pow( Math.abs (y1 - y2), 2));

    if(dist < 10) return false; //don't even bother drawing

    var midpoint_x = (x1 + x2) / 2,
        midpoint_y = (y1 + y2) / 2;

    /* Adjust Bezier curve controls */
    /* If coming from the East */
    /*if( x1 > x2 ) {
      midpoint_x += dist / 2;
    } else {
      midpoint_x -= dist / 2;
    }*/

    //create an arc effect with the middle
    // bezier control point
    midpoint_y -= dist / 4 + ~~(Math.random() * 35);

    var points = [{x: x1, y: y1}, {x: midpoint_x, y: midpoint_y}, {x: x2, y: y2}];
    var line = d3.svg.line().x(x).y(y);

    var link = links
      .append('svg:path')
      .attr('stroke','rgba(255,255,255,.7)')//'rgba(0,171,142,.5)')
      .attr('class', function() {
        var time = +new Date() / 1000;
        return 'added_' + (time - (time % 60)) + ' qaLink';
      })
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    //add new line object to drawing queue
    drawing.push({
      distance: dist,
      midpoint_x: midpoint_x,
      midpoint_y: midpoint_y,
      points: points,
      starting_real: +new Date(),
      link: link,
      line: line,
      data: getCurve(3, points, 1 / delta, {}),
      step: 0,
      bezier: {},
      circleLead: createCircle()
    });

    return true;
  }


 /*
 * Update the line's path to the next step in the
 * animation.
 */
  function update (link) {
    link.step++;
    //if(link.step >= link.data.length) return;

    link
      .link
      .data(function() {
        return [link.data.slice(0, link.step)];
      })
      .attr('d', link.line);

    if(link.step >= link.data.length) {
      link
        .circleLead
          .transition()
          .duration(250)
          .attr('r', 1)
          .delay(100)
          .remove();

      link
        .link
          .transition()
          .duration(250)
          .attr('stroke-width', 1)
          .attr('stroke', 'rgba(255,255,255,.4)');

    } else {
      link
        .circleLead
        .attr('cx', link.data[link.step].x)
        .attr('cy', link.data[link.step].y);
    }


  }

   /*
 * Begin the draw loop.
 * todo: Kill him when not needed
 */
  (function draw() {
    var queue_length = drawing.length,
      line,
      popoffAfterwards = 0; //remove elements from the drawing array


    //update all the lines we are currently drawing
    for(var i = 0; i < queue_length; i++) {
      line = drawing[i];
      if (line.step > steps) {
          popoffAfterwards++;
      } else {
        update(line);
      }
    }

    drawing = drawing.slice(popoffAfterwards, drawing.length);

    window.setTimeout(function() {
      draw();
    }, drawing.length ? sleep : sleep * 10) //if nothing in queue, sleep longer
  })();

   /*
 * Simulation controls
 *
 * For every UPDATE_INTERVAL seconds in real time, we process
 *  SIMULATION_SPEED seconds worth of Q&A data
 */
  var SIMULATION_SPEED = 200; //in seconds
  var UPDATE_INTERVAL = 1; //real time sleep time, in seconds
  var originalStartTime;
  var currentSimTime = originalStartTime = mapData[0].c + 40000;
  var lastAnimatedIndex = 0;

  /* Start Processing Data */
  (function queueUp() {
    var linksAnimatedInCycle = 0;
    window.setTimeout(function() {

      for(var i = lastAnimatedIndex; i < mapData.length; i++) {
        var answer = mapData[i];
        lastAnimatedIndex = i;

        //go back to sleep
        if (answer.c > currentSimTime) {
          break;
        }

        //only process 10 qalinks for performance
        if( linksAnimatedInCycle < 10 ) {
          var wasAdded = addLink({
              source : {
                type: "Point", 
                coordinates: [answer.g.lo, answer.g.la]
              },
              target : {
                type: "Point", 
                coordinates: [answer.q.g.lo, answer.q.g.la]
              }
          });
          linksAnimatedInCycle += wasAdded ? 1 : 0;
        }
        if (lastAnimatedIndex === mapData.length - 1) {
          /* reset */
          i = 0;
          lastAnimatedIndex = 0;
          currentSimTime = originalStartTime;
          break;
        }
      }
      //update simulation time
      currentSimTime += SIMULATION_SPEED;

      //recurse
      queueUp();

    }, UPDATE_INTERVAL * 1000)

  })();

  //fade out old lines, remove oldest
  window.setInterval(function() {
    clearOld();
  }, 1000 * 45);

  function clearOld() {
    var time = (+new Date() / 1000) -180; //3 minutes ago
    var one = $('#map_container > svg > g > path.added_' + (time - (time % 60))).attr('stroke', 'rgba(0,171,142,.5)');


    time -= 180; //6 minutes ago
    var two = $('#map_container > svg > g > path.added_' + (time - (time % 60))).attr('stroke', 'rgba(0,171,142,.2)');

    time -= (180 * 2); //9 * 2 minutes ago
    $('#map_container > svg > g > path.added_' + (time - (time % 60))).remove();
  }

  /*********************************************/
  /* BEGIN HELPER FUNCTIONS
  /*********************************************/
  function getCurve(d, points, time, bezier) {
    if (typeof bezier === 'undefined') {
      bezier = {};
    }
    var curve = bezier[d];
    if (!curve) {
      curve = bezier[d] = [];
      for (var t_=0; t_<=1; t_+=delta) {
        var x = getLevels(d, t_, points);
        curve.push(x[x.length-1][0]);
      }
      curve.push({x: points[2].x ,y: points[2].y})
    }
    return curve;
  }

  function parsePathCoords(path) {
    var tmp = path.split(',');
    return {
      x: +tmp[0].replace('M', ''),
      y: +tmp[1].replace(/m.*/, '')
     }
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

  function getLevels(d, t_, points) {
    if (arguments.length < 3) t_ = t;
    var x = [points.slice(0, d)];
    for (var i=1; i<d; i++) {
      x.push(interpolate(x[x.length-1], t_));
    }
    return x;
  }
  function x(d) { return d.x; }
  function y(d) { return d.y; }

  function createCircle() {
     var circle = links
      .append('svg:circle')
      .attr('r', 2.5)
      .attr('fill', 'rgba(123,56,56,.9)');

     return circle;
  }
  /*********************************************/
  /* END HELPER FUNCTIONS
  /*********************************************/


//why is this even a jquery plugin?
})(jQuery);


var dataset;
var new_data = [];
// load and display the World
d3.json("wmap.json", function(error, topology) {
  var loadDsv = d3.dsv(",", "iso-8859-1");
  loadDsv("directory.csv", function(error, directory) {
    if (error) return console.warn(error);
    directory.forEach(function(d) {
      d.Latitude = +d.Latitude;
      d.Longitude = +d.Longitude;
      // d.Country = +d.Country;
      // d.Store_Name = +d.Store_Name;
      // d.Street_Address = +d.Street_Address;
      //colorScale[d.Store_Number] = d.Country;
    });

  dataset = directory;
  // console.log(dataset);
  // console.log(test);
//all the data is now loaded, so draw the initial vis

//aggregated function for draw bars
  var store_count = d3.nest()
      .key(function(d) {return d.Country; })
      .rollup(function(v) {return v.length; })
      .entries(dataset);

    var city_Scount = d3.nest()
      .key(function(d) {return d.City; })
      .rollup(function(v) {return v.length; })
      .entries(dataset);
  //console.log(store_count);

  var width = 860,
      height = 450,
      border = 1,
      bordercolor = 'rgb(238, 238, 238)', 
      centered;

// part of the original map
  var projection = d3.geo.mercator()
    .center([0, 5 ])
    .scale(150)
    .rotate([0,0]);

  var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("border", border);

  var borderPath = svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", height)
            .attr("width", width)
            .style("stroke", bordercolor)
            .style("fill", 'white')
            .style("stroke-width", border);

  var path = d3.geo.path()
    .projection(projection);

  var g = svg.append("g");
    g.selectAll("path")
      .data(topojson.object(topology, topology.objects.countries)
          .geometries)
    .enter()
      .append("path")
      .attr("d", path)
      .on("click", clicked);

  // var tooltip = d3.select("#map").append("div")
  //   .attr("class", "tooltip")
  //   .style("opacity", 0);

// zoom and pan
var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+ 
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        g.selectAll("path")  
            .attr("d", path.projection(projection)); 
        // g.selectAll("circle")
        //     .attr("transform", function(d) {
        //       return "translate(" + transform.applyX(([d.Longitude, d.Latitude])[0])+ "," + transform.applyY(([d.Longitude, d.Latitude])[1]) + ")";
        //     });
  });

  //draw green dots with data in csv
  var draw = function(data) {
      var map = g.selectAll("circle")
        .data(data);
        map.exit().transition()
            .attr("r", 0)
            .remove();
            
      map.enter()
        .append("circle")
        .transition()
        .attr("r", 2)
      map
        .attr("cx", function (d) {
                     return projection([d.Longitude, d.Latitude])[0];
                 })
        .attr("cy", function (d) {
                     return projection([d.Longitude, d.Latitude])[1];
                 })
        .attr("fill", 'rgb(0,89,45)')
        .style("opacity",0.3)
        //.append("svg:title")
        .on("mouseover", function(d){
                var country = d.Country;
                var city = d.City;
                var num = findCountry(country);
                var cnum = findCity(city);
                d3.select("#country").text(country + "  "+ city);
                d3.select("#num").text(num + " Starbucks in " + country);
                d3.select("#cnum").text(cnum + " Starbucks in " + city);
                  d3.select("#name")
                    .text(d["Store_Name"]);
                  d3.select("#location").text(d["Street_Address"]);
                  d3.select(this).attr("class","incident hover");
              })
            .on("mouseout", function(d){
              d3.select("#name").text("View the store name and address");
              d3.select("#location").text("Move the mouse over points");
              d3.select("#country").text("Country and City");
              d3.select("#num").text("Number of Starbucks in this country");
              d3.select("#cnum").text("Number of Starbucks in this city");
              d3.select(this).attr("class","incident");
          });
  }

  function findCountry(d) {
    for (i = 0; i < store_count.length; i++) {
        if(store_count[i].key == d) {
          var x = store_count[i].values;
          return x;
        }
    }
  }

  function findCity(d) {
    for (i = 0; i < city_Scount.length; i++) {
        if(city_Scount[i].key == d) {
          var x = city_Scount[i].values;
          return x;
        }
    }
  }
  // make the map can be zoomed while click
  function clicked(d) {
    var x, y, k;

    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    g.selectAll("path")
        .classed("active", centered && function(d) { return d === centered; });

    g.selectAll("circle")
        .attr("r", 1);  

    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
  };

    // draw the dots with data set
    draw(dataset);
    svg.call(zoom);

  //draw bars
  var x_domain = [],
      y_domain = [];

    for (i = 0; i < store_count.length; i++) {
        x_domain[i] = store_count[i].key;
        y_domain[i] = store_count[i].values;
    }   


    var data = [{
     x: x_domain,
     y: y_domain,
     type: 'bar',
     marker: {
      color: 'rgb(0,89,45)'
     }
    }];

    var layout = {
      title: 'Number of Starbucks in each Country',
      xaxis: {
        title: 'Country'
      },
      yaxis: {
        type: 'log',
        fixedrange: true,
        title: 'Number of Starbucks'
      }, 
      legend: {
        x: 0, 
        y: 1.0, 
        bgcolor: 'rgba(255, 255, 255, 0)',
        bordercolor: 'rgba(255, 255, 255, 0)'
      }, 
      barmode: 'group', 
      bargap: 0.15, 
      bargroupgap: 0.1
    };


Plotly.newPlot('myDiv', data, layout, {showLink: false, displayModeBar: false});

// sort all the bars from high to low with number of starbucks  
    $('#bottom').click(function(){
        store_count.sort(function(a, b) {
            return b.values - a.values;
        })

        var x_domain = [],
            y_domain = [];

        for (i = 0; i < store_count.length; i++) {
            x_domain[i] = store_count[i].key;
            y_domain[i] = store_count[i].values;
        }   

       var data = [{
         x: x_domain,
         y: y_domain,
         type: 'bar',
          marker: {
          color: 'rgb(0,89,45)'
          }
        }];


        Plotly.newPlot('myDiv', data, layout, {showLink: false, displayModeBar: false});
    });

//show top 10 countries with the most starbucks
    $('#Show_TOP').click(function(){
        store_count.sort(function(a, b) {
            return b.values - a.values;
        })

        var x_domain = [],
            y_domain = [];

        for (i = 0; i < 10; i++) {
            x_domain[i] = store_count[i].key;
            y_domain[i] = store_count[i].values;
        }   

       var data = [{
         x: x_domain,
         y: y_domain,
         type: 'bar',
         marker: {
          color: 'rgb(0,89,45)'
         }
        }];


        Plotly.newPlot('myDiv', data, layout, {showLink: false, displayModeBar: false});
    });

// show countries with over 350 starbucks in bar graph
    $('#Show_350').click(function(){
        //var new_data = {};
        var index = 0;
        for (i = 0; i < store_count.length; i++)  {
            if (store_count[i].values >= 350) {
                new_data[index] = store_count[i];
                index++;
            }
        }
        
        new_data.sort(function(a, b) {
            return b.values - a.values;
        })

        var x_domain = [],
            y_domain = [];

        for (i = 0; i < new_data.length; i++) {
            x_domain[i] = new_data[i].key;
            y_domain[i] = new_data[i].values;
        }   

       var data = [{
         x: x_domain,
         y: y_domain,
         type: 'bar',
         marker: {
          color: 'rgb(0,89,45)'
         }
        }];


        Plotly.newPlot('myDiv', data, layout, {showLink: false, displayModeBar: false});
      

    });
    
  });
});


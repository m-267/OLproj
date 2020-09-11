var raster = new ol.layer.Tile({
  source: new ol.source.OSM(),
  id: "layer2"
});

var source = new ol.source.Vector({
  url: 'https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson',
  format: new ol.format.GeoJSON()
});

var vector = new ol.layer.Vector({
  source: source,
  id: "layer1"
});
var startCoord;
var endCoord;
var ddxy;
var dd1xy;
var bingRoad=new ol.layer.Tile({
          visible: false,
          preload: Infinity,
          source: new ol.source.BingMaps({
            key: 'Your Bing Maps Key from http://www.bingmapsportal.com/ here',
            imagerySet: "Road"
            // use maxZoom 19 to see stretched tiles instead of the BingMaps
            // "no photos at this zoom level" tiles
            // maxZoom: 19
          })
        });
var layerArray = [raster,vector,bingRoad];

var oneWFSlayerSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: function(extent) {
    return 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
        'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
        'outputFormat=application/json&srsname=EPSG:3857&' +
        'bbox=' + extent.join(',') + ',EPSG:3857';
  },
  strategy: ol.loadingstrategy.bbox
});
var oneWFSlayer = new ol.layer.Vector({
       source: oneWFSlayerSource,
       style: new ol.style.Style({
         stroke: new ol.style.Stroke({
           color: 'rgba(0, 0, 0, 1.0)',
           width: 2
         })
       })
     });

var features = new ol.Collection();
var latNode, longNode;
var oneWMSlayer = new ol.layer.Tile({
                    extent: [-13884991, 2870341, -7455066, 6338219],
                    source: new ol.source.TileWMS({
                      url: 'https://ahocevar.com/geoserver/wms',
                      params: {'LAYERS': 'topp:states', 'TILED': true},
                      serverType: 'geoserver',
                      crossOrigin: 'anonymous',
                    })
                  });

  var view = new ol.View({
  center: [0, 0],
  zoom: 1,
});
var map = new ol.Map({
 target: 'map',
 layers: [raster, vector],
 view: view,
 zoom: 3
});
var modify = new ol.interaction.Modify({
      features: features
    });



YUI().use('dd-drag','dd-drop', 'dd-constrain','event','json','io-base','node', 'button','jsonp', function(Y) {
//        var corn = Y.one('#corn'),
//            input = Y.one('.example #input'),
//            output = Y.one('.example #output');

//        var getWidth = function(){
//           var width = corn.get('offsetWidth');
//           output.setHTML(width + 'px'); // display width near the get button
//        }

Y.on('load', function (e) {
var coordButton = Y.one("#btnclk");
var searchButton = Y.one("#cityclk");
latNode= Y.one("#fLat");
longNode= Y.one("#fLong");
cityNode= Y.one("#city");
wmsButton = Y.one("#WMSclk");
wfsButton = Y.one("#WFSclk");
featureButton = Y.one("#getMapFeature");
drawButton = Y.one("#draw");
var drawflag = false;
var featureFlag=false;
distButton = Y.one("#dist");
var measure= false;


  // Step 2. Subscribe to its click event with a callback function
coordButton.on("click", function (e) {
  // Step 3. do stuff when the button is clicked
  var lat = Number (latNode.get("value"));
  var long = Number (longNode.get("value"));
  var coords = [long,lat];
  coords = ol.proj.transform(coords,"EPSG:4326","EPSG:3857")
  map.getView().setCenter(coords);
});

searchButton.on("click", function (e) {
  // Step 3. do stuff when the button is clicked
  var cityName = (cityNode.get("value"));
  var ajason;
  var cityCoordAPI = "http://open.mapquestapi.com/geocoding/v1/address?key=8fagV9bJbQQTwZpMUAd70AgGLMVptwzA&location="+cityName;
  Y.io(cityCoordAPI, {
          method: 'POST',
          on: {
              success: function (id, result) {
                   ajason = Y.JSON.parse(result.responseText);
                   coords = [ajason.results[0].locations[0].latLng.lng,ajason.results[0].locations[0].latLng.lat];
                   coords = ol.proj.transform(coords,"EPSG:4326","EPSG:3857")
                   map.getView().setCenter(coords);
                   map.getView().setZoom(12);
              }
          }
      });

},this);






  managedrag = function() {
    var dd1 = new Y.DD.Drag({
      node: '#start'
    })

    var dd = new Y.DD.Drag({
      node: '#end'
    }) //This config option makes the node a Proxy Drag
    var drop = new Y.DD.Drop({
      node: "#map"
    });
    var drop1 = new Y.DD.Drop({
      node: "#map"
    });

    dd.on("drag:drophit", function(e) {
      var node = e.drag.get("node");
      var data = node.get("parentNode").getData();
      console.log(data);
      if (data) {

        // Get source of img dragged and an unique id
        data.id = data.id + "_Map";

        ddxy = [e.drag.realXY[0] - e.drop.region.left, e.drag.realXY[1] - e.drop.region.top];console.log(data.imgName);
        startCoord= ol.proj.transform(map.getCoordinateFromPixel(ddxy),"EPSG:3857","EPSG:4326");

      }
    });

    dd1.on("drag:drophit", function(e) {
      var node = e.drag.get("node");
      var data = node.get("parentNode").getData();
      console.log(data);
      if (data) {

        // Get source of img dragged and an unique id
        data.id = data.id + "_Map";

        dd1xy = [e.drag.realXY[0] - e.drop.region.left, e.drag.realXY[1] - e.drop.region.top];console.log(data.imgName);
        endCoord = ol.proj.transform(map.getCoordinateFromPixel(dd1xy),"EPSG:3857","EPSG:4326");

      }
    });



      Y.DD.DDM.on('drag:end',function(e) {
        var ajason;
        if(startCoord && endCoord){
          var cityCoordAPI = "https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248118b8d4baa8540c0a854d2c620d674e5&start="+startCoord[0]+","+startCoord[1]+"&end="+endCoord[0]+","+endCoord[1];
          Y.io(cityCoordAPI, {
                 method: 'GET',
                 headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        },

                 on: {
                     success: function (id, result) {
                          ajason = Y.JSON.parse(result.response);
                          console.log(ajason);

                     },
                       failure: function(e) {
                         alert("failed");
                      }

                 }
             });
        }

      });

  }
  managedrag();


  var select = null;  // ref to currently selected interaction
  var selectSingleClick = new ol.interaction.Select();

  var selectClick = new ol.interaction.Select({
    condition: ol.events.condition.click
  });

  var selectPointerMove = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
  });

  var selectAltClick = new ol.interaction.Select({
    condition: function(mapBrowserEvent) {
      return ol.events.condition.click(mapBrowserEvent) &&
          ol.events.condition.altKeyOnly(mapBrowserEvent);
    }
  });

  var selectElement = Y.one('#type');

  var changeInteraction = function() {
    if (select !== null) {
      map.removeInteraction(select);
    }
    var value = selectElement.get("value");
    if (value == 'singleclick') {
      select = selectSingleClick;
    } else if (value == 'click') {
      select = selectClick;
    } else if (value == 'pointermove') {
      select = selectPointerMove;
    } else if (value == 'altclick') {
      select = selectAltClick;
    } else {
      select = null;
    }

    if (select !== null) {
      map.addInteraction(select);
      select.on('select', function(e) {
        var status = '&nbsp;' +
            e.target.getFeatures().getLength() +
            ' selected features (last operation selected ' + e.selected.length +
            ' and deselected ' + e.deselected.length + ' features)';
        Y.one('#status').setHTML(status);


      });
    }




  }
  selectElement.on("click", changeInteraction);

  wmsButton.on("click", function (e) {
      map.addLayer(oneWMSlayer);
  });

  wfsButton.on("click", function (e) {
      map.addLayer(oneWFSlayer);
      map.getView().setCenter([-8908887.277395891, 5381918.072437216]);
      map.getView().setZoom(12);
  });


  var resultElement = Y.one('#js-result');
  var measuringTool;

  var enableMeasuringTool = function(flag) {
    map.removeInteraction(measuringTool);

    var geometryType ='LineString';
    var html =  '';

    measuringTool = new ol.interaction.Draw({
      type: geometryType,
      source: vector.getSource()
    });

    measuringTool.on('drawstart', function(event) {
      vector.getSource().clear();

      event.feature.on('change', function(event) {
        var measurement = event.target.getGeometry().getLength();

        var measurementFormatted = measurement > 100 ? (measurement / 1000).toFixed(2) + 'km' : measurement.toFixed(2) + 'm';

        resultElement.setHTML(measurementFormatted + html);
      });
    });
    if(!flag){
        map.addInteraction(measuringTool);
          featureFlag= false; drawflag = false;
        return true
    } else {
      map.removeInteraction(measuringTool);
      return false
    }

  };

distButton.on("click", function (e) {
    // Step 3. do stuff when the button is clicked
    measure = enableMeasuringTool(measure);

  });

  drawButton.on("click", function (e) {
      // Step 3. do stuff when the button is clicked
      drawflag = enableMeasuringTool(drawflag);

    });



enableInteractionTool = function(flag){
  map.addInteraction(modify);

  var draw, snap; // global so we can remove them later
  var typeSelecte = Y.one('#drawtype');

  function addInteractions() {
    draw = new ol.interaction.Draw({
      source: source,
      type: typeSelect.get("value")
    });
    map.addInteraction(draw);
    snap = new ol.interaction.Snap({source: source});
    map.addInteraction(snap);

  }

  /**
   * Handle change event.
   */

/*    Y.all('#draw').on('change', function (e) {
var val = e.currentTarget.get('value');
console.log(val);
});*/

  addInteractions();

  if(!flag){
    typeSelect.on("click", function(ev) {
      map.removeInteraction(draw);
      map.removeInteraction(snap);
      addInteractions();
    });
    addInteractions();
    featureFlag= false; measure=false;
      return true;
  } else {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    return false;
  }

}

layerSwitcher = function(){
         var boxes =   Y.all(".flex-container input");
       var handleBoxClick = function(e) {
             // boxes is a NodeList
             boxes.setHTML('neener');
             boxes.setStyle('backgroundColor', '#F4E6B8');
             if(e.currentTarget._node.checked === false)
             {
               var layername=e.currentTarget.get('id');
               map.getLayers().forEach(layer => {
                    if (layer && layer.get('id') === layername) {
                      map.removeLayer(layer);
                    }
              });
            } else{
              var layername=e.currentTarget.get('id');
              var setCount = 0;
              map.getLayers().forEach(layer => {
                   if (layer && layer.get('id') === layername) {
                     setCount += 1;
                   }
            });
            if(setCount === 0){
              layerArray.forEach((item, i) => {
                if(item && item.get('id') === layername){
                  map.addLayer(item);
                }
              });
            }
          }

             // e.currentTarget === .box-row li, just the one that was clicked
             e.currentTarget.setHTML('ouch!');
             e.currentTarget.setStyle('backgroundColor', '#C4DAED');
       };
Y.one(".flex-container").delegate('click',handleBoxClick , 'input');
}
layerSwitcher();


mapGetFeature = function(featureFlag){
var newView= new ol.View({
   center: [-8908887.277395891, 5381918.072437216],
   maxZoom: 19,
   zoom: 12
 });
 if(featureFlag === false ){
   map.addEventListener("singleclick", function (evt) {
     this.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
       if(feature.get("osm_id") &&  feature.get("landuse")){
         var text = "Osm Id: " + feature.get("osm_id") + "\nLand Use: " + feature.get("landuse");
         Y.one("#info").setHTML(text);
       }

     });
   });drawflag= false; measure=false;
   return true;

 } else{
   map.removeEventListener('singleclick')
   return false;
 }
map.setView(newView);
}


featureButton.on("click", function(ev) {
featureFlag =  mapGetFeature(featureFlag);
});

});
});

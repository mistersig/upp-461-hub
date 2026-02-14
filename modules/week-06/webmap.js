/* Web map activity (Leaflet). Loads only on 03b-webmaps-activity.html */
(function(){
  function fmt(n, digits){
    try { return Number(n).toFixed(digits); } catch(e){ return String(n); }
  }

  function inRange(lat, lon){
    return Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  }

  function init(){
    var mapEl = document.getElementById('map');
    if (!mapEl) return;

    var live = document.querySelector('[data-webmap-form] [data-live]');
    function announce(msg){
      if (live) live.textContent = msg;
    }

    if (typeof window.L === 'undefined'){
      mapEl.innerHTML = '<div class="notice bad"><strong>Map failed to load.</strong> This activity needs internet access to load Leaflet and map tiles.</div>';
      announce('Map failed to load.');
      return;
    }

    var outLat = document.querySelector('[data-out-lat]');
    var outLon = document.querySelector('[data-out-lon]');
    var outX = document.querySelector('[data-out-x]');
    var outY = document.querySelector('[data-out-y]');
    var latInput = document.querySelector('input[name="lat"]');
    var lonInput = document.querySelector('input[name="lon"]');

    var map = L.map('map', {
      scrollWheelZoom: false
    }).setView([41.881832, -87.623177], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var marker = null;

    function setOutputs(lat, lon){
      if (outLat) outLat.textContent = fmt(lat, 6);
      if (outLon) outLon.textContent = fmt(lon, 6);
      var p = L.CRS.EPSG3857.project(L.latLng(lat, lon));
      if (outX) outX.textContent = fmt(p.x, 2);
      if (outY) outY.textContent = fmt(p.y, 2);
    }

    function setMarker(lat, lon, zoom){
      if (!inRange(lat, lon)){
        announce('Error: coordinates out of range.');
        return false;
      }
      var ll = L.latLng(lat, lon);
      if (!marker) marker = L.marker(ll).addTo(map);
      else marker.setLatLng(ll);
      if (typeof zoom === 'number') map.setView(ll, zoom);
      else map.panTo(ll);
      setOutputs(lat, lon);
      announce('Marker updated.');
      return true;
    }

    // Start with default point
    setMarker(41.881832, -87.623177, 4);
    if (latInput) latInput.value = '41.881832';
    if (lonInput) lonInput.value = '-87.623177';

    map.on('click', function(e){
      var lat = e.latlng.lat;
      var lon = e.latlng.lng;
      if (latInput) latInput.value = fmt(lat, 6);
      if (lonInput) lonInput.value = fmt(lon, 6);
      setMarker(lat, lon);
    });

    var form = document.querySelector('[data-webmap-form]');
    if (form){
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        var lat = parseFloat(latInput ? latInput.value : '');
        var lon = parseFloat(lonInput ? lonInput.value : '');
        if (Number.isNaN(lat) || Number.isNaN(lon)){
          announce('Error: enter numeric latitude and longitude.');
          return;
        }
        if (!setMarker(lat, lon, 10)){
          announce('Error: latitude must be between -90 and 90, longitude between -180 and 180.');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

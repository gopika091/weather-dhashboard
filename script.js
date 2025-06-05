document.addEventListener("DOMContentLoaded", function () {
  var location = { latitude: 40.7128, longitude: -74.0060 }; // Default NYC
  var isCelsius = true; // Track temperature unit

  var latitudeInput = document.getElementById("latitudeInput");
  var longitudeInput = document.getElementById("longitudeInput");
  var searchInput = document.getElementById("searchInput");
  var searchBtn = document.getElementById("searchBtn");
  var currentLocationBtn = document.getElementById("currentLocationBtn");
  var errorElement = document.getElementById("error");
  var temperatureElement = document.getElementById("temperature");
  var windSpeedElement = document.getElementById("windSpeed");
  var cloudCoverElement = document.getElementById("cloudCover");
  var humidityElement = document.getElementById("humidity");
  var pressureElement = document.getElementById("pressure");
  var precipitationElement = document.getElementById("precipitation");
  var tempItem = document.getElementById("tempItem");

  // Function to convert Celsius to Fahrenheit
  function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
  }

  // Function to convert Fahrenheit to Celsius
  function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
  }

  // Function to update temperature display
  function updateTemperatureDisplay(tempCelsius) {
    if (isCelsius) {
      temperatureElement.textContent = `🌡️ Temperature: ${tempCelsius.toFixed(1)}°C`;
    } else {
      const tempFahrenheit = celsiusToFahrenheit(tempCelsius);
      temperatureElement.textContent = `🌡️ Temperature: ${tempFahrenheit.toFixed(1)}°F`;
    }
  }

  // Add click event for temperature conversion
  tempItem.addEventListener("click", function() {
    isCelsius = !isCelsius;
    const currentTemp = parseFloat(temperatureElement.textContent.match(/-?\d+\.?\d*/)[0]);
    if (isCelsius) {
      updateTemperatureDisplay(fahrenheitToCelsius(currentTemp));
    } else {
      updateTemperatureDisplay(celsiusToFahrenheit(currentTemp));
    }
  });

  // Function to fetch weather data
  async function fetchWeather() {
    try {
      errorElement.textContent = "Fetching weather data...";
      
      var url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,surface_pressure`;

      var response = await fetch(url);
      var data = await response.json();

      if (data.current) {
        updateTemperatureDisplay(data.current.temperature_2m);
        windSpeedElement.textContent = `💨 Wind Speed: ${data.current.wind_speed_10m} km/h`;
        cloudCoverElement.textContent = `☁️ Cloud Coverage: ${data.current.cloud_cover}%`;
        humidityElement.textContent = `💧 Humidity: ${data.current.relative_humidity_2m}%`;
        pressureElement.textContent = `🌪️ Pressure: ${data.current.surface_pressure} hPa`;
        precipitationElement.textContent = `🌧️ Precipitation: ${data.current.precipitation} mm`;
        errorElement.textContent = ""; // Clear errors
      } else {
        errorElement.textContent = "Invalid weather data received.";
      }
    } catch (err) {
      errorElement.textContent = "Could not fetch weather data.";
    }
  }

  // Function to search location
  async function searchLocation(query) {
    try {
      errorElement.textContent = "Searching location...";
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.length > 0) {
        location = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
        latitudeInput.value = location.latitude.toFixed(4);
        longitudeInput.value = location.longitude.toFixed(4);
        fetchWeather();
      } else {
        errorElement.textContent = "Location not found. Please try a different search.";
      }
    } catch (err) {
      errorElement.textContent = "Error searching location. Please try again.";
    }
  }

  // Handle search button click
  searchBtn.addEventListener("click", function() {
    const query = searchInput.value.trim();
    if (query) {
      searchLocation(query);
    } else {
      errorElement.textContent = "Please enter a location to search.";
    }
  });

  // Handle search input enter key
  searchInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        searchLocation(query);
      } else {
        errorElement.textContent = "Please enter a location to search.";
      }
    }
  });

  // Function to get location name from coordinates
  async function getLocationName(lat, lon) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(','); // Get first 3 parts of the address
      }
      return '';
    } catch (err) {
      console.error('Error getting location name:', err);
      return '';
    }
  }

  // Handle "Use My Location" button
  currentLocationBtn.addEventListener("click", function () {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async function (position) {
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Update input fields with current location
          latitudeInput.value = location.latitude.toFixed(4);
          longitudeInput.value = location.longitude.toFixed(4);
          
          // Get and display location name
          const locationName = await getLocationName(location.latitude, location.longitude);
          if (locationName) {
            searchInput.value = locationName;
          }
          
          fetchWeather();
        },
        function (err) {
          errorElement.textContent = `Error: ${err.message}`;
        }
      );
    } else {
      errorElement.textContent = "Geolocation not supported.";
    }
  });

  // Handle manual input
  async function updateLocation() {
    const lat = parseFloat(latitudeInput.value);
    const lon = parseFloat(longitudeInput.value);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        location = { latitude: lat, longitude: lon };
        fetchWeather();
        
        // Get and display location name
        const locationName = await getLocationName(lat, lon);
        if (locationName) {
          searchInput.value = locationName;
        }
      } else {
        errorElement.textContent = "Invalid coordinates! Latitude must be between -90 and 90, and longitude between -180 and 180.";
      }
    } else {
      errorElement.textContent = "Please enter valid numbers for both latitude and longitude.";
    }
  }

  // Add event listeners for both inputs
  latitudeInput.addEventListener("change", updateLocation);
  longitudeInput.addEventListener("change", updateLocation);

  // Initial weather fetch
  fetchWeather();
});

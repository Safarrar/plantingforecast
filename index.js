import express from "express";
import axios from "axios";

// Create a new express application instance
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static("public"));

// Set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", "./views");

// Parse URL-encoded and JSON parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define the routes
app.get("/", async (req, res) => {
    res.render("index.ejs", { data: null });
});

// Handle the POST request
app.post("/", async (req, res) => {
    const { city, state } = req.body;   // Store the city and state from the form
    let response = null;    // Store the response from the Nominatim API

    // Fetch the latitude and longitude of the city and state
    try {
    response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${city},${state}&format=json`
    );
    } catch (error) {
        console.error('An error occured while fetching the data from Nominatim');
    }

    // Reload home page if city or state are invalid
    if (response.data.length === 0 || response.data[0].lat === undefined || response.data[0].lon === undefined) {
        res.render("index.ejs", { data: null });
        return;
    }

    // Parse the latitude and longitude from the response
    const { lat, lon } = response.data[0];

    let forecast = null;    // Store the response from the Open-Meteo API

    // Fetch the weather forecast for the next 10 days
    try {
        forecast = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=gfs_seamless&forecast_days=10&daily=temperature_2m_min,temperature_2m_max,precipitation_sum`
    );
    } catch (error) {
        console.error('An error occured while fetching the data from Open-Meteo');
    }

    // Convert the temperature from Celsius to Fahrenheit and the precipitation from mm to inches
    for (let index = 0; index < forecast.data.daily.time.length; index++) {
        let celciusTemp = forecast.data.daily.temperature_2m_min[index];
        forecast.data.daily.temperature_2m_min[index] = Math.round(
            (celciusTemp * 9) / 5 + 32
        );

        celciusTemp = forecast.data.daily.temperature_2m_max[index];
        forecast.data.daily.temperature_2m_max[index] = Math.round(
            (celciusTemp * 9) / 5 + 32
        );

        let mm = forecast.data.daily.precipitation_sum[index];
        forecast.data.daily.precipitation_sum[index] = (mm / 25.4).toFixed(1);
    }

    // Render the home page with the weather forecast
    res.render("index.ejs", { forecast: forecast.data.daily });
});

// Start the server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});

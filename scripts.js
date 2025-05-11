console.log("✅ scripts.js loaded successfully");

// Fetch available dates from Google Sheets
let availableDates = [];

fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getAvailability')
    .then(response => response.json())
    .then(data => {
        availableDates = data;
        console.log("✅ Available Dates Loaded:", availableDates);
        initCalendar();
    })
    .catch(error => {
        console.error("⚠️ Error fetching availability:", error);
    });

// Initialize the Flatpickr once the dates are loaded
function initCalendar() {
    const dateRangeInput = document.createElement("input");
    dateRangeInput.id = "dateRange";
    dateRangeInput.style.display = "none";
    document.body.appendChild(dateRangeInput);

    flatpickr(dateRangeInput, {
        mode: "range",
        dateFormat: "Y-m-d",
        enable: availableDates.map(d => d.date),
        onChange: (selectedDates) => {
            if (selectedDates.length === 2) {
                console.log("🗓️ Selected dates:", selectedDates);
                updateSummary(selectedDates);
            }
        }
    });

    // Open the calendar when the button is clicked
    document.getElementById("availabilityButton").addEventListener("click", () => {
        console.log("🟢 Button clicked — opening calendar...");
    
        if (!dateRangeInput._flatpickr) {
            console.error("⚠️ Flatpickr instance not found!");
        } else {
            dateRangeInput._flatpickr.open();
        }
    });
    
}

// Update the summary box
function updateSummary(dates) {
    const [start, end] = dates;
    const checkIn = start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const checkOut = end.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const nights = (end - start) / (1000 * 60 * 60 * 24);

    const summary = `
        <h2>Visit Details</h2>
        Arrive: ${checkIn}<br>
        Depart: ${checkOut}<br>
        Total Nights: ${nights}
    `;

    document.getElementById("details").innerHTML = summary;
    document.getElementById("summary").style.display = "block";
}

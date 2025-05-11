console.log("✅ scripts.js loaded successfully");

// Fetch available dates from Google Sheets
let availableDates = [];
let rateMap = {};

fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getAvailability')
    .then(response => response.json())
    .then(data => {
        availableDates = data;
        rateMap = Object.fromEntries(data.map(d => [d.date, d.rate]));
        console.log("✅ Available Dates Loaded:", availableDates);
        initCalendar();  // Initialize the calendar once the dates are loaded
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
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = dayElem.dateObj.toISOString().split('T')[0];
            if (rateMap[dateStr]) {
                const priceTag = document.createElement("span");
                priceTag.innerText = `$${rateMap[dateStr]}`;
                priceTag.style.fontSize = "9px";
                priceTag.style.lineHeight = "1";
                priceTag.style.color = "#555";
                priceTag.style.fontWeight = "500";
                dayElem.appendChild(priceTag);
            }
        },
        onChange: (selectedDates) => {
            if (selectedDates.length === 2) {
                console.log("🗓️ Selected dates:", selectedDates);
                updateSummary(selectedDates);
            }
        }
    });

    // Open the calendar when the button is clicked
    const availabilityButton = document.getElementById("availabilityButton");
    availabilityButton.addEventListener("click", () => {
        console.log("🟢 Button clicked — opening calendar...");
        dateRangeInput._flatpickr.open();
    });
}

// Update the summary box
function updateSummary(dates) {
    const [start, end] = dates;
    const checkIn = start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const checkOut = end.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const nights = (end - start) / (1000 * 60 * 60 * 24);

    let subtotal = 0;
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        subtotal += rateMap[dateStr] || 0;
    }

    const summary = `
        <h2>Visit Details</h2>
        Arrive: ${checkIn}<br>
        Depart: ${checkOut}<br>
        Total Nights: ${nights}<br>
        Total Cost: $${subtotal}
    `;

    document.getElementById("details").innerHTML = summary;
    document.getElementById("summary").style.display = "block";
}

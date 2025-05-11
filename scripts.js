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
function sendRequest() {
    const name = document.getElementById("guestName").value.trim();
    const email = document.getElementById("guestEmail").value.trim();
    const phone = document.getElementById("guestPhone").value.trim();
    const promoCode = document.getElementById("promo").value.trim();
    const dateRange = document.getElementById("dateRange")._flatpickr.selectedDates;

    // Basic validation
    if (!name || !email || !phone || dateRange.length < 2) {
        alert("Please fill in all fields and select your dates.");
        console.error("⚠️ Missing required fields:", { name, email, phone, dateRange });
        return;
    }

    const [startDate, endDate] = dateRange;
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('promo', promoCode);
    formData.append('startDate', startDate.toISOString().split("T")[0]);
    formData.append('endDate', endDate.toISOString().split("T")[0]);

    // Show loading message
    document.getElementById("loadingMessage").style.display = "block";
    document.getElementById("request").style.display = "none";

    console.log("🚀 Sending booking request:", formData.toString());

    fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    })
    .then(response => response.text())
    .then(result => {
        console.log("✅ Server Response:", result);
        if (result === 'Booking Saved') {
            const requestEl = document.getElementById("request");
            const summaryEl = document.getElementById("summary");
            document.getElementById("loadingMessage").style.display = "none";
            requestEl.classList.add("fade-blur-out");
            summaryEl.classList.add("fade-blur-out");

            setTimeout(() => {
                requestEl.style.display = "none";
                summaryEl.style.display = "none";
                const confirmationEl = document.getElementById("confirmationMessage");
                confirmationEl.style.opacity = "0";
                confirmationEl.style.display = "block";
                setTimeout(() => {
                    confirmationEl.style.transition = "opacity 0.7s ease";
                    confirmationEl.style.opacity = "1";
                }, 50);
            }, 700);
        } else {
            console.error("❌ Unexpected server response:", result);
            alert("Something went wrong: " + result);
        }
    })
    .catch(error => {
        console.error("⚠️ Error submitting request:", error);
        alert("There was a problem submitting your request. Please try again.");
    });
}


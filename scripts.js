console.log("🚀 Testing Vercel Deployment - Should see this if updated");

console.log("✅ scripts.js loaded successfully");
let promoCodes = [];

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
    

// Fetch Promo Codes (Updated Logic)
fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getPromoCodes')
    .then(response => response.json())
    .then(data => {
        console.log("✅ Raw Promo Codes Data:", data);
        
        promoCodes = data.map(row => ({
            code: String(row.code || "").trim().toUpperCase(),
            amount: Number(row.amount) || 0,
            type: String(row.type || "").trim(),
            start: row.start ? new Date(row.start).getTime() : null,
            end: row.end ? new Date(row.end).getTime() : null,
        }));

        console.log("✅ Parsed Promo Codes:", promoCodes);
    })
    .catch(error => {
        console.error("⚠️ Error fetching promo codes:", error);
    });






function initCalendar() {
    // Create the hidden date range input
    const dateRangeInput = document.createElement("input");
    dateRangeInput.id = "dateRange";
    dateRangeInput.style.position = "absolute";
    dateRangeInput.style.opacity = "0";
    dateRangeInput.style.pointerEvents = "none";
    dateRangeInput.style.zIndex = "-1";
    document.body.appendChild(dateRangeInput);

    // Track the current date range
    let startDate = null;
    let endDate = null;

    // Initialize Flatpickr
    const flatpickrInstance = flatpickr(dateRangeInput, {
        mode: "range",
        dateFormat: "Y-m-d",
        enable: availableDates.map(d => d.date),
        defaultDate: new Date(),
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = dayElem.dateObj.toISOString().split('T')[0];
            if (rateMap[dateStr]) {
                const priceTag = document.createElement("span");
                priceTag.innerText = `$${rateMap[dateStr]}`;
                dayElem.appendChild(priceTag);
            }
        },
        onChange: (selectedDates) => {
            if (selectedDates.length === 2) {
                updateSummary(selectedDates);
            }
        }
    });

    // Attach promo code logic
    document.getElementById("promo").addEventListener("input", () => {
        if (flatpickrInstance && flatpickrInstance.selectedDates.length === 2) {
            updateSummary(flatpickrInstance.selectedDates);
        }
    });

    // Open the calendar when the button is clicked
    const availabilityButton = document.getElementById("availabilityButton");
    availabilityButton.addEventListener("click", () => {
        console.log("🟢 Button clicked — opening calendar...");
        flatpickrInstance.open();

        // Fix the "tap out" issue
        setTimeout(() => {
            dateRangeInput.style.opacity = "0";
            dateRangeInput.style.pointerEvents = "none";
        }, 100);
    });
}


function updateSummary(dates) {
    if (!dates || dates.length < 2) return;

    // Ensure promo codes are loaded
    if (promoCodes.length === 0) {
        console.warn("⚠️ Promo codes not loaded yet — retrying in 100ms");
        setTimeout(() => updateSummary(dates), 100);
        return;
    }

    const [start, end] = dates;
    const checkIn = start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const checkOut = end.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const nights = (end - start) / (1000 * 60 * 60 * 24);

    let subtotal = 0;
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        subtotal += rateMap[dateStr] || 0;
    }

    // Apply promo code if present
    const promoCode = document.getElementById("promo").value.trim().toUpperCase();
    let discount = 0;
    if (promoCode) {
        const bookingDate = start.getTime();
        const matchingCodes = promoCodes.filter(p => {
            const validStart = !p.start || bookingDate >= p.start;
            const validEnd = !p.end || bookingDate <= p.end;
            return p.code === promoCode && validStart && validEnd;
        });

        if (matchingCodes.length > 0) {
            discount = matchingCodes.reduce((max, p) => {
                const discountValue = p.type === "%" ? subtotal * (p.amount / 100) : p.amount;
                return Math.max(max, discountValue);
            }, 0);
        }
    }

    const total = subtotal + 200 - discount;
    const summary = `
        <h3>Visit Details</h3>
        Arrive: ${checkIn}<br>
        Depart: ${checkOut}<br>
        Total Nights: ${nights}<br><br>
        Suggested Contribution: $${subtotal.toFixed(2)}<br>
        Cleaning Share: $200<br>
        ${discount > 0 ? `Because we appreciate you: -$${discount.toFixed(2)}<br><br>` : ''}
        <strong>Suggested Total Contribution: $${total.toFixed(2)}</strong>
    `;

    document.getElementById("details").innerHTML = summary;
    document.getElementById("promoContainer").style.display = "block";
    document.getElementById("summary").style.display = "block";
    document.getElementById("request").style.display = "block";
}
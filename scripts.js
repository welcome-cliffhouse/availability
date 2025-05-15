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
    <h2>Visit Details</h2>

    <div class="visit-details">
        <div class="visit-label">Arrive:</div>
        <div class="visit-date">${checkIn}</div>
        
        <div class="visit-label">Depart:</div>
        <div class="visit-date">${checkOut}</div>
        
        <div class="visit-label">Total Nights:</div>
        <div class="visit-date">${nights}</div>
    </div>

    <div class="price-breakdown">
        <div class="price-line"><span class="price-label">Suggested Contribution:</span> <span class="price-amount">$${subtotal.toFixed(2)}</span></div>
        <div class="price-line"><span class="price-label">Cleaning Share:</span> <span class="price-amount">$200</span></div>
        ${discount > 0 ? `<div class="price-line"><span class="price-label">Because we appreciate you:</span> <span class="price-amount">-$${discount.toFixed(2)}</span></div>` : ''}
        <hr>
        <div class="price-line total">
            ${discount > 0 ? `
                <div class="original-total">$${(subtotal + 200).toFixed(2)}</div>
                <div class="final-total">$${total.toFixed(2)}</div>
            ` : `
                <div class="final-total">$${total.toFixed(2)}</div>
            `}
        </div>

    </div>
`;

    document.getElementById("details").innerHTML = summary;
    document.getElementById("promoContainer").style.display = "block";
    document.getElementById("summary").style.display = "block";
    document.getElementById("request").style.display = "block";
}

function sendRequest() {
    console.log("📤 Sending booking request...");

    // Collect form data
    const name = document.getElementById("guestName").value.trim();
    const email = document.getElementById("guestEmail").value.trim();
    const phone = document.getElementById("guestPhone").value.trim();
    const promo = document.getElementById("promo").value.trim().toUpperCase();
    const dateRangeInput = document.getElementById("dateRange")._flatpickr;
    const submitButton = document.querySelector("#request button");

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        console.error("⚠️ Invalid email address:", email);
        return;
    }

    // Validate dates
    if (!dateRangeInput || dateRangeInput.selectedDates.length !== 2) {
        alert("Please select your check-in and check-out dates.");
        console.error("⚠️ Missing date range — cannot proceed.");
        return;
    }

    const [startDate, endDate] = dateRangeInput.selectedDates;
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Validate other required fields
    if (!name || !email || !phone) {
        alert("Please fill in all fields before submitting.");
        console.error("⚠️ Missing form fields — cannot proceed.");
        return;
    }

    console.log("✅ Form Data Collected:", { name, email, phone, formattedStartDate, formattedEndDate, promo });

    const url = `https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec`;
    const params = new URLSearchParams({
        name,
        email,
        phone,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        promo
    });

    // Show loading state
    submitButton.disabled = true;
    submitButton.innerText = "Sending...";

    // Send the booking request
    console.log("🚀 Sending booking request with these params:", params.toString());
    fetch(`${url}?${params.toString()}`, {
        method: "POST",
        mode: "cors"
    })
    .then(response => response.text())
    .then(data => {
        console.log("✅ Booking Request Sent:", data);

        if (data.includes("Booking Saved")) {
            console.log("✅ Booking successfully saved in the Bookings sheet.");
            document.getElementById("summary").style.display = "none";
            document.getElementById("confirmationMessage").style.display = "block";
        } else {
            console.error("❌ Unexpected response from server:", data);
            alert("There was an unexpected response from the server. Please try again.");
        }
    })
    .catch(err => {
        console.error("❌ Error sending booking request:", err);
        alert("There was an error sending your booking request. Please try again.");
    })
    .finally(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerText = "Send Request";
    });
}




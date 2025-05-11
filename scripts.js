console.log("✅ scripts.js loaded successfully");

// Fetch available dates from Google Sheets
let availableDates = [];
let promoCodes = [];

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

// Fetch promo codes
google.script.run.withSuccessHandler(data => {
    promoCodes = data;
    console.log("✅ Promo Codes Loaded:", promoCodes);
}).getPromoCodes();

function initCalendar() {
    const enabledDates = availableDates.map(d => d.date);
    const rateMap = Object.fromEntries(availableDates.map(d => [d.date, d.rate]));

    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        enable: enabledDates,
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
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                console.log("🗓️ Selected dates:", selectedDates);
                updateSummary(selectedDates);
            }
        }
    });
}

function updateSummary(datesFromPicker = null) {
    const currentPromo = document.getElementById("promo") ? document.getElementById("promo").value.trim() : "";
    let input = document.getElementById("dateRange")._flatpickr.selectedDates;
    if (datesFromPicker) input = datesFromPicker;
    if (input.length < 2) return;

    let [start, end] = input;
    let nights = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        nights.push(d.toISOString().split('T')[0]);
    }

    if (nights.length < 2) {
        document.getElementById("details").innerHTML = `<p style="color: red; font-weight: bold;">There is a 2 night minimum stay.</p>`;
        document.getElementById("total").innerHTML = "";
        document.getElementById("summary").style.display = "block";
        document.getElementById("request").style.display = "block";
        return;
    }

    const rateMap = Object.fromEntries(availableDates.map(d => [d.date, d.rate]));
    let subtotal = nights.reduce((sum, date) => sum + (rateMap[date] || 0), 0);
    let discount = 0;

    if (currentPromo !== "" && promoCodes.length > 0) {
        const code = currentPromo.toUpperCase();
        const bookingDate = start;
        const matches = promoCodes.filter(p => {
            const validStart = !p.start || bookingDate.getTime() >= p.start;
            const validEnd = !p.end || bookingDate.getTime() <= p.end;
            return p.code === code && validStart && validEnd;
        });

        if (matches.length > 0) {
            let maxSavings = 0;
            matches.forEach(p => {
                let currentDiscount = p.type === "%" ? subtotal * (p.amount / 100) : p.amount;
                if (currentDiscount > maxSavings) maxSavings = currentDiscount;
            });
            discount = maxSavings;
        }
    }

    let total = subtotal - discount + 200;
    const checkIn = formatPrettyDate(start);
    const checkOut = formatPrettyDate(end);

    document.getElementById("details").innerHTML = `
        <div style="font-size: 9px; color: gray; text-align: center; margin-top: 20px;">
          This is not a rental, but a private friends & family home. Any contributions help offset upkeep and cleaning costs so we can continue sharing this special place with our circle who we love so much!
        </div> 
        <h2> Visit Details </h2>
        Arrive: ${checkIn}<br>
        Depart: ${checkOut}<br><br>
        Total Nights: ${nights.length}<br>
        Suggested Contribution: $${subtotal.toFixed(2)}<br>
        Cleaning Share: $200<br>
        ${discount > 0 ? `Because we appreciate you: -$${discount.toFixed(2)}<br><br>` : '' }
        <br><br>
        <strong>Suggested Total Contribution: $${total.toFixed(2)}</strong>
    `;

    document.getElementById("promoContainer").style.display = "block";
    document.getElementById("summary").style.display = "block";
    document.getElementById("request").style.display = "block";
}

function formatPrettyDate(d) {
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

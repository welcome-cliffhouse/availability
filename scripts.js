// Cliff House Booking System (Consolidated DOM Logic)

let passwordSubmitted = false;

document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOM fully loaded, attaching event listeners...");

    // ✅ Password Logic
    const passwordOverlay = document.getElementById("passwordOverlay");
    const passwordInput = document.getElementById("passwordInput");
    const errorMessage = document.getElementById("errorMessage");
    const submitButton = document.getElementById("submitPassword");

    if (passwordOverlay) {
        passwordOverlay.style.display = "flex";
    }

    // ✅ Define button click logic BEFORE attaching listener
    function simulateEnter() {
        console.log("✅ Button clicked");  // 👈 Add this here
        if (!passwordInput.disabled && !passwordSubmitted) {
            passwordSubmitted = true;
    
            console.log("🖱️ Submit button clicked — triggering password logic");
    
            // Reset after timeout (not blocking main call)
            setTimeout(() => {
                if (passwordSubmitted) {
                    console.warn("⏱️ Resetting passwordSubmitted after 10s timeout.");
                    passwordSubmitted = false;
                }
            }, 10000);
    
            // ✅ This must be outside the timeout!
            verifyPassword(passwordInput, errorMessage);
    
        } else {
            console.warn("⛔ Button click ignored due to disabled input or already submitted");
        }
    }
    

    // ✅ Attach click listener to submit button
    if (submitButton) {
        submitButton.addEventListener("click", simulateEnter);
    }

    

      // ✅ Handle Enter key
      if (passwordInput && errorMessage) {
        passwordInput.addEventListener("focus", () => {
            errorMessage.style.display = "none";
            passwordInput.classList.remove("shake");
        });


        
        passwordInput.addEventListener("keypress", (e) => {
            console.log("⌨️ Keypress:", e.key);
            console.log("🧪 passwordInput.disabled?", passwordInput.disabled);
            console.log("🧪 passwordSubmitted?", passwordSubmitted);

            if (e.key === "Enter" && !passwordInput.disabled && !passwordSubmitted) {
                passwordSubmitted = true;
                console.log("🔒 Attempting password check...");
                
                setTimeout(() => {
                    if (passwordSubmitted) {
                        console.warn("⏱️ Resetting passwordSubmitted after 10s timeout.");
                        passwordSubmitted = false;
                    }
                }, 10000);
                
                
                verifyPassword(passwordInput, errorMessage);
            } else if (e.key === "Enter") {
                console.warn("⛔ Enter ignored due to disabled or already submitted");
            }
        });
    }
    

    


// ✅ Defensively hide confirmation message in case it's lingering from a previous state
const confirmationBox = document.getElementById("confirmationMessage");
if (confirmationBox) confirmationBox.style.display = "none";

    // ✅ Calendar Logic
    let dateRangeInput = document.getElementById("dateRange");
    if (!dateRangeInput) {
        dateRangeInput = document.createElement("input");
        dateRangeInput.id = "dateRange";
        dateRangeInput.style.position = "absolute";
        dateRangeInput.style.opacity = "0";
        dateRangeInput.style.pointerEvents = "none";
        dateRangeInput.style.zIndex = "-1";
        document.body.appendChild(dateRangeInput);
    }

    const availabilityButton = document.getElementById("availabilityButton");
    if (availabilityButton && dateRangeInput) {
        availabilityButton.addEventListener("click", (event) => {
            console.log("🟢 Button clicked — opening calendar...");
            event.preventDefault();
            if (dateRangeInput._flatpickr) {
                dateRangeInput._flatpickr.open();
            } else {
                initCalendar(dateRangeInput);
            }
        });
    } else {
        console.error("❌ Availability button or date input not found in DOM");
    }

    // ✅ Promo Code Logic
    const promoInput = document.getElementById("promo");
    if (promoInput) {
        promoInput.addEventListener("input", () => {
            const flatpickrInstance = dateRangeInput._flatpickr;
            if (flatpickrInstance && flatpickrInstance.selectedDates.length === 2) {
                updateSummary(flatpickrInstance.selectedDates);
            }
        });
    }

    // ✅ Fetch Available Dates and Initialize Calendar
    fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getAvailability')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.warn("⚠️ No available dates received. Retrying in 100ms...");
                setTimeout(() => location.reload(), 100);
                return;
            }
            window.availableDates = data;
            window.rateMap = Object.fromEntries(data.map(d => [d.date, d.rate]));
            console.log("✅ Available Dates Loaded:", availableDates);
            initCalendar(dateRangeInput);
        })
        .catch(error => {
            console.error("⚠️ Error fetching availability:", error);
        });

    // ✅ Fetch Promo Codes
    fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getPromoCodes')
        .then(response => response.json())
        .then(data => {
            window.promoCodes = data.map(row => ({
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


    
     
// ✅ Password Verification Logic
function verifyPassword(passwordInput, errorMessage) {
    console.log("📞 verifyPassword() called with value:", passwordInput.value);

    const enteredPassword = passwordInput.value.trim();

    if (enteredPassword === "") {
        console.warn("⛔ Empty password field — skipping fetch");
        return;
    }
    
     

    
    if (enteredPassword === "") return;  // Prevent empty submission

    const url = "https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec";
    const params = new URLSearchParams({
        mode: "password",
        password: enteredPassword,
        origin: window.location.origin
    });

    passwordInput.disabled = true;
    passwordInput.classList.add("loading");

    fetch(`${url}?${params.toString()}`, {
        method: "GET",
        mode: "cors"
    })
    .then(response => response.text())
    .then(data => {
        if (data === "success") {
            console.log("🔓 Password accepted, overlay hidden");
            document.getElementById("passwordOverlay").style.display = "none";
        } else {
            console.warn("❌ Incorrect password attempt");
            errorMessage.style.display = "block";
            passwordInput.value = "";
            passwordInput.disabled = false;
            passwordInput.classList.remove("loading");
            passwordSubmitted = false; // 🔁 Re-enable if failed
        }
    })
    .catch(err => {
        console.error("❌ Error verifying password:", err);
        errorMessage.style.display = "block";
        passwordInput.value = "";
        passwordInput.disabled = false;
        passwordInput.classList.remove("loading");
        passwordSubmitted = false; // 🔁 Re-enable if failed
    });
}


  
// ✅ Calendar Initialization Logic
function initCalendar(dateRangeInput) {
    flatpickr(dateRangeInput, {
        mode: "range",
        dateFormat: "Y-m-d",
        minDate: "today",
        enable: availableDates.map(d => d.date),

        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = dayElem.dateObj.toISOString().split('T')[0];
            if (rateMap[dateStr]) {
                const priceTag = document.createElement("span");
                priceTag.innerText = `$${rateMap[dateStr].toFixed(0)}`;
                priceTag.classList.add("price-tag");
                dayElem.appendChild(priceTag);
            }
        },

        onChange: (selectedDates) => {
            if (selectedDates.length === 2) {
                const [start, end] = selectedDates;
                const totalNights = (end - start) / (1000 * 60 * 60 * 24);

                // ✅ 2-night minimum check
                if (totalNights < 2) {
                    alert("Your stay must be at least 2 nights. Please select a longer range.");
                    dateRangeInput._flatpickr.clear();
                    return;
                }

                // ✅ Blocked date check
                const selectedRange = [];
                for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    selectedRange.push(dateStr);
                }

                const allowedDates = availableDates.map(d => d.date);
                const hasBlockedDate = selectedRange.some(date => !allowedDates.includes(date));

                if (hasBlockedDate) {
                    alert("Your selected range includes one or more unavailable dates. Please choose a different range.");
                    dateRangeInput._flatpickr.clear();
                    return;
                }

                // ✅ Passed all checks, update summary
                updateSummary(selectedDates);
            }
        }
    });

    console.log("✅ Calendar initialized with 2-night minimum and blocked date check");
}

});
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
        
        <div class="final-total-heading">Total Suggested Contribution</div>

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



  
  
  








/* CODE THAT HAD ALL MY FUNCTIONS 
/*console.log("🚀 Testing Vercel Deployment meow - Should see this if updated");

console.log("✅ scripts.js loaded successfully");
let promoCodes = [];
console.log("🚀 Testing Vercel Deployment - Should see this if updated");

console.log("✅ scripts.js loaded successfully");

// Password Verification Logic
function verifyPassword() {
    const passwordInput = document.getElementById("passwordInput");
    const errorMessage = document.getElementById("errorMessage");
    const enteredPassword = passwordInput.value.trim();

    // Prevent empty submission
    if (enteredPassword === "") return;

    // Disable input to prevent double submission
    passwordInput.disabled = true;
    passwordInput.classList.add("loading");

    const url = "https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec";
    const params = new URLSearchParams({
        mode: "password",
        password: enteredPassword,
        origin: window.location.origin
    });

    fetch(`${url}?${params.toString()}`, {
        method: "GET",
        mode: "cors"
    })
    .then(response => response.text())
    .then(data => {
        if (data === "success") {
            console.log("🔓 Password accepted, overlay hidden");
            document.getElementById("passwordOverlay").style.display = "none";
        } else {
            console.warn("❌ Incorrect password attempt");
            errorMessage.style.display = "block";
            passwordInput.value = "";
            passwordInput.disabled = false;  // Re-enable after failure
            passwordInput.classList.remove("loading");
        }
    })
    .catch(err => {
        console.error("❌ Error verifying password:", err);
        errorMessage.style.display = "block";
        passwordInput.value = "";
        passwordInput.disabled = false;  // Re-enable after network error
        passwordInput.classList.remove("loading");
    });
}




// Ensure the DOM is fully loaded before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOM fully loaded, attaching event listeners...");

    // ✅ Handle Date Range Input
    let dateRangeInput = document.getElementById("dateRange");
    if (!dateRangeInput) {
        dateRangeInput = document.createElement("input");
        dateRangeInput.id = "dateRange";
        dateRangeInput.style.position = "absolute";
        dateRangeInput.style.opacity = "0";
        dateRangeInput.style.pointerEvents = "none";
        dateRangeInput.style.zIndex = "-1";
        document.body.appendChild(dateRangeInput);
    }

    const availabilityButton = document.getElementById("availabilityButton");
    if (availabilityButton) {
        availabilityButton.addEventListener("click", (event) => {
            console.log("🟢 Button clicked — opening calendar...");
            event.preventDefault();
            dateRangeInput.style.display = "block"; // Make it visible for focus
            dateRangeInput.focus();
            dateRangeInput._flatpickr.open();
            setTimeout(() => {
                dateRangeInput.style.display = "none"; // Hide it again
            }, 200);
        });

        // Fix for reliable focus on the hidden date input
        availabilityButton.addEventListener("mousedown", (event) => {
            console.log("🟢 Button held down — focusing dateRange...");
            dateRangeInput.focus();  // Force focus to the hidden input
        });
    } else {
        console.error("❌ Availability button not found in DOM");
    }
});

// ✅ Handle Password Logic
document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOM fully loaded, attaching event listeners...");

    const passwordOverlay = document.getElementById("passwordOverlay");
    const passwordInput = document.getElementById("passwordInput");
    const errorMessage = document.getElementById("errorMessage");
    let isSubmitting = false;

    // Make sure the overlay is visible on first load
    if (passwordOverlay) {
        passwordOverlay.style.display = "flex";
    }

    // Handle password entry
    if (passwordInput && errorMessage) {
        passwordInput.addEventListener("focus", () => {
            errorMessage.style.display = "none";
            passwordInput.classList.remove("shake");
        });

        passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !isSubmitting) {
                isSubmitting = true;
                console.log("🔒 Attempting password check...");
                verifyPassword()
                    .then(success => {
                        if (success) {
                            console.log("✅ Password verified");
                        } else {
                            console.log("❌ Password incorrect");
                            errorMessage.style.display = "block";
                            passwordInput.classList.add("shake");
                            setTimeout(() => {
                                passwordInput.classList.remove("shake");
                                passwordInput.focus();  // Refocus for quick retry
                                isSubmitting = false;
                            }, 600);
                        }
                    })
                    .catch(err => {
                        console.error("❌ Error verifying password:", err);
                        errorMessage.style.display = "block";
                        isSubmitting = false;
                    });
            }
        });
    } else {
        console.error("❌ Password input or error message not found in DOM");
    }

    // Calendar Logic
    const dateRangeInput = document.getElementById("dateRange");
    const availabilityButton = document.getElementById("availabilityButton");

    if (availabilityButton && dateRangeInput) {
        availabilityButton.addEventListener("click", (event) => {
            event.preventDefault();
            dateRangeInput.focus();
            dateRangeInput._flatpickr.open();
        });
    }
});

// ✅ Unified Password Logic (Consolidated)
document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOM fully loaded, attaching event listeners...");

    const passwordOverlay = document.getElementById("passwordOverlay");
    const passwordInput = document.getElementById("passwordInput");
    const errorMessage = document.getElementById("errorMessage");

    // Make sure the overlay is visible on first load
    if (passwordOverlay) {
        passwordOverlay.style.display = "flex";
    }

    // Handle password entry
    if (passwordInput && errorMessage) {
        passwordInput.addEventListener("focus", () => {
            errorMessage.style.display = "none";
        });

        passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !passwordInput.disabled) {
                verifyPassword(passwordInput, errorMessage);
            }
        });
    } else {
        console.error("❌ Password input or error message not found in DOM");
    }



    // Calendar Logic
    const dateRangeInput = document.getElementById("dateRange");
    const availabilityButton = document.getElementById("availabilityButton");

    if (availabilityButton && dateRangeInput) {
        availabilityButton.addEventListener("click", (event) => {
            event.preventDefault();
            dateRangeInput.focus();
            dateRangeInput._flatpickr.open();
        });
    }
});


    // Calendar Logic
    const dateRangeInput = document.getElementById("dateRange");
    const availabilityButton = document.getElementById("availabilityButton");

    if (availabilityButton && dateRangeInput) {
        availabilityButton.addEventListener("click", (event) => {
            event.preventDefault();
            dateRangeInput.focus();
            dateRangeInput._flatpickr.open();
        });
    }
});




    
    
    




fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec?action=getAvailability')
    .then(response => response.json())
    .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
            console.warn("⚠️ No available dates received. Retrying in 100ms...");
            setTimeout(() => location.reload(), 100);
            return;
        }
        
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
    
    
    // Track the current date range
    let startDate = null;
    let endDate = null;

   // Initialize Flatpickr with 2-night minimum and blocked date validation
   if (dateRangeInput._flatpickr) {
    console.log("🗑️ Clearing old Flatpickr instance...");
    dateRangeInput._flatpickr.destroy();
}

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
            const [start, end] = selectedDates;
            const totalNights = (end - start) / (1000 * 60 * 60 * 24);

            // **2-Night Minimum Check**
            if (totalNights < 2) {
                alert("Your stay must be at least 2 nights. Please select a longer range.");
                flatpickrInstance.clear();
                return;
            }

            // **Blocked Date Validation**
            const allDates = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                allDates.push(dateStr);
            }

            // Check if the selected range crosses any blocked dates
            const blockedDates = availableDates.map(d => d.date);
            const isBlocked = allDates.some(date => !blockedDates.includes(date));

            if (isBlocked) {
                alert("Your selected range includes one or more unavailable dates. Please choose a different range.");
                flatpickrInstance.clear();
                return;
            }

            // **Valid Range Update**
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
availabilityButton.addEventListener("click", (event) => {
    console.log("🟢 Button clicked — opening calendar...");

    // Prevent default focus loss behavior
    event.preventDefault();
    
    // Open the calendar directly
    const dateRangeInput = document.getElementById("dateRange");
    dateRangeInput.style.opacity = "1";
    dateRangeInput.style.pointerEvents = "auto";
    dateRangeInput.focus();
    dateRangeInput._flatpickr.open();

    // Hide the input again after a slight delay
    setTimeout(() => {
        dateRangeInput.style.opacity = "0";
        dateRangeInput.style.pointerEvents = "none";
    }, 200);
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
        
        <div class="final-total-heading">Total Suggested Contribution</div>

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



*/
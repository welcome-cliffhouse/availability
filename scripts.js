// Initialize the date picker when the button is clicked
document.getElementById("availabilityButton").addEventListener("click", () => {
    let dateRangeInput = document.getElementById("dateRange");

    // Create the hidden date input if it doesn't exist
    if (!dateRangeInput) {
        dateRangeInput = document.createElement("input");
        dateRangeInput.type = "text";
        dateRangeInput.id = "dateRange";
        dateRangeInput.style.display = "none";
        document.body.appendChild(dateRangeInput);
    }

    // Initialize Flatpickr only once
    if (!dateRangeInput._flatpickr) {
        flatpickr(dateRangeInput, {
            mode: "range",
            dateFormat: "Y-m-d",
            onChange: (selectedDates) => {
                if (selectedDates.length === 2) {
                    console.log("✅ Date Range Selected:", selectedDates);
                    // Placeholder for your summary update logic
                    updateSummary(selectedDates);
                }
            }
        });
    }

    // Open the date picker
    dateRangeInput._flatpickr.open();
});

// Placeholder function for updating the summary
function updateSummary(selectedDates) {
    const [start, end] = selectedDates;
    console.log(`Arrive: ${start.toLocaleDateString()} - Depart: ${end.toLocaleDateString()}`);
    // Add your summary update logic here
}

// ============================================
// BAH BAH'S JOURNEY - V1
// ============================================

const stages = [
 { emoji: " ", title: "Walk to bus" },
 { emoji: " ", title: "Ride the bus" },
 { emoji: " ", title: "Ride the train" },
 { emoji: " ", title: "Ride the underground" },
 { emoji: " ", title: "Final walk to work" },
 { emoji: " ", title: "Reached work" }
];

let currentStage = 1;
let journeyId = null;

// --------------------------------------------
// Find Bah Bah's journey
// --------------------------------------------

async function loadJourney() {

 const response = await fetch(
 `${SUPABASE_URL}/rest/v1/journeys?name=eq.Bah%20Bah&select=*`,
 {
 headers: {
 apikey: SUPABASE_ANON_KEY,
 Authorization: `Bearer ${SUPABASE_ANON_KEY}`
 }
 }
 );

 if (!response.ok) {
 throw new Error("Could not connect to Supabase");
 }

 const journeys = await response.json();

 if (!journeys.length) {
 throw new Error("Bah Bah's journey was not found");
 }

 const journey = journeys[0];

 journeyId = journey.id;
 currentStage = journey.current_stage;

 render(journey);
}


// --------------------------------------------
// Draw the journey
// --------------------------------------------

function render(journey) {

 const journeyElement = document.getElementById("journey");

 journeyElement.innerHTML = "";

 stages.forEach((stage, index) => {

 const position = index + 1;

 const div = document.createElement("div");

 div.className = "stage";

 if (position < journey.current_stage) {
 div.classList.add("completed");
 }

 if (position === journey.current_stage) {
 div.classList.add("current");
 }

 div.innerHTML = `
 <div class="stage-icon">
 ${stage.emoji}
 </div>

 <div class="stage-label">
 ${stage.title}
 </div>
 `;

 journeyElement.appendChild(div);
 });


 // Current stage

 const stage = stages[journey.current_stage - 1];

 document.getElementById("currentEmoji").textContent =
 stage.emoji;

 document.getElementById("currentTitle").textContent =
 stage.title;


 // Progress

 const progress =
 Math.round(
 ((journey.current_stage - 1) /
 (stages.length - 1)) * 100
 );

 document.getElementById("progressBar").style.width =
 `${progress}%`;

 document.getElementById("progressText").textContent =
 `${progress}%`;


 // Button

 const button = document.getElementById("nextButton");

 if (journey.current_stage >= stages.length) {

 button.textContent = " ARRIVED";

 button.disabled = true;

 } else {

 button.textContent = "NEXT →";

 button.disabled = false;
 }


 // Updated time

 if (journey.updated_at) {

 const date =
 new Date(journey.updated_at);

 document.getElementById("updated").textContent =
 `Last updated ${date.toLocaleTimeString([], {
 hour: "2-digit",
 minute: "2-digit"
 })}`;
 }
}


// --------------------------------------------
// NEXT button
// --------------------------------------------

document
 .getElementById("nextButton")
 .addEventListener("click", async () => {

 if (!journeyId) return;

 if (currentStage >= stages.length) return;

 const nextStage = currentStage + 1;

 const response = await fetch(
 `${SUPABASE_URL}/rest/v1/journeys?id=eq.${journeyId}`,
 {
 method: "PATCH",

 headers: {
 apikey: SUPABASE_ANON_KEY,
 Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
 "Content-Type": "application/json",
 "Prefer": "return=representation"
 },

 body: JSON.stringify({
 current_stage: nextStage,
 updated_at: new Date().toISOString()
 })
 }
 );


 if (!response.ok) {

 alert("Something went wrong updating the journey.");

 return;
 }


 const updated =
 await response.json();

 currentStage = nextStage;

 render(updated[0]);

 });


// --------------------------------------------
// Start
// --------------------------------------------

loadJourney().catch(error => {

 console.error(error);

 document.getElementById("journey").innerHTML = `
 <div class="loading">
 ${error.message}
 </div>
 `;

});

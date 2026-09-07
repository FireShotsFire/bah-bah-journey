// ============================================
// BAH BAH'S JOURNEY
// ============================================

const stages = [
  {
    emoji: "🚶‍♂️",
    title: "Walk to bus"
  },
  {
    emoji: "🚌",
    title: "Ride the bus"
  },
  {
    emoji: "🚂",
    title: "Ride the train"
  },
  {
    emoji: "🚇",
    title: "Ride the underground"
  },
  {
    emoji: "🚶‍♂️",
    title: "Final walk to work"
  },
  {
    emoji: "🏢",
    title: "Reached work"
  }
];

let journeyId = null;
let currentStage = 1;


// ============================================
// LOAD JOURNEY
// ============================================

async function loadJourney() {

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/journeys?name=eq.Bah%20Bah&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const responseText = await response.text();

    console.log(
      "Supabase status:",
      response.status
    );

    if (!response.ok) {

      throw new Error(
        `Supabase error ${response.status}: ${responseText}`
      );

    }

    const journeys =
      JSON.parse(responseText);

    if (!journeys.length) {

      throw new Error(
        "Bah Bah's journey was not found."
      );

    }

    const journey = journeys[0];

    journeyId = journey.id;

    currentStage =
      journey.current_stage;

    render(journey);

  }

  catch (error) {

    console.error(error);

    document.getElementById(
      "journey"
    ).innerHTML = `
      <div class="loading">
        ⚠️ ${error.message}
      </div>
    `;

  }
}


// ============================================
// RENDER JOURNEY
// ============================================

function render(journey) {

  const journeyElement =
    document.getElementById("journey");

  if (!journeyElement) {
    console.error("Journey element missing");
    return;
  }


  // Clear timeline

  journeyElement.innerHTML = "";


  // ==========================================
  // TIMELINE
  // ==========================================

  stages.forEach(
    (stage, index) => {

      const position =
        index + 1;

      const element =
        document.createElement("div");

      element.className =
        "stage";


      if (
        position <
        journey.current_stage
      ) {

        element.classList.add(
          "completed"
        );

      }


      if (
        position ===
        journey.current_stage
      ) {

        element.classList.add(
          "current"
        );

      }


      element.innerHTML = `

        <div class="stage-icon">
          ${stage.emoji}
        </div>

        <div class="stage-label">
          ${stage.title}
        </div>

      `;


      journeyElement.appendChild(
        element
      );

    }
  );


  // ==========================================
  // CURRENT STAGE
  // ==========================================

  const stage =
    stages[
      journey.current_stage - 1
    ];


  const currentEmoji =
    document.getElementById(
      "currentEmoji"
    );

  const currentTitle =
    document.getElementById(
      "currentTitle"
    );


  if (
    currentEmoji &&
    currentTitle
  ) {

    currentEmoji.textContent =
      stage.emoji;

    currentTitle.textContent =
      stage.title;

  }


  // ==========================================
  // PROGRESS
  // ==========================================

  let progress = 0;

  if (
    journey.current_stage >=
    stages.length
  ) {

    progress = 100;

  }

  else {

    progress =
      Math.round(
        (
          (journey.current_stage - 1)
          /
          (stages.length - 1)
        )
        * 100
      );

  }


  const progressBar =
    document.getElementById(
      "progressBar"
    );

  const progressText =
    document.getElementById(
      "progressText"
    );


  if (progressBar) {

    progressBar.style.width =
      `${progress}%`;

  }


  if (progressText) {

    progressText.textContent =
      `${progress}%`;

  }


  // ==========================================
  // UP NEXT
  // ==========================================

  const upNextElement =
    document.getElementById(
      "upNext"
    );


  if (upNextElement) {

    if (
      journey.current_stage <
      stages.length
    ) {

      const nextStage =
        stages[
          journey.current_stage
        ];

      upNextElement.textContent =
        `${nextStage.emoji} ${nextStage.title}`;

    }

    else {

      upNextElement.textContent =
        "🎉 Journey complete!";

    }

  }


  // ==========================================
  // NEXT BUTTON
  // ==========================================

  const button =
    document.getElementById(
      "nextButton"
    );


  if (button) {

    if (
      journey.current_stage >=
      stages.length
    ) {

      button.textContent =
        "🎉 ARRIVED";

      button.disabled =
        true;

    }

    else {

      button.textContent =
        "NEXT →";

      button.disabled =
        false;

    }

  }


  // ==========================================
  // LAST UPDATED
  // ==========================================

  const updated =
    document.getElementById(
      "updated"
    );


  if (
    updated &&
    journey.updated_at
  ) {

    const date =
      new Date(
        journey.updated_at
      );

    updated.textContent =
      `Last updated ${date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )}`;

  }

}


// ============================================
// NEXT BUTTON
// ============================================

const nextButton =
  document.getElementById(
    "nextButton"
  );


if (nextButton) {

  nextButton.addEventListener(
    "click",
    async () => {

      if (!journeyId) {
        return;
      }


      if (
        currentStage >=
        stages.length
      ) {

        return;

      }


      nextButton.disabled =
        true;


      const nextStage =
        currentStage + 1;


      try {

        const response =
          await fetch(
            `${SUPABASE_URL}/rest/v1/journeys?id=eq.${journeyId}`,
            {
              method: "PATCH",

              headers: {

                apikey:
                  SUPABASE_ANON_KEY,

                Authorization:
                  `Bearer ${SUPABASE_ANON_KEY}`,

                "Content-Type":
                  "application/json",

                Prefer:
                  "return=representation"

              },

              body:
                JSON.stringify({

                  current_stage:
                    nextStage,

                  updated_at:
                    new Date()
                      .toISOString()

                })

            }
          );


        const responseText =
          await response.text();


        if (!response.ok) {

          throw new Error(
            `Update failed ${response.status}: ${responseText}`
          );

        }


        const updatedJourney =
          JSON.parse(responseText);


        currentStage =
          nextStage;


        render(
          updatedJourney[0]
        );

      }

      catch (error) {

        console.error(error);

        alert(
          error.message
        );


        nextButton.disabled =
          false;

      }

    }
  );

}


// ============================================
// START
// ============================================

loadJourney();

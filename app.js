// ============================================
// BAH BAH'S JOURNEY
// TWO-WAY DATABASE-DRIVEN VERSION
// ============================================

let journeyId = null;
let stages = [];
let currentStage = 1;


// ============================================
// LOAD ACTIVE JOURNEY
// ============================================

async function loadJourney() {

  try {

    const response = await fetch(

      `${SUPABASE_URL}/rest/v1/journeys?active=eq.true&select=*&order=updated_at.desc&limit=1`,

      {

        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY`

        }

      }

    );


    const responseText =
      await response.text();


    if (!response.ok) {

      throw new Error(
        `Supabase error ${response.status}: ${responseText}`
      );

    }


    const journeys =
      JSON.parse(responseText);


    if (!journeys.length) {

      throw new Error(
        "No active journey found."
      );

    }


    const journey =
      journeys[0];


    journeyId =
      journey.id;


    currentStage =
      journey.current_stage;


    // ----------------------------------------
    // Load stages
    // ----------------------------------------

    const stagesResponse = await fetch(

      `${SUPABASE_URL}/rest/v1/stages?journey_id=eq.${journeyId}&select=*&order=position.asc`,

      {

        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY`

        }

      }

    );


    const stagesText =
      await stagesResponse.text();


    if (!stagesResponse.ok) {

      throw new Error(
        `Stages error ${stagesResponse.status}: ${stagesText}`
      );

    }


    stages =
      JSON.parse(stagesText);


    if (!stages.length) {

      throw new Error(
        "No stages found."
      );

    }


    render(journey);

  }

  catch (error) {

    console.error(error);

    const journeyElement =
      document.getElementById(
        "journey"
      );


    if (journeyElement) {

      journeyElement.innerHTML = `

        <div class="loading">
          ⚠️ ${error.message}
        </div>

      `;

    }

  }

}


// ============================================
// RENDER
// ============================================

function render(journey) {

  const journeyElement =
    document.getElementById(
      "journey"
    );


  if (!journeyElement) {
    return;
  }


  journeyElement.innerHTML = "";


  // ==========================================
  // TIMELINE
  // ==========================================

  stages.forEach(
    (stage, index) => {

      const position =
        index + 1;


      const element =
        document.createElement(
          "div"
        );


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


  if (!stage) {
    return;
  }


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

  let progress =
    Number(
      journey.progress
    );


  if (
    Number.isNaN(progress)
  ) {

    progress = 0;

  }


  progress =
    Math.max(
      0,
      Math.min(
        100,
        progress
      )
    );


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

  const upNext =
    document.getElementById(
      "upNext"
    );


  if (upNext) {

    if (
      journey.current_stage <
      stages.length
    ) {

      const next =
        stages[
          journey.current_stage
        ];


      upNext.textContent =
        `${next.emoji} ${next.title}`;

    }

    else {

      upNext.textContent =
        "🎉 Journey complete!";

    }

  }


  // ==========================================
  // BUTTON
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
  // UPDATED
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
      `Last updated ${
        date.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )
      }`;

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


      const progress =
        Math.round(

          (
            (nextStage - 1)
            /
            (stages.length - 1)
          )
          * 100

        );


      try {

        const response =
          await fetch(

            `${SUPABASE_URL}/rest/v1/journeys?id=eq.${journeyId}`,

            {

              method:
                "PATCH",

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

                  progress:
                    progress,

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


        const updatedJourneys =
          JSON.parse(
            responseText
          );


        currentStage =
          nextStage;


        render(
          updatedJourneys[0]
        );

      }

      catch (error) {

        console.error(
          error
        );


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

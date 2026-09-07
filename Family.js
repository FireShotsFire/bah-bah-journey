// ============================================
// BAH BAH FAMILY VIEW
// DATABASE-DRIVEN VERSION
// ============================================

let journeyId = null;
let stages = [];


// ============================================
// LOAD ACTIVE JOURNEY
// ============================================

async function loadJourney() {

  try {

    // ----------------------------------------
    // Find active journey
    // ----------------------------------------

    const journeyResponse = await fetch(

      `${SUPABASE_URL}/rest/v1/journeys?name=eq.Bah%20Bah&active=eq.true&select=*`,

      {
        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY}`

        }

      }

    );


    const journeyText =
      await journeyResponse.text();


    if (!journeyResponse.ok) {

      throw new Error(
        `Journey error ${journeyResponse.status}: ${journeyText}`
      );

    }


    const journeys =
      JSON.parse(journeyText);


    if (!journeys.length) {

      throw new Error(
        "No active journey found."
      );

    }


    const journey =
      journeys[0];


    journeyId =
      journey.id;


    // ----------------------------------------
    // Load stages belonging to this journey
    // ----------------------------------------

    const stagesResponse = await fetch(

      `${SUPABASE_URL}/rest/v1/stages?journey_id=eq.${journeyId}&select=*&order=position.asc`,

      {

        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY}`

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
        "No stages found for this journey."
      );

    }


    // ----------------------------------------
    // Render
    // ----------------------------------------

    render(journey);


    document.getElementById(
      "status"
    ).textContent =
      "🟢 Live";

  }

  catch (error) {

    console.error(error);

    document.getElementById(
      "status"
    ).textContent =
      `⚠️ ${error.message}`;

  }

}


// ============================================
// RENDER JOURNEY
// ============================================

function render(journey) {

  const journeyElement =
    document.getElementById(
      "journey"
    );


  if (!journeyElement) {

    console.error(
      "Journey element missing"
    );

    return;

  }


  // ----------------------------------------
  // Clear timeline
  // ----------------------------------------

  journeyElement.innerHTML = "";


  // ----------------------------------------
  // Create stages
  // ----------------------------------------

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


      // Completed

      if (
        position <
        journey.current_stage
      ) {

        element.classList.add(
          "completed"
        );

      }


      // Current

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


  // ----------------------------------------
  // Current stage
  // ----------------------------------------

  const currentIndex =
    journey.current_stage - 1;


  const currentStage =
    stages[currentIndex];


  if (!currentStage) {

    console.error(
      "Current stage not found:",
      journey.current_stage
    );

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
      currentStage.emoji;


    currentTitle.textContent =
      currentStage.title;

  }


  // ----------------------------------------
  // PROGRESS
  // ----------------------------------------

  let progress =
    Number(
      journey.progress
    );


  if (
    Number.isNaN(progress)
  ) {

    progress = 0;

  }


  // Keep between 0 and 100

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


  // ----------------------------------------
  // UP NEXT
  // ----------------------------------------

  const upNext =
    document.getElementById(
      "upNext"
    );


  if (upNext) {

    if (
      journey.current_stage <
      stages.length
    ) {

      const nextStage =
        stages[
          journey.current_stage
        ];


      upNext.textContent =
        `${nextStage.emoji} ${nextStage.title}`;

    }

    else {

      upNext.textContent =
        "🎉 Journey complete!";

    }

  }


  // ----------------------------------------
  // LAST UPDATED
  // ----------------------------------------

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
// SUPABASE REALTIME
// ============================================

function connectRealtime() {

  const websocketUrl =

    SUPABASE_URL

      .replace(
        "https://",
        "wss://"
      )

      .replace(
        "http://",
        "ws://"
      )

      +
      "/realtime/v1/websocket?apikey="
      +
      SUPABASE_ANON_KEY
      +
      "&vsn=1.0.0";


  const socket =
    new WebSocket(
      websocketUrl
    );


  socket.onopen =
    () => {

      console.log(
        "Realtime connected"
      );


      // Join the realtime channel

      socket.send(

        JSON.stringify({

          topic:
            "realtime:journey",

          event:
            "phx_join",

          payload: {},

          ref:
            "1"

        })

      );

    };


  socket.onmessage =
    event => {

      try {

        const message =
          JSON.parse(
            event.data
          );


        if (
          message.event ===
          "postgres_changes"
        ) {

          loadJourney();

        }

      }

      catch (error) {

        console.error(
          "Realtime error:",
          error
        );

      }

    };


  socket.onclose =
    () => {

      document.getElementById(
        "status"
      ).textContent =
        "🟡 Reconnecting...";


      setTimeout(
        connectRealtime,
        3000
      );

    };

}


// ============================================
// START
// ============================================

loadJourney()
  .then(
    connectRealtime
  )
  .catch(
    error => {

      console.error(
        error
      );

    }
  );

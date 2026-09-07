// ============================================
// BAH BAH FAMILY VIEW
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


// ============================================
// LOAD
// ============================================

async function loadJourney() {

  const response = await fetch(

    `${SUPABASE_URL}/rest/v1/journeys?name=eq.Bah%20Bah&select=*`,

    {

      headers: {

        apikey:
          SUPABASE_ANON_KEY,

        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`

      }

    }

  );


  if (!response.ok) {

    throw new Error(
      `Supabase error ${response.status}`
    );

  }


  const journeys =
    await response.json();


  if (!journeys.length) {

    throw new Error(
      "Journey not found"
    );

  }


  const journey =
    journeys[0];


  journeyId =
    journey.id;


  render(journey);


  document.getElementById(
    "status"
  ).textContent =
    "🟢 Live";

}


// ============================================
// RENDER
// ============================================

function render(journey) {

  const journeyElement =
    document.getElementById(
      "journey"
    );


  journeyElement.innerHTML =
    "";


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


  // Current stage

  const stage =
    stages[
      journey.current_stage - 1
    ];


  document.getElementById(
    "currentEmoji"
  ).textContent =
    stage.emoji;


  document.getElementById(
    "currentTitle"
  ).textContent =
    stage.title;


  // Progress

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


  document.getElementById(
    "progressBar"
  ).style.width =
    `${progress}%`;


  document.getElementById(
    "progressText"
  ).textContent =
    `${progress}%`;


  // Up next

  const upNext =
    document.getElementById(
      "upNext"
    );


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


  // Updated time

  if (
    journey.updated_at
  ) {

    const date =
      new Date(
        journey.updated_at
      );


    document.getElementById(
      "updated"
    ).textContent =

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


      document.getElementById(
        "status"
      ).textContent =
        `⚠️ ${error.message}`;

    }
  );

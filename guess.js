var game_interval;
var state = 0;
var notesdraw;

class NotesDrawer {
  constructor() {
    // Create an SVG renderer and attach it to the DIV element named "boo".
    var div = document.getElementById("notescanvas")
    var renderer = new Vex.Flow.Renderer(div, Vex.Flow.Renderer.Backends.SVG);

    // Configure the rendering context.
    renderer.resize(500, 200);
    this.context = renderer.getContext();
    this.context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
    this.group = this.context.openGroup();
  }

  resetGroup() {
    this.context.closeGroup(this.group);
    this.context.svg.removeChild(this.group);
    this.group = this.context.openGroup();
  }

  drawInterval(note1, note2) {
    this.resetGroup();

    // Create a stave of width 400 at position 10, 40 on the canvas.
    var stave = new Vex.Flow.Stave(10, 40, 100);

    // Add a clef and time signature.
    stave.addClef("treble");//.addTimeSignature("2/4");

    // Connect it to the rendering context and draw!
    stave.setContext(this.context).draw();

    function createNote(note) {
      var stave_note = new Vex.Flow.StaveNote(
        {clef: "treble", keys: [note], duration: "q" , auto_stem: true});
      if (note[1] != '/') stave_note.addAccidental(0, new Vex.Flow.Accidental(note[1]));
      return stave_note;
    }

    var notes = [
      createNote(note1),
      createNote(note2),
    ];

    // Create a voice in 4/4 and add above notes
    var voice = new Vex.Flow.Voice({num_beats: 2,  beat_value: 4});
    voice.addTickables(notes);

    // Format and justify the notes to 400 pixels.
    var formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 100);

    // Render voice
    voice.draw(this.context, stave);
  }
};

function getNote(requested_note) {
  note = (requested_note + 5) % 12;
  var notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
  return notes[note].concat("/", parseInt(((requested_note + 5) / 12 + 3), 10));
}

function intervalButtonId(id) {
  return "#i".concat(id, "button");
}

function range(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

class Button {
  constructor(num) {
    this.id = intervalButtonId(num);
    this.num = num;
    this.enabled = false;
  }

  flip() {
    console.log("flip ".concat(this.num));
    if (this.enabled) {
      $(this.id).removeClass("btn-warning");
      $(this.id).addClass("btn-secondary");
    } else {
      $(this.id).removeClass("btn-secondary");
      $(this.id).addClass("btn-warning");
    }
    this.enabled = ! this.enabled;
  }

  reset() {
    this.enabled = false;
    $(this.id).removeClass("btn-warning");
    $(this.id).addClass("btn-secondary");
  }

  hide() {
    $(this.id).addClass("d-none");
  }

  show() {
    $(this.id).removeClass("d-none");
  }

  enabled() {
    return this.enabled();
  }
}

var buttons;

function assignIntervalClicks(list, trigger) {
}

const defaultvisibility = {
  timer: false,
  game: false,
  instructions: true,
  deselectall: false,
  start: false,
  back: false,
  points: false,
  intervalbuttons: true,
}

function maybeToggleVisibility(obj, visible) {
  if (obj.hasClass("d-none") && visible) {
    obj.removeClass("d-none");
  }
  else if (!obj.hasClass("d-none") && !visible) {
    obj.addClass("d-none");
  }
}

var visibility;

function resetPage(config) {
  visibility = config;
  maybeToggleVisibility($("#instructions"), config.instructions);
  maybeToggleVisibility($("#timergroup"), config.timer);
  maybeToggleVisibility($("#game"), config.game);
  maybeToggleVisibility($("#deselectallbutton"), config.deselectall);
  maybeToggleVisibility($("#startgroup"), config.start);
  maybeToggleVisibility($("#again"), config.start);
  maybeToggleVisibility($("#backgroup"), config.back);
  maybeToggleVisibility($("#pointsgroup"), config.points);
  maybeToggleVisibility($("#intervalbuttons"), config.intervalbuttons);
}

function initConfigPage() {
  console.log("init config");
  resetPage({ ...defaultvisibility,
    instructions: true,
    deselectall: true,
    start: true,
  });

  buttons.map(button => $(button.id).unbind());
  buttons.map(button => $(button.id).click(function() {
    button.flip(); }
  ));
  buttons.map(button => {
    button.show();
    button.reset();
    button.flip();}
  );
  $("#deselectallbutton").unbind();
  $("#deselectallbutton").click(function() {
    buttons.map(button => button.reset());
  });
  $("#startbutton").unbind();
  $("#startbutton").click(function() {
    initGameSettings();
    initGame();
  });
}

$(document).ready(function() {
  notesdraw = new NotesDrawer();
  notesdraw.drawInterval("c/4", "c/4");
  buttons = range(0, 12).map(x => new Button(x));
  initConfigPage();
});

var guesses;

function initGameSettings() {
  guesses = [];
  buttons.map(function(button) {
    if (button.enabled) {
      button.flip();
      guesses.push(button.num);
    } else {
      button.hide();
    }
  });
}

function initGame() {
  resetPage({ ...defaultvisibility,
    timer: true,
    game: true,
    instructions: false,
    deselectall: false,
    start: false,
    back: true,
    points: true,
  });
  $("#backbutton").unbind();
  $("#backbutton").click(function() {
    endGame();
    initConfigPage();
  });

  startGame();
}

function sendFeedback(positive) {
  $("#notescanvas").addClass(positive ? "bg-success" : "bg-danger");
  setTimeout(function() {
    $("#notescanvas").removeClass("bg-success");
    $("#notescanvas").removeClass("bg-danger");
  }, 200);
}

var good_answer;
var game_interval;
var countdown;

function tryGuess(num) {
  sendFeedback(num == good_answer);
  if (num == good_answer) {
    ++points;
    nextCard();
  } else {
    points = Math.max(points - 1, 0);
  }
  $("#gamepoints").text(points);

}

function nextCard() {
  var first = Math.floor(Math.random() * 33);
  good_answer = Math.floor(Math.random() * guesses.length);
  notesdraw.drawInterval(getNote(first), getNote(first + good_answer));
}

function endGame() {
  resetPage({ ...visibility,
    start: true,
    intervalbuttons: false,
  });
  $("#startbutton").unbind();
  clearInterval(game_interval);
  $("#startbutton").click(function() {
    initGame();
  });
}

function gameStep() {
  --countdown;
  $("#gametimer").text("".concat(countdown));
  if(countdown == 0) {
    endGame();
  }
}

function startGame() {
  buttons.map(button => $(button.id).unbind());
  buttons.map(button => $(button.id).click(function() {
    tryGuess(button.num);
  }));
  countdown = 100;
  game_interval = setInterval(gameStep, 1000)
  points = 0;

  nextCard();
}

window.onload = function() {

  document.querySelector("#midi-viz").config = {
    noteHeight: 7,
    pixelsPerTimeStep: 45,  // like a note width
    // noteSpacing: 1,
    noteRGB: '8, 41, 64',
    activeNoteRGB: '240, 84, 119',
  };

}

// function setupFileDropper() {

// }

// Handle File Dropper
// If these things aren't available, the site won't work
if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  $("#FileDrop #Text").text("Reading files not supported by this browser");
}
else {
  const fileDrop = $("#FileDrop");
  // const fileDrop = $("body");

  fileDrop.on({
    dragenter: () => fileDrop.addClass("Hover"),
    dragleave: () => fileDrop.removeClass("Hover"),
    drop: () => fileDrop.removeClass("Hover"),
  });

  $("#FileDrop input").on("change", (e) => {
    //get the files
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      $("#FileDrop #Text").text(file.name);
      parseFile(file);
    }
  });
}

let currentMidi = null;
function parseFile(file) {

  // Read the file as a data URL
  // Requred for midi player to accept it as src
  const reader_as_url = new FileReader();
  reader_as_url.onload = function() {
    document.querySelector('#midi-play').src = reader_as_url.result;
    document.querySelector('#midi-viz').src = reader_as_url.result;
  }
  reader_as_url.readAsDataURL(file);

  // Read file as Array
  // Required for Tone.js and to parse it as JSON
  const reader_as_buffer = new FileReader();
  reader_as_buffer.onload = function(e) {
    const midi = new Midi(e.target.result);
    $("#ResultsText").val(JSON.stringify(midi, undefined, 2));
    $("tone-play-toggle").removeAttr("disabled");
    currentMidi = midi;
    parseMidiToAdb();
  };
  reader_as_buffer.readAsArrayBuffer(file);
}

function parseMidiToAdb() {
  let notes = currentMidi.tracks[0].notes;
  let data = "";
  let prev_time = 0.07;
  let prev_duration = 0;
  let prev_frequency = 0;
  for (let i = 0; i < notes.length; i++) {
    let time = notes[i].time;
    let duration = notes[i].duration;
    let frequency = Math.pow(2, (notes[i].midi - 69) / 12) * 440;

    if (prev_time + prev_duration < time) {
      let latency_fix = 0 // delay fix = 0.07
      let delay_time = Math.max(time - prev_time - prev_duration - latency_fix, 0);
      if (delay_time >= 0) {
        data += "0," + delay_time.toFixed(3) + "\n";
      }
    }

    else if (prev_frequency == frequency) {
      // data += "0,0\n"; // delay fix
    }
    data += "0,0\n";
    data += frequency.toFixed(3) + "," + Math.max(duration - 0.07, 0).toFixed(3) + "\n";
    prev_time = time;
    prev_duration = duration;
    prev_frequency = frequency;
  }
  data += "0,0";

  // console.log(data)
  $("#midi-parsing-status").html(data)
  $("#midi-parsing-status").addClass("data-ready")
  // $('#load').prop('disabled', false);
  // $('#beep').prop('disabled', false);
  // let blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
  // saveAs(blob, 'output.txt');
}
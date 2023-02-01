TWINKLE_TWINKLE = {
  notes: [
    { pitch: 60, startTime: 0.0, endTime: 0.5 },
    { pitch: 60, startTime: 0.5, endTime: 1.0 },
    { pitch: 67, startTime: 1.0, endTime: 1.5 },
    { pitch: 67, startTime: 1.5, endTime: 2.0 },
    { pitch: 69, startTime: 2.0, endTime: 2.5 },
    { pitch: 69, startTime: 2.5, endTime: 3.0 },
    { pitch: 67, startTime: 3.0, endTime: 4.0 },
    { pitch: 65, startTime: 4.0, endTime: 4.5 },
    { pitch: 65, startTime: 4.5, endTime: 5.0 },
    { pitch: 64, startTime: 5.0, endTime: 5.5 },
    { pitch: 64, startTime: 5.5, endTime: 6.0 },
    { pitch: 62, startTime: 6.0, endTime: 6.5 },
    { pitch: 62, startTime: 6.5, endTime: 7.0 },
    { pitch: 60, startTime: 7.0, endTime: 8.0 },
  ],
  totalTime: 8
};

window.onload = function() {
  // code to run after page loads goes here
  vizPlayer = new mm.Player(false, {
    run: (note) => { viz.redraw(note) },
    stop: () => { }
  });

  config = {
    noteHeight: 6,
    pixelsPerTimeStep: 30,  // like a note width
    noteSpacing: 1,
    noteRGB: '8, 41, 64',
    activeNoteRGB: '240, 84, 119',
  }
  // Don't edit this line unless you want to break things. :)
  viz = new mm.Visualizer(TWINKLE_TWINKLE, document.getElementById('canvas'), config);

  // document.getElementById("play").addEventListener("click", function() {
  //   vizPlayer.start(TWINKLE_TWINKLE);
  //   // player.stop();
  // });

};

function startOrStop(event, p, seq = TWINKLE_TWINKLE) {
  if (p.isPlaying()) {
    p.stop();
    event.target.textContent = 'Play';
  } else {
    p.start(seq).then(() => {
      // Stop all buttons.
      // const btns = document.querySelectorAll('.controls > button');
      // for (let btn of btns) {
      //   btn.textContent = 'Play';
      // }
    });
    event.target.textContent = 'Stop';
  }
}
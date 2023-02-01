// Author: Angel Viera

import { AdbClient, KeyStore, Options, Shell, WebUsbTransport } from 'wadb';
import { WebMidi } from "webmidi";
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

// import $ from "jquery";

//////////////////////////////////////
// Buttons
//
const connectButton = (document.querySelector('#connect') as HTMLButtonElement)!;
const disconnectButton = (document.querySelector('#disconnect') as HTMLButtonElement)!;
const output = document.querySelector('#output')!;
const input = (document.querySelector('#input') as HTMLInputElement)!;
const beepButton = (document.querySelector('#beep') as HTMLButtonElement)!;
const testButton = (document.querySelector('#test') as HTMLButtonElement)!;

const midiDeviceStatus = document.querySelector('.midi-device-status') as HTMLSpanElement;
const adbDeviceStatus = document.querySelector('.adb-device-status') as HTMLSpanElement;
const terminalDiv = document.querySelector('#console-container') as HTMLElement;

//////////////////////////////////////
// Terminal
//
var term = new Terminal({
  // rows: 50
});
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
fitAddon.fit();

term.open(terminalDiv);
term.write('Plug in device and click "Connect" button...');
var curr_line = "";

function clearTerminalInput() {
  // Remove curent input. It gets sent back by ADB.
  for (let i = 0; i < curr_line.length; i++) {
    term.write("\b \b");
  }
}

term.onKey(({ key, domEvent }) => {

  if (!transport?.isAdb()) {
    return;
  }

  console.log(domEvent)

  if (domEvent.key === "ArrowUp" || domEvent.key === "ArrowDown") {
    clearTerminalInput()
    sendCommand(key, false);
  }

  else if (domEvent.key === "Tab" || domEvent.key === "Escape") {
    sendCommand(key, false);
  }

  //Enter
  else if (domEvent.key === "Enter") {
    clearTerminalInput()
    sendCommand(curr_line);
    curr_line = '';
  }
  // Backspace
  else if (domEvent.key === "Backspace") {
    if (curr_line.length > 0) {
      curr_line = curr_line.slice(0, curr_line.length - 1);
      term.write("\b \b");
    }
  } else {
    curr_line += key;
    term.write(key);
  }

});

// term.onData((termKey) => {
//   if (!transport?.isAdb()) {
//     return;
//   }

//   //Enter
//   if (termKey === "\r") {
//     // Remove curent input. It gets sent back by ADB.
//     for (let i = 0; i < curr_line.length; i++) {
//       term.write("\b \b");
//     }

//     sendCommand(curr_line);
//     curr_line = '';
//   }

//   // Backspace
//   else if (termKey === "\b" || termKey === Number(0x7F).toString()) {
//     console.log("backspace detected")
//     if (curr_line) {
//       curr_line = curr_line.slice(0, curr_line.length - 1);
//       term.write("\b \b");
//     }
//   }

//   else {
//     curr_line += termKey;
//     term.write(termKey);
//   }
// });

//////////////////////////////////////
// Crypto
//
class MyKeyStore implements KeyStore {
  private keys: CryptoKeyPair[] = [];
  async loadKeys(): Promise<CryptoKeyPair[]> {
    return this.keys;
  }

  async saveKey(key: CryptoKeyPair): Promise<void> {
    this.keys.push(key);
    console.log('Saving Key' + key);
  }
}

const options: Options = {
  debug: true,
  useChecksum: false,
  dump: false,
  keySize: 2048,
};

const keyStore = new MyKeyStore();

//////////////////////////////////////
// Functions 
//

// Store "sendCommand" queue. 
let commandQueue: Array<Function> = [];

let transport: WebUsbTransport | null = null;
let adbClient: AdbClient | null = null;
let shell: Shell | null = null;

function adbCommandCallback(text: string) {

  // Update console UI
  const span = document.createElement('span');
  span.innerText = text;
  output.appendChild(span);

  // Update xterm UI
  term.write(text);
  // output.scrollTop = output.scrollHeight;

  // execute the next (oldest) function call in queue
  if (commandQueue.length > 0) {
    let nextCommand = commandQueue.shift();
    if (nextCommand != null) {
      nextCommand();
    }
  }
}

async function sendCommand(cmd: string, newline = true) {
  if (!transport?.isAdb()) {
    // not connected to adb, cannot send
    console.log("Not connected to ADB. Cannot send.")
    disconnect()
    return false;
  }
  let nl = "";
  if (newline) { nl = "\n" }

  shell!.write(cmd + nl)
    .then()
    .catch((e) => {
      console.error('Error writing to shell.', e);
      if (String(e).includes("transferOut") || String(e).includes("transferIn")) {
        console.log("Disconnected, resetting variables and UI")
        disconnect();
      }
    });
  return true;
}

async function connect() {
  try {
    transport = await WebUsbTransport.open(options);
    adbClient = new AdbClient(transport, options, keyStore);
    await adbClient.connect();
    term.reset();
    shell = await adbClient.interactiveShell(adbCommandCallback);

    disconnectButton.disabled = false;
    connectButton.disabled = true;
  } catch (e) {
    console.error('Connection Failed: ', e);
    disconnect();
  }
}

async function disconnect() {
  if (transport != null) {
    try {
      await shell?.close();
      await transport?.close();
    } catch (e) {
      console.error('Error closing the connection', e);
    }
  }

  transport = null;
  adbClient = null;
  shell = null;
  disconnectButton.disabled = true;
  connectButton.disabled = false;
}

//////////////////////////////////////
// Event Listeners 
//

testButton.addEventListener('click', async (e) => {
  term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');
});

connectButton.addEventListener('click', async (e) => {
  connect()
});

disconnectButton.addEventListener('click', async (e) => {
  disconnect();
});

input.addEventListener('keyup', (e) => {
  // term.write(e.key)

  if (e.keyCode === 13) {
    e.preventDefault();
    sendCommand(input.value);
    input.value = '';
    return false;
  }
  return true;
});

beepButton.addEventListener('click', async (e) => {
  console.log("beep button clicked")

  // Make sure beep shell script (what actually plays the song) exists
  commandQueue.push(() => sendCommand("echo '#!/system/bin/sh\n\n\
              while IFS=, read -r freq duration\n\
              do\n\
                \tsendevent /dev/input/event1 18 1 $freq\n\
                \tsleep $duration\n\
              done </data/user/me/midi.txt' > /data/user/me/beep.sh"));

  // Make shellscript executable
  commandQueue.push(() => sendCommand("chmod +x /data/user/me/beep.sh"));

  // Load midi data to /data/user/me/midi.txt
  let beep_data = document.querySelector('#midi-parsing-status')!.innerHTML;
  commandQueue.push(() => sendCommand("echo \"" + beep_data + "\" > /data/user/me/midi.txt"));

  // Run beep.sh
  commandQueue.push(() => sendCommand("/data/user/me/beep.sh"));

  // Start command queue
  let nextCommand = commandQueue.shift();
  if (nextCommand != null) {
    nextCommand();
  }

  return true;
});

//////////////////////////////////////
// State Handler Loop 
//
setInterval(() => {

  // console.log("STATE LOOP STATUS:")
  fitAddon.fit();

  if (transport?.isAdb()) {
    // console.log("1. Connected to ADB")
    adbDeviceStatus.innerHTML = "Connected";
    adbDeviceStatus.classList.remove("text-bg-danger")
    adbDeviceStatus.classList.add("text-bg-success")

    disconnectButton.disabled = false;
    connectButton.disabled = true;
  } else {
    // console.log("1. NOT connected to ADB")
    adbDeviceStatus.innerHTML = "Unavailable";
    adbDeviceStatus.classList.add("text-bg-danger")
    adbDeviceStatus.classList.remove("text-bg-success")

    disconnectButton.disabled = true;
    connectButton.disabled = false;
  }

  // WebMidi.enabled
  // console.log("2. MIDI Devices Found: " + WebMidi.inputs.length)
  if (WebMidi.inputs.length < 1) {
    // No MIDI
    midiDeviceStatus.innerHTML = "Unavailable";
    midiDeviceStatus.classList.add("text-bg-danger")
    midiDeviceStatus.classList.remove("text-bg-success")
  } else {
    // Yes MIDI
    if (WebMidi.inputs[0].channels[1].getListenerCount("noteon") > 0) {
      // console.log("already has listener")
    } else {
      // console.log("adding listener")
      onMidiFound()
    }
    midiDeviceStatus.innerHTML = "Connected";
    midiDeviceStatus.classList.add("text-bg-success")
    midiDeviceStatus.classList.remove("text-bg-danger")
  }

  // Check if there is a MIDI file uploaded
  let midiParsingStatus = document.getElementById("midi-parsing-status");
  if (midiParsingStatus!.classList.contains("data-ready") && transport?.isAdb()) {
    beepButton.disabled = false;
  } else {
    beepButton.disabled = true;
  }


}, 1000);


//////////////////////////////////////
// MIDI
// TODO: state handling
//
WebMidi
  .enable()
  .then()
  .catch(err => console.log(err));


function onMidiFound() {
  const mySynth = WebMidi.inputs[0];

  mySynth.channels[1].addListener("noteon", e => {
    let midi_to_freq = Math.pow(2, (e.message.dataBytes[0] - 69) / 12) * 440;
    let adb_command = "sendevent /dev/input/event1 18 1 " + midi_to_freq.toFixed(3)
    sendCommand(adb_command);
  });

  mySynth.channels[1].addListener("noteoff", e => {
    let adb_command = "sendevent /dev/input/event1 18 1 0"
    sendCommand(adb_command);
  });
}

function onMidiEnabled() {
  // WebMidi.enabled
  // WebMidi.inputs.length < 1
  if (WebMidi.inputs.length < 1) {
    console.log("No MIDI device detected")
  } else {
    WebMidi.inputs.forEach((device, index) => {
      console.log(`${index}: ${device.name} <br>`);
    });
  }

}

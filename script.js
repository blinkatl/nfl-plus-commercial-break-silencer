const audioContext = new AudioContext();
const analyserStream = audioContext.createAnalyser();
const analyserFile = audioContext.createAnalyser();
let streamSource;
let fileSource;

console.log("Script loaded and running");

// Send message to background script to capture tab audio
chrome.runtime.sendMessage({ action: "captureTabAudio" });

// Listen for the stream message from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.success) {
    console.log("Successfully captured audio stream");

    const stream = message.stream;
    streamSource = audioContext.createMediaStreamSource(stream);
    streamSource.connect(analyserStream);
  } else {
    console.error("Failed to capture tab audio.");
  }
});

// Load and decode the pre-recorded commercial audio
(async function fetchCommercial() {
  try {
    const response = await fetch(chrome.runtime.getURL('commercial.mp3'));
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    fileSource = audioContext.createBufferSource();
    fileSource.buffer = audioBuffer;
    fileSource.connect(audioContext.destination);
    fileSource.connect(analyserFile);
    fileSource.start();  // Ensure the audio file plays
  } catch (error) {
    console.error('Error fetching and decoding commercial audio: ', error);
  }
})();

// Compare the audio streams
const streamFrequencyData = new Uint8Array(analyserStream.frequencyBinCount);
const fileFrequencyData = new Uint8Array(analyserFile.frequencyBinCount);

(compareAudio = () => {
  analyserStream.getByteFrequencyData(streamFrequencyData);
  analyserFile.getByteFrequencyData(fileFrequencyData);

  console.log('Live Stream Frequency Data:', streamFrequencyData);
  console.log('Commercial Audio Frequency Data:', fileFrequencyData);

  const diff = streamFrequencyData.map((value, index) => Math.abs(value - fileFrequencyData[index]));
  const sumOfDifferences = diff.reduce((sum, value) => sum + value, 0);
  const maxPossibleDifference = 255 * diff.length;
  const similarity = 1 - (sumOfDifferences / maxPossibleDifference);

  console.log('Similarity:', similarity);
  requestAnimationFrame(compareAudio);
})();
const phrases = Array.isArray(window.FRENCH_LEARNING_PHRASES)
  ? window.FRENCH_LEARNING_PHRASES
  : [];

const MATCH_TIMEOUT_MS = 8500;

const state = {
  week: "all",
  theme: "all",
  search: "",
  rate: 0.88,
  strictness: "very-strict",
  playingList: false,
  activeAudio: null,
  recorder: null,
  activeRecordId: null,
  recordingChunks: [],
  recognition: null,
  recognitionTimeout: null,
  activeMatchId: null
};

const elements = {
  weekFilter: document.querySelector("#weekFilter"),
  themeFilter: document.querySelector("#themeFilter"),
  searchInput: document.querySelector("#searchInput"),
  voiceSelect: document.querySelector("#voiceSelect"),
  rateInput: document.querySelector("#rateInput"),
  strictnessSelect: document.querySelector("#strictnessSelect"),
  playListButton: document.querySelector("#playListButton"),
  stopButton: document.querySelector("#stopButton"),
  phraseCount: document.querySelector("#phraseCount"),
  supportStatus: document.querySelector("#supportStatus"),
  appStatus: document.querySelector("#appStatus"),
  phraseList: document.querySelector("#phraseList")
};

function init() {
  populateFilters();
  bindEvents();
  updateSupportStatus();
  refreshVoices();
  renderPhrases();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    setTimeout(refreshVoices, 250);
  }
}

function bindEvents() {
  elements.weekFilter.addEventListener("change", (event) => {
    state.week = event.target.value;
    renderPhrases();
  });

  elements.themeFilter.addEventListener("change", (event) => {
    state.theme = event.target.value;
    renderPhrases();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderPhrases();
  });

  elements.rateInput.addEventListener("input", (event) => {
    state.rate = Number(event.target.value);
  });

  elements.strictnessSelect.addEventListener("change", (event) => {
    state.strictness = event.target.value;
    setStatus(`Matching strictness set to ${titleCase(state.strictness)}.`);
  });

  elements.playListButton.addEventListener("click", playVisibleList);
  elements.stopButton.addEventListener("click", stopAll);

  elements.phraseList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const card = button.closest(".phrase-card");
    const phrase = phrases.find((item) => item.id === card.dataset.id);
    if (!phrase) return;

    const action = button.dataset.action;
    if (action === "listen") speakPhrase(phrase, false);
    if (action === "slow") speakPhrase(phrase, true);
    if (action === "record") toggleRecording(phrase.id);
    if (action === "match") startRecognition(phrase);
  });
}

function populateFilters() {
  const weeks = [...new Set(phrases.map((phrase) => phrase.week))].sort();
  const themes = [...new Set(phrases.map((phrase) => phrase.theme))].sort();

  for (const week of weeks) {
    const option = document.createElement("option");
    option.value = String(week);
    option.textContent = `Week ${week}`;
    elements.weekFilter.append(option);
  }

  for (const theme of themes) {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = titleCase(theme);
    elements.themeFilter.append(option);
  }
}

function updateSupportStatus() {
  const support = [];
  support.push("speechSynthesis" in window ? "TTS ready" : "No TTS");
  support.push(canRecord() ? "recording ready" : "no recorder");
  support.push(getRecognitionConstructor() ? "matching optional" : "matching unavailable");
  elements.supportStatus.textContent = support.join(" / ");
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;

  const selected = elements.voiceSelect.value;
  const frenchVoices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("fr"))
    .sort((a, b) => a.name.localeCompare(b.name));

  elements.voiceSelect.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = frenchVoices.length ? "Auto French voice" : "No French voice found";
  elements.voiceSelect.append(auto);

  for (const voice of frenchVoices) {
    const option = document.createElement("option");
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} (${voice.lang})`;
    elements.voiceSelect.append(option);
  }

  elements.voiceSelect.value = [...elements.voiceSelect.options].some((option) => option.value === selected)
    ? selected
    : "";
}

function getVisiblePhrases() {
  return phrases.filter((phrase) => {
    const matchesWeek = state.week === "all" || String(phrase.week) === state.week;
    const matchesTheme = state.theme === "all" || phrase.theme === state.theme;
    const searchable = `${phrase.french} ${phrase.english} ${phrase.theme}`.toLowerCase();
    const matchesSearch = !state.search || searchable.includes(state.search);
    return matchesWeek && matchesTheme && matchesSearch;
  });
}

function renderPhrases() {
  const visible = getVisiblePhrases();
  elements.phraseCount.textContent = `${visible.length} ${visible.length === 1 ? "phrase" : "phrases"}`;
  elements.phraseList.innerHTML = "";

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No phrases match the current filters.";
    elements.phraseList.append(empty);
    return;
  }

  const recognitionAvailable = Boolean(getRecognitionConstructor());
  const fragment = document.createDocumentFragment();

  for (const phrase of visible) {
    fragment.append(createPhraseCard(phrase, recognitionAvailable));
  }

  elements.phraseList.append(fragment);
}

function createPhraseCard(phrase, recognitionAvailable) {
  const article = document.createElement("article");
  article.className = "phrase-card";
  article.dataset.id = phrase.id;

  const meta = document.createElement("div");
  meta.className = "phrase-meta";
  meta.append(createTagRow([`Week ${phrase.week}`, titleCase(phrase.theme)]));

  const slow = document.createElement("span");
  slow.className = "tag";
  slow.textContent = phrase.slow;
  meta.append(slow);

  const french = document.createElement("p");
  french.className = "phrase-french";
  french.textContent = phrase.french;

  const english = document.createElement("p");
  english.className = "phrase-english";
  english.textContent = phrase.english;

  const ipa = document.createElement("p");
  ipa.className = "ipa";
  ipa.textContent = phrase.ipa;

  const focus = document.createElement("p");
  focus.className = "focus";
  focus.textContent = phrase.focus;

  const checkpoints = document.createElement("ul");
  checkpoints.className = "checkpoints";
  for (const checkpoint of phrase.checkpoints) {
    const item = document.createElement("li");
    item.textContent = checkpoint;
    checkpoints.append(item);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.append(
    createActionButton("Listen", "listen"),
    createActionButton("Slow", "slow", "secondary"),
    createActionButton("Record", "record", "practice"),
    createActionButton("Match", "match", "warning", !recognitionAvailable)
  );

  const recordingSlot = document.createElement("div");
  recordingSlot.className = "recording-slot";
  recordingSlot.id = `recording-${phrase.id}`;

  const matchSlot = document.createElement("div");
  matchSlot.className = "match-slot";
  matchSlot.id = `match-${phrase.id}`;

  article.append(meta, french, english, ipa, focus, checkpoints, actions, recordingSlot, matchSlot);
  return article;
}

function createTagRow(tags) {
  const row = document.createElement("div");
  row.className = "tag-row";
  for (const tagText of tags) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tagText;
    row.append(tag);
  }
  return row;
}

function createActionButton(label, action, className = "", disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;
  button.disabled = disabled;
  if (className) button.className = className;
  return button;
}

function speakPhrase(phrase, slow) {
  stopSpeechOnly();

  if (phrase.audioFile) {
    playAudioFile(phrase, slow);
    return;
  }

  speakText(phrase.french, slow ? Math.max(0.62, state.rate - 0.18) : state.rate);
}

function playAudioFile(phrase, slow) {
  const audio = new Audio(`../../assets/audio/${phrase.audioFile}`);
  audio.playbackRate = slow ? 0.82 : 1;
  state.activeAudio = audio;
  setStatus(`Playing local audio: ${phrase.french}`);

  audio.addEventListener("ended", () => {
    state.activeAudio = null;
    setStatus("Ready.");
  });

  audio.addEventListener("error", () => {
    state.activeAudio = null;
    setStatus("Local audio was not found. Using browser voice.");
    speakText(phrase.french, slow ? Math.max(0.62, state.rate - 0.18) : state.rate);
  });

  audio.play().catch(() => {
    state.activeAudio = null;
    speakText(phrase.french, slow ? Math.max(0.62, state.rate - 0.18) : state.rate);
  });
}

function speakText(text, rate) {
  if (!("speechSynthesis" in window)) {
    setStatus("Speech synthesis is not available in this browser.");
    return Promise.resolve();
  }

  const cleanText = text.replace(/\.\.\./g, "").replace(/\([^)]*\)/g, "");
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "fr-FR";
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = getSelectedVoice();
  if (voice) utterance.voice = voice;

  setStatus(`Listening: ${cleanText}`);

  return new Promise((resolve) => {
    utterance.onend = () => {
      setStatus("Ready.");
      resolve();
    };
    utterance.onerror = () => {
      setStatus("The selected voice could not play this phrase.");
      resolve();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

function getSelectedVoice() {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const selectedUri = elements.voiceSelect.value;
  if (selectedUri) return voices.find((voice) => voice.voiceURI === selectedUri) || null;

  return (
    voices.find((voice) => voice.lang === "fr-FR") ||
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("fr")) ||
    null
  );
}

async function playVisibleList() {
  const visible = getVisiblePhrases();
  if (!visible.length) return;

  state.playingList = true;
  elements.playListButton.disabled = true;

  for (const phrase of visible) {
    if (!state.playingList) break;
    await speakText(phrase.french, state.rate);
    await delay(220);
  }

  state.playingList = false;
  elements.playListButton.disabled = false;
  setStatus("Ready.");
}

function stopAll() {
  state.playingList = false;
  elements.playListButton.disabled = false;
  stopSpeechOnly();
  stopRecognition();

  if (state.recorder && state.recorder.state === "recording") {
    state.recorder.stop();
  }

  setStatus("Stopped.");
}

function stopSpeechOnly() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

  if (state.activeAudio) {
    state.activeAudio.pause();
    state.activeAudio.currentTime = 0;
    state.activeAudio = null;
  }
}

function canRecord() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

async function toggleRecording(phraseId) {
  if (!canRecord()) {
    setStatus("Recording is not available in this browser. Try localhost in a current browser.");
    return;
  }

  if (state.recorder && state.activeRecordId === phraseId) {
    state.recorder.stop();
    return;
  }

  if (state.recorder && state.recorder.state === "recording") {
    state.recorder.stop();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getRecordingMimeType();
    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);

    state.recorder = recorder;
    state.activeRecordId = phraseId;
    state.recordingChunks = [];

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) state.recordingChunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(state.recordingChunks, { type: mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      showRecording(phraseId, url, mimeType || "audio/webm");
      setRecordButtonsIdle();
      state.recorder = null;
      state.activeRecordId = null;
      state.recordingChunks = [];
      setStatus("Recording ready for playback.");
    });

    recorder.start();
    setStatus("Recording. Speak the phrase, then press Stop on the same card.");
    setRecordButtonRecording(phraseId);
  } catch (error) {
    setStatus(`Microphone could not start: ${error.message}`);
  }
}

function getRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function setRecordButtonRecording(phraseId) {
  setRecordButtonsIdle();
  const card = document.querySelector(`.phrase-card[data-id="${phraseId}"]`);
  const button = card && card.querySelector('button[data-action="record"]');
  if (!button) return;
  button.textContent = "Stop";
  button.classList.remove("practice");
  button.classList.add("danger");
}

function setRecordButtonsIdle() {
  document.querySelectorAll('button[data-action="record"]').forEach((button) => {
    button.textContent = "Record";
    button.classList.remove("danger");
    button.classList.add("practice");
  });
}

function showRecording(phraseId, url, mimeType) {
  const slot = document.getElementById(`recording-${phraseId}`);
  if (!slot) return;

  slot.innerHTML = "";
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  const link = document.createElement("a");
  const extension = mimeType.includes("mp4") ? "m4a" : "webm";
  link.href = url;
  link.download = `${phraseId}.${extension}`;
  link.textContent = "Download recording";

  slot.append(audio, link);
}

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function startRecognition(phrase) {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    setStatus("Speech recognition matching is not available in this browser.");
    return;
  }

  stopRecognition();
  const recognition = new Recognition();
  state.recognition = recognition;
  state.activeMatchId = phrase.id;

  recognition.lang = "fr-FR";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  showMatchNotice(
    phrase.id,
    "Listening for transcript match. Speak now; this will stop automatically if the browser does not answer.",
    "listening"
  );
  setMatchButtonListening(phrase.id);
  setStatus(`Matching: ${phrase.french}. Speak now.`);

  state.recognitionTimeout = window.setTimeout(() => {
    if (state.recognition === recognition) {
      showMatchNotice(
        phrase.id,
        "No transcript came back. This browser may be waiting on its speech-recognition service. Try again, or use Record and compare your playback.",
        "warning"
      );
      stopRecognition("timed-out");
      setStatus("Transcript matching timed out.");
    }
  }, MATCH_TIMEOUT_MS);

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0] && event.results[0][0] ? event.results[0][0].transcript : "";
    if (!transcript) {
      clearRecognitionTimeout();
      showMatchNotice(phrase.id, "I heard audio, but no transcript was returned. Try speaking a little louder or use Record.", "warning");
      setMatchButtonsIdle();
      setStatus("No transcript was returned.");
      return;
    }

    const confidence = Math.round((event.results[0][0].confidence || 0) * 100);
    const score = scoreTranscript(phrase.french, transcript, confidence);
    clearRecognitionTimeout();
    showMatchResult(phrase.id, transcript, score, confidence);
    setMatchButtonsIdle();
    setStatus("Transcript match complete.");
  });

  recognition.addEventListener("error", (event) => {
    if (event.error === "aborted" && state.recognition !== recognition) return;

    clearRecognitionTimeout();
    showMatchNotice(phrase.id, getRecognitionErrorMessage(event.error), "warning");
    setMatchButtonsIdle();
    setStatus("Recognition stopped before a result was returned.");
  });

  recognition.addEventListener("nomatch", () => {
    clearRecognitionTimeout();
    showMatchNotice(phrase.id, "No clear French transcript was detected. Try again or use Record for self-review.", "warning");
    setMatchButtonsIdle();
    setStatus("No transcript match was detected.");
  });

  recognition.addEventListener("end", () => {
    clearRecognitionTimeout();
    setMatchButtonsIdle();
    if (state.recognition === recognition) {
      state.recognition = null;
      state.activeMatchId = null;
    }
  });

  try {
    recognition.start();
  } catch (error) {
    clearRecognitionTimeout();
    state.recognition = null;
    state.activeMatchId = null;
    showMatchNotice(phrase.id, `Recognition could not start: ${error.message}`, "warning");
    setMatchButtonsIdle();
    setStatus("Recognition could not start.");
  }
}

function stopRecognition(reason = "stopped") {
  if (state.recognition) {
    const matchId = state.activeMatchId;
    const recognition = state.recognition;
    clearRecognitionTimeout();
    state.recognition = null;
    state.activeMatchId = null;
    recognition.abort();
    setMatchButtonsIdle();

    if (reason === "stopped" && matchId) {
      showMatchNotice(matchId, "Transcript matching stopped.", "warning");
    }
  }
}

function clearRecognitionTimeout() {
  if (state.recognitionTimeout) {
    window.clearTimeout(state.recognitionTimeout);
    state.recognitionTimeout = null;
  }
}

function setMatchButtonListening(phraseId) {
  setMatchButtonsIdle();
  const card = document.querySelector(`.phrase-card[data-id="${phraseId}"]`);
  const button = card && card.querySelector('button[data-action="match"]');
  if (!button) return;
  button.textContent = "Wait";
  button.disabled = true;
}

function setMatchButtonsIdle() {
  document.querySelectorAll('button[data-action="match"]').forEach((button) => {
    button.textContent = "Match";
    button.disabled = !getRecognitionConstructor();
  });
}

function showMatchNotice(phraseId, message, type = "info") {
  const slot = document.getElementById(`match-${phraseId}`);
  if (!slot) return;

  slot.innerHTML = "";
  const notice = document.createElement("div");
  notice.className = `match-result ${type}`;
  notice.textContent = message;
  slot.append(notice);
}

function getRecognitionErrorMessage(errorCode) {
  const messages = {
    "audio-capture": "The microphone could not be captured. Check browser microphone permission.",
    "network": "Speech recognition needs the browser service, and the network request failed. Use Record for offline practice.",
    "no-speech": "No speech was detected. Try again and speak right after pressing Match.",
    "not-allowed": "Microphone permission was blocked. Allow microphone access for this local site.",
    "service-not-allowed": "This browser blocked its speech-recognition service. Use Record for self-review.",
    "aborted": "Transcript matching was stopped."
  };

  return messages[errorCode] || `Recognition error: ${errorCode || "unknown"}. Use Record if matching keeps failing.`;
}

function showMatchResult(phraseId, transcript, score, confidence) {
  const slot = document.getElementById(`match-${phraseId}`);
  if (!slot) return;

  slot.innerHTML = "";
  const result = document.createElement("div");
  result.className = "match-result";

  const scoreLine = document.createElement("strong");
  scoreLine.textContent = `${titleCase(state.strictness)} transcript match: ${score}%`;

  const transcriptLine = document.createElement("div");
  transcriptLine.textContent = `Heard: ${transcript}`;

  const note = document.createElement("div");
  note.textContent = confidence
    ? `Recognition confidence: ${confidence}%. This is stricter, but still not native phoneme scoring.`
    : "This checks recognized words strictly, not exact native phoneme quality.";

  result.append(scoreLine, transcriptLine, note);
  slot.append(result);
}

function scoreTranscript(target, transcript, confidence = 0) {
  const a = normalizeForScore(target);
  const b = normalizeForScore(transcript);
  if (!a || !b) return 0;

  const distance = levenshtein(a, b);
  const similarity = 1 - distance / Math.max(a.length, b.length);
  const targetWords = a.split(" ").filter(Boolean);
  const spokenWords = b.split(" ").filter(Boolean);
  const confidenceRatio = confidence > 0 ? confidence / 100 : 0.72;

  if (state.strictness === "normal") {
    const targetWordSet = new Set(targetWords);
    const spokenWordSet = new Set(spokenWords);
    const covered = [...targetWordSet].filter((word) => spokenWordSet.has(word)).length;
    const coverage = targetWordSet.size ? covered / targetWordSet.size : 0;
    return clampScore((similarity * 0.55 + coverage * 0.45) * 100);
  }

  const orderedRatio = orderedWordRatio(targetWords, spokenWords);
  const lengthRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
  const sameWordCount = targetWords.length === spokenWords.length;
  const exactPhrase = a === b;

  if (state.strictness === "strict") {
    let score = (similarity * 0.42 + orderedRatio * 0.38 + lengthRatio * 0.12 + confidenceRatio * 0.08) * 100;
    if (!exactPhrase) score = Math.min(score, 88);
    if (!sameWordCount) score = Math.min(score, 72);
    if (orderedRatio < 1) score = Math.min(score, 82);
    return clampScore(score);
  }

  if (exactPhrase) {
    return clampScore(confidence > 0 ? 82 + confidenceRatio * 18 : 88);
  }

  let score = (similarity * 0.34 + orderedRatio * 0.46 + lengthRatio * 0.1 + confidenceRatio * 0.1) * 100;
  score = Math.min(score, 72);
  if (!sameWordCount) score = Math.min(score, 58);
  if (orderedRatio < 0.75) score = Math.min(score, 45);
  return clampScore(score);
}

function orderedWordRatio(targetWords, spokenWords) {
  const maxWords = Math.max(targetWords.length, spokenWords.length);
  if (!maxWords) return 0;

  let matches = 0;
  for (let index = 0; index < maxWords; index += 1) {
    if (targetWords[index] && spokenWords[index] && targetWords[index] === spokenWords[index]) {
      matches += 1;
    }
  }

  return matches / maxWords;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeForScore(text) {
  return text
    .toLowerCase()
    .replace(/\u0153/g, "oe")
    .replace(/\u00e6/g, "ae")
    .replace(/\([^)]*\)/g, "")
    .replace(/\.\.\./g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function titleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setStatus(message) {
  elements.appStatus.textContent = message;
}

init();

// Replace these placeholders with your real Telegram bot credentials.
const BOT_TOKEN = 'YOUR_BOT_TOKEN';
const CHAT_ID = 'YOUR_CHAT_ID';
const EMAIL_ENDPOINT = '/api/date-notify';

const views = [...document.querySelectorAll('.view')];
const dots = [...document.querySelectorAll('.dot')];
const yesButton = document.querySelector('#yes-btn');
const noButton = document.querySelector('#no-btn');
const dateForm = document.querySelector('#date-form');
const dateNote = document.querySelector('#date-note');
const timeInput = document.querySelector('#time-input');
const timeNote = document.querySelector('#time-note');
const formNote = document.querySelector('#form-note');
const presetDateButton = document.querySelector('#preset-date-btn');
const customDateButton = document.querySelector('#custom-date-btn');
const warningYesButton = document.querySelector('#warning-yes-btn');
const warningNoButton = document.querySelector('#warning-no-btn');
const reminderNextButton = document.querySelector('#reminder-next-btn');
const foodGrid = document.querySelector('#food-grid');
const summaryCard = document.querySelector('#summary-card');
const heartOverlay = document.querySelector('#heart-overlay');
const nextButtons = [...document.querySelectorAll('[data-next-step]')];
const panel = document.querySelector('.panel');
const firstView = document.querySelector('.view[data-step="1"]');
const presetDateValue = '2026-06-05';
const secondDateValue = '2026-06-06';
const TALK_ONLY_TIME_VALUE = 'Just talking in the car';
const foodImage = document.querySelector('.food-image');
const reminderImage = document.querySelector('.reminder-image');

const state = {
  step: 1,
  date: '',
  time: '',
  food: ''
};

function showStep(stepNumber) {
  state.step = stepNumber;

  views.forEach((view) => {
    view.classList.toggle('active', Number(view.dataset.step) === stepNumber);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === stepNumber - 1);
  });
}

function getFormattedDate(rawDate) {
  if (!rawDate) {
    return 'Not selected';
  }

  const parsedDate = new Date(`${rawDate}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return parsedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function updateSummary() {
  summaryCard.innerHTML = `
    <div class="summary-line"><span>📅</span><span>${getFormattedDate(state.date)}</span></div>
    <div class="summary-line"><span>⏰</span><span>${state.time || 'Not selected'}</span></div>
    <div class="summary-line"><span>🍽️</span><span>${state.food || 'Not selected'}</span></div>
  `;
}

function resolveImageSource(imageElement, candidates) {
  if (!imageElement || !candidates.length) {
    return;
  }

  let candidateIndex = 0;

  const tryNextCandidate = () => {
    if (candidateIndex >= candidates.length) {
      imageElement.removeEventListener('error', tryNextCandidate);
      return;
    }

    imageElement.src = candidates[candidateIndex];
    candidateIndex += 1;
  };

  imageElement.addEventListener('error', tryNextCandidate);
  tryNextCandidate();
}

function setDateMode(mode) {
  const usePreset = mode === 'preset';

  presetDateButton?.classList.toggle('active', usePreset);
  customDateButton?.classList.toggle('active', !usePreset);
  state.date = usePreset ? presetDateValue : secondDateValue;

  if (dateNote) {
    dateNote.textContent = usePreset
      ? 'June 5 feels right to me anyway. 💗'
      : 'June 6 works too, but that sad face is because I want to see you sooner. ☹️💗';
  }
}

function updateTimeNote() {
  if (!timeNote) {
    return;
  }

  if (timeInput.value === 'Whenever you can — time is not a problem') {
    timeNote.textContent =
      'Perfect. I care more about seeing you than the exact time.';
    return;
  }

  if (timeInput.value === 'We will figure it out together') {
    timeNote.textContent =
      'That works for me. We can make the plan soft, easy, and cute together.';
    return;
  }

  if (timeInput.value === 'Sunset drive and a sweet view') {
    timeNote.textContent =
      'That is already cute. See? You do have good ideas.';
    return;
  }

  if (timeInput.value === TALK_ONLY_TIME_VALUE) {
    timeNote.textContent =
      'That is cute, but only talking in the car feels dangerously close to the saddest option.';
    return;
  }

  timeNote.textContent = '';
}

function moveNoButton() {
  if (!noButton || !firstView || !yesButton || state.step !== 1) {
    return;
  }

  const boundsRect = firstView.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();
  const padding = window.innerWidth <= 520 ? 12 : 20;
  const maxX = Math.max(padding, boundsRect.width - buttonRect.width - padding);
  const maxY = Math.max(padding, boundsRect.height - buttonRect.height - padding);

  noButton.classList.add('is-fleeing');

  const yesArea = {
    left: yesRect.left - boundsRect.left - 18,
    right: yesRect.right - boundsRect.left + 18,
    top: yesRect.top - boundsRect.top - 18,
    bottom: yesRect.bottom - boundsRect.top + 18
  };

  let nextLeft = Math.random() * maxX;
  let nextTop = Math.random() * maxY;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidateLeft = Math.random() * maxX;
    const candidateTop = Math.random() * maxY;
    const overlapsYes =
      candidateLeft < yesArea.right &&
      candidateLeft + buttonRect.width > yesArea.left &&
      candidateTop < yesArea.bottom &&
      candidateTop + buttonRect.height > yesArea.top;

    if (!overlapsYes) {
      nextLeft = candidateLeft;
      nextTop = candidateTop;
      break;
    }
  }

  noButton.style.left = `${nextLeft}px`;
  noButton.style.top = `${nextTop}px`;
}

function resetNoButtonPosition() {
  if (!noButton) {
    return;
  }

  noButton.classList.remove('is-fleeing');
  noButton.style.left = '';
  noButton.style.top = '';
  noButton.style.transform = '';

  if (warningNoButton) {
    warningNoButton.classList.remove('is-fleeing');
    warningNoButton.style.left = '';
    warningNoButton.style.top = '';
    warningNoButton.style.transform = '';
  }
}

function moveFleeButton(button, container) {
  if (!button || !container) {
    return;
  }

  const boundsRect = container.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const padding = window.innerWidth <= 520 ? 12 : 20;
  const maxX = Math.max(padding, boundsRect.width - buttonRect.width - padding);
  const maxY = Math.max(padding, boundsRect.height - buttonRect.height - padding);
  const nextLeft = Math.random() * maxX;
  const nextTop = Math.random() * maxY;

  button.classList.add('is-fleeing');
  button.style.left = `${nextLeft}px`;
  button.style.top = `${nextTop}px`;
}

async function sendTelegramMessage() {
  const hasPlaceholders =
    BOT_TOKEN === 'YOUR_BOT_TOKEN' || CHAT_ID === 'YOUR_CHAT_ID';

  if (hasPlaceholders) {
    return;
  }

  const message = `🎉 New Date Response!
📅 Date: ${getFormattedDate(state.date)}
⏰ Time: ${state.time}
🍕 Food Choice: ${state.food}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Unable to send Telegram message:', error);
  }
}

async function sendEmailNotification() {
  if (EMAIL_ENDPOINT === 'YOUR_PRIVATE_EMAIL_ENDPOINT') {
    return;
  }

  try {
    const response = await fetch(EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: getFormattedDate(state.date),
        time: state.time,
        food: state.food
      })
    });

    if (!response.ok) {
      throw new Error(`Email request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Unable to send email notification:', error);
  }
}

function spawnHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = Math.random() > 0.45 ? '💗' : '♥';
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
  heart.style.setProperty('--duration', `${5 + Math.random() * 4}s`);
  heart.style.setProperty('--size', `${0.8 + Math.random() * 1.2}rem`);

  heartOverlay.appendChild(heart);
  heart.addEventListener('animationend', () => heart.remove(), { once: true });
}

let heartInterval = null;

function startHearts() {
  if (heartInterval) {
    return;
  }

  for (let index = 0; index < 10; index += 1) {
    window.setTimeout(spawnHeart, index * 180);
  }

  heartInterval = window.setInterval(spawnHeart, 700);
}

function stopHearts() {
  if (!heartInterval) {
    return;
  }

  window.clearInterval(heartInterval);
  heartInterval = null;
}

yesButton?.addEventListener('click', () => {
  showStep(2);
});

nextButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showStep(Number(button.dataset.nextStep));
  });
});

presetDateButton?.addEventListener('click', () => {
  setDateMode('preset');
});

customDateButton?.addEventListener('click', () => {
  setDateMode('custom');
});

timeInput?.addEventListener('change', updateTimeNote);

['mouseenter', 'pointerdown', 'touchstart', 'focus'].forEach((eventName) => {
  noButton?.addEventListener(eventName, (event) => {
    event.preventDefault();
    moveNoButton();
  });
});

noButton?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  moveNoButton();
});

const warningContainer = warningNoButton?.closest('.action-row-warning');

['mouseenter', 'pointerdown', 'touchstart', 'focus'].forEach((eventName) => {
  warningNoButton?.addEventListener(eventName, (event) => {
    event.preventDefault();
    moveFleeButton(warningNoButton, warningContainer);
  });
});

warningNoButton?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  moveFleeButton(warningNoButton, warningContainer);
});

window.addEventListener('resize', () => {
  if (state.step === 1) {
    resetNoButtonPosition();
  }
});

dateForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!state.date || !timeInput.value) {
    formNote.textContent = 'Pick the day and the vibe so I can be dramatic on schedule.';
    return;
  }

  state.time = timeInput.value;
  formNote.textContent = '';
  showStep(state.time === TALK_ONLY_TIME_VALUE ? 4 : 5);
});

warningYesButton?.addEventListener('click', () => {
  state.time = '';
  timeInput.value = '';
  updateTimeNote();
  showStep(3);
});

reminderNextButton?.addEventListener('click', () => {
  showStep(7);
  startHearts();
});

foodGrid?.addEventListener('click', async (event) => {
  const button = event.target.closest('.food-card');

  if (!button) {
    return;
  }

  state.food = button.dataset.food || '';

  if (state.food === 'Only Talking') {
    showStep(4);
    return;
  }

  updateSummary();
  showStep(6);
  await sendTelegramMessage();
  await sendEmailNotification();
});

resetNoButtonPosition();
setDateMode('preset');
updateTimeNote();
updateSummary();
stopHearts();

resolveImageSource(foodImage, [
  'white-cat-full-of-food-sticker.png',
  'white-cat-full-of-food-sticker.jpg',
  'white-cat-full-of-food-sticker.jpeg',
  'White Cat Full of Food Sticker.png',
  'White Cat Full of Food Sticker.jpg',
  'sent-isolated-w.png',
  'n1n1.png',
  'n1n1.jpg',
  'n1n1.jpeg',
  'n1n1.webp',
  'n1n1/n1n1.png',
  'n1n1/n1n1.jpg',
  'n1n1'
]);

resolveImageSource(reminderImage, [
  'love-background-design.png',
  'love-background-design.jpg',
  'love-background-design.jpeg',
  'love-background-design.webp',
  'love-background-design'
]);

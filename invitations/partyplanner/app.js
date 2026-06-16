let PB_URL = localStorage.getItem('pb_url') || 'https://tumid-kiltlike-maia.ngrok-free.dev';
let pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
pb.beforeSend = function(url, options) {
  options.headers = Object.assign({}, options.headers, { 'ngrok-skip-browser-warning': 'true' });
  return { url, options };
};

const DEFAULT_COLLECTION = 'party_plans';
const DEFAULT_SLUG = new URLSearchParams(location.search).get('plan') || 'default';
const DEFAULT_PASSWORD = 'partyplan';

const defaultPlan = {
  mode: 'trip',
  title: 'Lake Weekend Food Plan',
  description: 'A shared plan for meals, snacks, arrivals, and who is bringing what.',
  eventFor: 'Fourth of July weekend',
  inviteHeading: 'Food, friends, and a little coordination',
  dates: 'July 3-6, 2026',
  location: 'Cabin on Cedar Lake',
  timeWindow: 'Check-in after 4:00 PM',
  people: [
    { name: 'Alex', arrival: 'Friday 5:30 PM', departure: 'Sunday afternoon', bringing: 'Breakfast burrito ingredients, coffee' },
    { name: 'Jamie', arrival: 'Friday 7:00 PM', departure: 'Monday morning', bringing: 'Grill pack, burger buns' },
    { name: 'Taylor', arrival: 'Saturday 10:00 AM', departure: 'Sunday night', bringing: 'Fruit, chips, sparkling water' }
  ],
  days: [
    {
      label: 'Friday',
      date: 'July 3',
      meals: {
        breakfast: { title: 'On your own', owner: '', notes: 'Grab something before heading out.' },
        lunch: { title: 'Road snacks', owner: 'Everyone', notes: 'Keep it simple while people travel.' },
        dinner: { title: 'Grill night', owner: 'Jamie', notes: 'Burgers, brats, veggie skewers, salad.' }
      }
    },
    {
      label: 'Saturday',
      date: 'July 4',
      meals: {
        breakfast: { title: 'Breakfast burritos', owner: 'Alex', notes: 'Eggs, potatoes, salsa, tortillas.' },
        lunch: { title: 'Sandwich bar', owner: 'Taylor', notes: 'Meat, cheese, spreads, pickles, fruit.' },
        dinner: { title: 'Taco spread', owner: 'Morgan', notes: 'Tortillas, protein, rice, beans, toppings.' }
      }
    },
    {
      label: 'Sunday',
      date: 'July 5',
      meals: {
        breakfast: { title: 'Bagels and fruit', owner: 'Casey', notes: 'Cream cheese, fruit tray, coffee refill.' },
        lunch: { title: 'Leftovers', owner: 'Everyone', notes: 'Use up grill and taco extras.' },
        dinner: { title: 'Pizza order', owner: 'Group', notes: 'Order after the beach.' }
      }
    }
  ],
  partyMeals: [
    { label: 'Mains', title: 'Pulled pork sliders and veggie wraps', owner: 'Host', notes: 'Ready by 6:30 PM.' },
    { label: 'Sides', title: 'Pasta salad, fruit tray, chips', owner: 'Guests', notes: 'Claim what you want to bring.' },
    { label: 'Drinks', title: 'Cooler drinks and ice', owner: 'Sam', notes: 'Bring extra ice if arriving late.' }
  ],
  snacks: [
    { title: 'Chips and dips', owner: 'Taylor', notes: 'Salsa, queso, hummus.' },
    { title: 'Fruit and breakfast extras', owner: 'Casey', notes: 'Apples, berries, yogurt.' },
    { title: 'Dessert', owner: 'Morgan', notes: 'Cookies or brownies.' }
  ],
  settings: {
    passwordHash: ''
  }
};

const state = {
  plan: structuredClone(defaultPlan),
  recordId: null,
  collection: localStorage.getItem('pb_collection') || DEFAULT_COLLECTION,
  slug: localStorage.getItem('plan_slug') || DEFAULT_SLUG,
  unlocked: false,
  saving: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function hashText(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function setStatus(message, tone = 'neutral') {
  const row = $('#statusRow');
  row.textContent = message || '';
  row.dataset.tone = tone;
}

async function loadPlan() {
  const fallback = localStorage.getItem(`party_plan_${state.slug}`);
  if (fallback) {
    state.plan = { ...clone(defaultPlan), ...JSON.parse(fallback) };
  }

  try {
    const record = await pb.collection(state.collection).getFirstListItem(`slug="${state.slug}"`);
    state.recordId = record.id;
    state.plan = { ...clone(defaultPlan), ...record.data };
    setStatus('Loaded from PocketBase.');
  } catch (error) {
    setStatus('Using local browser copy until PocketBase is reachable and the collection is ready.');
  }

  render();
}

async function savePlan() {
  state.saving = true;
  setStatus('Saving...');
  const payload = { slug: state.slug, data: clone(state.plan) };
  localStorage.setItem('pb_url', PB_URL);
  localStorage.setItem('pb_collection', state.collection);
  localStorage.setItem('plan_slug', state.slug);
  localStorage.setItem(`party_plan_${state.slug}`, JSON.stringify(state.plan));

  try {
    const saved = state.recordId
      ? await pb.collection(state.collection).update(state.recordId, payload)
      : await pb.collection(state.collection).create(payload);
    state.recordId = saved.id;
    setStatus('Saved to PocketBase.');
  } catch (error) {
    setStatus('Saved locally. PocketBase did not accept the save, so check collection rules and fields.');
  } finally {
    state.saving = false;
  }
}

function render() {
  const plan = state.plan;
  $$('[data-field]').forEach(node => {
    const field = node.dataset.field;
    if (field === 'kindLabel') {
      node.textContent = plan.mode === 'trip' ? 'Long Weekend' : 'One-day Hangout';
      return;
    }
    node.textContent = plan[field] || '';
  });

  $('.trip-only').hidden = plan.mode !== 'trip';
  $('.party-only').hidden = plan.mode !== 'party';

  renderDays();
  renderPartyMeals();
  renderSnacks();
  renderPeople();
  renderBringing();
  lucide.createIcons();
}

function mealCard(mealKey, meal = {}) {
  return `
    <article class="meal-card">
      <span class="${mealKey}">${mealKey}</span>
      <strong>${escapeHtml(meal.title || 'Open')}</strong>
      <p>${escapeHtml(meal.owner ? `Lead: ${meal.owner}` : 'Lead: open')}</p>
      <p>${escapeHtml(meal.notes || '')}</p>
    </article>
  `;
}

function renderDays() {
  $('#dayList').innerHTML = state.plan.days.map(day => `
    <article class="day">
      <div class="day__header">
        <h3>${escapeHtml(day.label)}</h3>
        <span>${escapeHtml(day.date)}</span>
      </div>
      <div class="meal-grid">
        ${mealCard('breakfast', day.meals?.breakfast)}
        ${mealCard('lunch', day.meals?.lunch)}
        ${mealCard('dinner', day.meals?.dinner)}
      </div>
    </article>
  `).join('');
}

function renderPartyMeals() {
  $('#singleDayList').innerHTML = state.plan.partyMeals.map(item => `
    <article class="snack-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.owner ? `Lead: ${item.owner}` : 'Lead: open')}</p>
      <p>${escapeHtml(item.notes || '')}</p>
    </article>
  `).join('');
}

function renderSnacks() {
  $('#snackList').innerHTML = state.plan.snacks.map(snack => `
    <article class="snack-card">
      <span>${escapeHtml(snack.owner || 'Open')}</span>
      <strong>${escapeHtml(snack.title)}</strong>
      <p>${escapeHtml(snack.notes || '')}</p>
    </article>
  `).join('');
}

function renderPeople() {
  $('#peopleList').innerHTML = state.plan.people.map(person => `
    <article class="person">
      <strong>${escapeHtml(person.name)}</strong>
      <div class="person__meta">
        ${person.arrival ? `<span class="pill">Arrives ${escapeHtml(person.arrival)}</span>` : ''}
        ${person.departure ? `<span class="pill">Leaves ${escapeHtml(person.departure)}</span>` : ''}
      </div>
    </article>
  `).join('');
}

function renderBringing() {
  $('#bringList').innerHTML = state.plan.people.map(person => `
    <article class="bring-card">
      <span>${escapeHtml(person.name)}</span>
      <strong>${escapeHtml(person.bringing || 'Nothing assigned yet')}</strong>
    </article>
  `).join('');
}

function openEditor() {
  $('#editorDialog').showModal();
  if (state.unlocked) {
    showEditView();
  } else {
    showUnlockView();
  }
}

function showUnlockView() {
  $('#editorTitle').textContent = 'Unlock plan';
  $('#unlockView').hidden = false;
  $('#editView').hidden = true;
  $('#passwordInput').focus();
}

function showEditView() {
  $('#editorTitle').textContent = 'Edit plan';
  $('#unlockView').hidden = true;
  $('#editView').hidden = false;
  fillEditor();
}

async function unlockEditor() {
  const password = $('#passwordInput').value;
  const savedHash = state.plan.settings?.passwordHash || await hashText(DEFAULT_PASSWORD);
  if (await hashText(password) === savedHash) {
    state.unlocked = true;
    $('#passwordInput').value = '';
    showEditView();
  } else {
    setStatus('That password did not unlock the editor.');
  }
}

function fillEditor() {
  $$('[data-edit]').forEach(input => {
    input.value = state.plan[input.dataset.edit] || '';
  });
  $$('.mode-option').forEach(button => button.classList.toggle('is-active', button.dataset.mode === state.plan.mode));
  $('.trip-meal-editor').hidden = state.plan.mode !== 'trip';
  $('.party-meal-editor').hidden = state.plan.mode !== 'party';
  $('#pbUrlInput').value = PB_URL;
  $('#collectionInput').value = state.collection;
  $('#slugInput').value = state.slug;
  $('#newPasswordInput').value = '';
  renderPeopleEditor();
  renderDaysEditor();
  renderPartyMealsEditor();
  renderSnacksEditor();
  lucide.createIcons();
}

function removeButton(type, index) {
  return `<button class="icon-button danger" type="button" data-remove="${type}" data-index="${index}" aria-label="Remove" title="Remove"><i data-lucide="trash-2"></i></button>`;
}

function renderPeopleEditor() {
  $('#peopleEditor').innerHTML = state.plan.people.map((person, index) => `
    <article class="editor-card">
      <div class="editor-card__head"><strong>Person ${index + 1}</strong>${removeButton('person', index)}</div>
      <div class="mini-grid">
        <input placeholder="Name" data-people="${index}" data-key="name" value="${escapeHtml(person.name)}" />
        <input placeholder="Bringing" data-people="${index}" data-key="bringing" value="${escapeHtml(person.bringing)}" />
        <input placeholder="Arrival" data-people="${index}" data-key="arrival" value="${escapeHtml(person.arrival)}" />
        <input placeholder="Departure" data-people="${index}" data-key="departure" value="${escapeHtml(person.departure)}" />
      </div>
    </article>
  `).join('');
}

function renderDaysEditor() {
  $('#daysEditor').innerHTML = state.plan.days.map((day, dayIndex) => `
    <article class="editor-card">
      <div class="editor-card__head"><strong>${escapeHtml(day.label || `Day ${dayIndex + 1}`)}</strong>${removeButton('day', dayIndex)}</div>
      <div class="mini-grid">
        <input placeholder="Day label" data-day="${dayIndex}" data-key="label" value="${escapeHtml(day.label)}" />
        <input placeholder="Date" data-day="${dayIndex}" data-key="date" value="${escapeHtml(day.date)}" />
        ${['breakfast', 'lunch', 'dinner'].map(mealKey => `
          <input placeholder="${mealKey} title" data-meal-day="${dayIndex}" data-meal="${mealKey}" data-key="title" value="${escapeHtml(day.meals?.[mealKey]?.title)}" />
          <input placeholder="${mealKey} lead" data-meal-day="${dayIndex}" data-meal="${mealKey}" data-key="owner" value="${escapeHtml(day.meals?.[mealKey]?.owner)}" />
          <textarea class="wide" placeholder="${mealKey} notes" data-meal-day="${dayIndex}" data-meal="${mealKey}" data-key="notes">${escapeHtml(day.meals?.[mealKey]?.notes)}</textarea>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function renderPartyMealsEditor() {
  $('#partyMealsEditor').innerHTML = state.plan.partyMeals.map((meal, index) => `
    <article class="editor-card">
      <div class="editor-card__head"><strong>Food section ${index + 1}</strong>${removeButton('partyMeal', index)}</div>
      <div class="mini-grid">
        <input placeholder="Label" data-party-meal="${index}" data-key="label" value="${escapeHtml(meal.label)}" />
        <input placeholder="Lead" data-party-meal="${index}" data-key="owner" value="${escapeHtml(meal.owner)}" />
        <input class="wide" placeholder="Food" data-party-meal="${index}" data-key="title" value="${escapeHtml(meal.title)}" />
        <textarea class="wide" placeholder="Notes" data-party-meal="${index}" data-key="notes">${escapeHtml(meal.notes)}</textarea>
      </div>
    </article>
  `).join('');
}

function renderSnacksEditor() {
  $('#snacksEditor').innerHTML = state.plan.snacks.map((snack, index) => `
    <article class="editor-card">
      <div class="editor-card__head"><strong>Snack ${index + 1}</strong>${removeButton('snack', index)}</div>
      <div class="mini-grid">
        <input placeholder="Snack" data-snack="${index}" data-key="title" value="${escapeHtml(snack.title)}" />
        <input placeholder="Owner" data-snack="${index}" data-key="owner" value="${escapeHtml(snack.owner)}" />
        <textarea class="wide" placeholder="Notes" data-snack="${index}" data-key="notes">${escapeHtml(snack.notes)}</textarea>
      </div>
    </article>
  `).join('');
}

function bindEditorInput(event) {
  const target = event.target;
  if (target.matches('[data-edit]')) {
    state.plan[target.dataset.edit] = target.value;
    render();
  }
  if (target.matches('[data-people]')) {
    state.plan.people[Number(target.dataset.people)][target.dataset.key] = target.value;
    render();
  }
  if (target.matches('[data-day]')) {
    state.plan.days[Number(target.dataset.day)][target.dataset.key] = target.value;
    render();
  }
  if (target.matches('[data-meal-day]')) {
    const day = state.plan.days[Number(target.dataset.mealDay)];
    day.meals[target.dataset.meal][target.dataset.key] = target.value;
    render();
  }
  if (target.matches('[data-party-meal]')) {
    state.plan.partyMeals[Number(target.dataset.partyMeal)][target.dataset.key] = target.value;
    render();
  }
  if (target.matches('[data-snack]')) {
    state.plan.snacks[Number(target.dataset.snack)][target.dataset.key] = target.value;
    render();
  }
}

function removeItem(type, index) {
  const map = {
    person: state.plan.people,
    day: state.plan.days,
    partyMeal: state.plan.partyMeals,
    snack: state.plan.snacks
  };
  map[type].splice(index, 1);
  fillEditor();
  render();
}

async function applySettings() {
  const nextUrl = $('#pbUrlInput').value.trim();
  if (nextUrl && nextUrl !== PB_URL) {
    PB_URL = nextUrl;
    pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
    pb.beforeSend = function(url, options) {
      options.headers = Object.assign({}, options.headers, { 'ngrok-skip-browser-warning': 'true' });
      return { url, options };
    };
  }
  state.collection = $('#collectionInput').value.trim() || DEFAULT_COLLECTION;
  state.slug = $('#slugInput').value.trim() || DEFAULT_SLUG;
  const newPassword = $('#newPasswordInput').value;
  state.plan.settings = state.plan.settings || {};
  if (newPassword) {
    state.plan.settings.passwordHash = await hashText(newPassword);
  }
}

function activateTab(tabName) {
  $$('.tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === tabName));
  $$('.tab-panel').forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === tabName));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.slug}-party-plan.json`;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('click', async event => {
  const remove = event.target.closest('[data-remove]');
  if (remove) {
    removeItem(remove.dataset.remove, Number(remove.dataset.index));
    return;
  }

  const mode = event.target.closest('[data-mode]');
  if (mode) {
    state.plan.mode = mode.dataset.mode;
    fillEditor();
    render();
    return;
  }

  const tab = event.target.closest('[data-tab]');
  if (tab) {
    activateTab(tab.dataset.tab);
  }
});

$('#editBtn').addEventListener('click', openEditor);
$('#refreshBtn').addEventListener('click', loadPlan);
$('#closeEditorBtn').addEventListener('click', () => $('#editorDialog').close());
$('#unlockBtn').addEventListener('click', unlockEditor);
$('#passwordInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    unlockEditor();
  }
});
$('#editView').addEventListener('input', bindEditorInput);
$('#addPersonBtn').addEventListener('click', () => {
  state.plan.people.push({ name: 'New person', arrival: '', departure: '', bringing: '' });
  fillEditor();
  render();
});
$('#addDayBtn').addEventListener('click', () => {
  state.plan.days.push({
    label: `Day ${state.plan.days.length + 1}`,
    date: '',
    meals: {
      breakfast: { title: '', owner: '', notes: '' },
      lunch: { title: '', owner: '', notes: '' },
      dinner: { title: '', owner: '', notes: '' }
    }
  });
  fillEditor();
  render();
});
$('#addPartyMealBtn').addEventListener('click', () => {
  state.plan.partyMeals.push({ label: 'Food', title: '', owner: '', notes: '' });
  fillEditor();
  render();
});
$('#addSnackBtn').addEventListener('click', () => {
  state.plan.snacks.push({ title: '', owner: '', notes: '' });
  fillEditor();
  render();
});
$('#exportBtn').addEventListener('click', exportJson);
$('#saveBtn').addEventListener('click', async () => {
  await applySettings();
  await savePlan();
  render();
  $('#editorDialog').close();
});

loadPlan();

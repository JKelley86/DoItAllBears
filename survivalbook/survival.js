let topics = [];

fetch('topics.json')
  .then(response => response.json())
  .then(data => {
    topics = data;
    displayTopics(topics);
  });

function displayTopics(list) {
  const container = document.getElementById('topicsContainer');
  container.innerHTML = '';
  list.forEach((topic, index) => {
    const div = document.createElement('div');
    div.className = 'topic';
    
    div.innerHTML = `
      <h2>${topic.title}</h2>
      <p>${topic.summary}</p>
      <button class="expand-btn" data-index="${index}">Read More ▼</button>
      <div class="details" id="details-${index}" style="display:none;">
        ${topic.details.map(d => `<p>${d}</p>`).join('')}
      </div>
    `;
    
    container.appendChild(div);
  });

  // Add event listeners for expand buttons
  const expandButtons = document.querySelectorAll('.expand-btn');
  expandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.index;
      const detailDiv = document.getElementById(`details-${idx}`);
      if (detailDiv.style.display === 'none') {
        detailDiv.style.display = 'block';
        btn.textContent = 'Collapse ▲';
      } else {
        detailDiv.style.display = 'none';
        btn.textContent = 'Read More ▼';
      }
    });
  });
}

// Search
document.getElementById('searchBox').addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  const filtered = topics.filter(t =>
    t.title.toLowerCase().includes(query)
  );
  displayTopics(filtered);
});

// Emergency Mode
document.getElementById('emergencyToggle').addEventListener('click', () => {
  document.body.classList.toggle('emergency');
});


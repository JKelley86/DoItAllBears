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
  list.forEach(topic => {
    const div = document.createElement('div');
    div.className = 'topic';
    div.innerHTML = `<h2>${topic.title}</h2><p>${topic.content}</p>`;
    container.appendChild(div);
  });
}

// Search
document.getElementById('searchBox').addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  const filtered = topics.filter(t =>
    t.title.toLowerCase().includes(query) || t.content.toLowerCase().includes(query)
  );
  displayTopics(filtered);
});

// Emergency Mode
document.getElementById('emergencyToggle').addEventListener('click', () => {
  document.body.classList.toggle('emergency');
});

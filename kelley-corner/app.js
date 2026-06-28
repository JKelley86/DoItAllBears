const PB_URL = "https://tumid-kiltlike-maia.ngrok-free.dev";
const COOKBOOK_URL = "https://jkelley86.github.io/DoItAllBears/recipes/familycookbook.html";
const REACTIONS = [
  { key: "like", label: String.fromCodePoint(0x1f44d) },
  { key: "love", label: String.fromCodePoint(0x2764, 0xfe0f) },
  { key: "laugh", label: String.fromCodePoint(0x1f602) },
  { key: "celebrate", label: String.fromCodePoint(0x1f389) },
  { key: "wow", label: String.fromCodePoint(0x1f62e) }
];

const state = {
  token: localStorage.getItem("kc_token") || "",
  user: JSON.parse(localStorage.getItem("kc_user") || "null"),
  settings: null,
  posts: [],
  notifications: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function storageAuth(token, user) {
  state.token = token || "";
  state.user = user || null;
  if (token && user) {
    localStorage.setItem("kc_token", token);
    localStorage.setItem("kc_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("kc_token");
    localStorage.removeItem("kc_user");
  }
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), 4200);
}

function authHeaders(json = true) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  return headers;
}

async function pb(path, options = {}) {
  const response = await fetch(`${PB_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.skipAuth ? {} : authHeaders(options.json !== false))
    }
  });
  if (!response.ok) {
    let detail = "PocketBase request failed.";
    try {
      const data = await response.json();
      detail = data.message || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

function fileUrl(collection, recordId, filename) {
  return `${PB_URL}/api/files/${collection}/${recordId}/${filename}`;
}

function userAvatar(user) {
  if (user?.avatar) return fileUrl("users", user.id, user.avatar);
  return "";
}

function initials(name = "KC") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "KC";
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function daysUntil(dateString) {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
}

function expiresAtForNewPost() {
  const days = Number(state.settings?.postLifetimeDays || 30);
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires.toISOString();
}

function setView(name) {
  $$(".view, #authView, #pendingView").forEach((el) => el.classList.add("hidden"));
  $$(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === name));
  const view = $(`#${name}View`);
  if (view) view.classList.remove("hidden");
  if (name === "memory") renderMemory();
  if (name === "notifications") renderNotifications();
  if (name === "profile") renderProfile();
  if (name === "developer") loadDeveloper();
}

function applyUserChrome() {
  const approved = Boolean(state.user?.approved);
  const isDev = state.user?.role === "developer";
  $$(".view, #authView, #pendingView").forEach((el) => el.classList.add("hidden"));
  document.body.classList.toggle("light", state.user?.theme === "light");
  $("#logoutBtn").classList.toggle("hidden", !state.user);
  $$(".dev-only").forEach((el) => el.classList.toggle("hidden", !isDev));
  if (!state.user) {
    $("#authView").classList.remove("hidden");
    return;
  }
  if (!approved) {
    $("#pendingView").classList.remove("hidden");
    return;
  }
  setView("feed");
}

async function boot() {
  bindEvents();
  if (!state.token || !state.user) {
    applyUserChrome();
    return;
  }
  try {
    const fresh = await pb(`/api/collections/users/records/${state.user.id}`);
    storageAuth(state.token, fresh);
    applyUserChrome();
    if (fresh.approved) await loadApp();
  } catch (error) {
    storageAuth("", null);
    applyUserChrome();
  }
}

async function loadApp() {
  await loadSettings();
  await Promise.all([loadPosts(), loadNotifications()]);
}

async function loadSettings() {
  try {
    const data = await pb("/api/collections/app_settings/records?page=1&perPage=1");
    state.settings = data.items[0] || {
      postLifetimeDays: 30,
      cookbookBaseUrl: COOKBOOK_URL,
      maxImagesPerPost: 6,
      maintenanceMode: false
    };
  } catch (_) {
    state.settings = {
      postLifetimeDays: 30,
      cookbookBaseUrl: COOKBOOK_URL,
      maxImagesPerPost: 6,
      maintenanceMode: false
    };
  }
  $("#postLifetimeHint").textContent = `Posts delete after ${state.settings.postLifetimeDays || 30} days.`;
}

async function loadPosts() {
  const filter = encodeURIComponent("expiresAt >= @now");
  const data = await pb(`/api/collections/posts/records?sort=-created&perPage=60&expand=author&filter=${filter}`);
  state.posts = data.items;
  await hydratePostDetails(state.posts);
  renderPosts($("#feedList"), state.posts);
  renderProfilePosts();
}

async function hydratePostDetails(posts) {
  await Promise.all(posts.map(async (post) => {
    const postFilter = encodeURIComponent(`post = "${post.id}"`);
    const [comments, reactions] = await Promise.all([
      pb(`/api/collections/comments/records?sort=created&perPage=80&expand=author&filter=${postFilter}`),
      pb(`/api/collections/reactions/records?perPage=120&expand=user&filter=${postFilter}`)
    ]);
    post.comments = comments.items;
    post.reactions = reactions.items;
  }));
}

function renderPosts(container, posts) {
  if (!posts.length) {
    container.innerHTML = `<div class="center-card"><h2>No posts yet</h2><p class="muted">The first family update gets the good chair.</p></div>`;
    return;
  }
  container.innerHTML = posts.map(renderPost).join("");
}

function renderPost(post) {
  const author = post.expand?.author || {};
  const avatar = userAvatar(author);
  const userReaction = post.reactions?.find((reaction) => reaction.user === state.user.id);
  const counts = REACTIONS.map((reactionType) => {
    const total = post.reactions?.filter((reaction) => reaction.type === reactionType.key).length || 0;
    return { ...reactionType, total };
  });
  const images = (post.images || []).map((image) =>
    `<img src="${fileUrl("posts", post.id, image)}" alt="Family post image" loading="lazy">`
  ).join("");
  const cookbook = post.isCookbookPost
    ? `<a class="cookbook-link" href="${escapeHtml(post.cookbookUrl || state.settings?.cookbookBaseUrl || COOKBOOK_URL)}" target="_blank" rel="noreferrer">${escapeHtml(post.cookbookLabel || "Open family cookbook")}</a>`
    : "";
  const comments = (post.comments || []).map((comment) => {
    const commenter = comment.expand?.author || {};
    return `<div class="comment"><strong>${escapeHtml(commenter.name || "Family")}</strong> ${escapeHtml(comment.text || "")}</div>`;
  }).join("");
  const canDelete = post.author === state.user.id || state.user.role === "developer";
  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-inner">
        <div class="post-head">
          <div class="author">
            ${avatar ? `<img class="avatar" src="${avatar}" alt="">` : `<div class="avatar avatar-fallback">${initials(author.name)}</div>`}
            <div>
              <strong>${escapeHtml(author.name || "Family")}</strong>
              <span class="muted">${new Date(post.created).toLocaleString()} - ${Math.max(daysUntil(post.expiresAt), 0)} days left</span>
            </div>
          </div>
          ${canDelete ? `<button class="ghost-button delete-post" type="button">Delete</button>` : ""}
        </div>
        ${post.text ? `<p class="post-text">${escapeHtml(post.text)}</p>` : ""}
        ${images ? `<div class="image-grid">${images}</div>` : ""}
        ${cookbook}
        <div class="post-actions">
          ${counts.map(({ key, label, total }) => `
            <button class="reaction-button ${userReaction?.type === key ? "active" : ""}" data-reaction="${key}" type="button" title="${key}">
              ${label} ${total || ""}
            </button>
          `).join("")}
        </div>
        <div class="comments">${comments}</div>
        <form class="comment-row">
          <input name="text" placeholder="Write a comment..." required>
          <button class="ghost-button" type="submit">Comment</button>
        </form>
      </div>
    </article>
  `;
}

async function loadNotifications() {
  const filter = encodeURIComponent(`recipient = "${state.user.id}"`);
  const data = await pb(`/api/collections/notifications/records?sort=-created&perPage=80&expand=actor,post&filter=${filter}`);
  state.notifications = data.items;
  const unread = state.notifications.filter((item) => !item.read).length;
  $("#notificationBadge").textContent = unread;
  $("#notificationBadge").classList.toggle("hidden", unread === 0);
}

function renderNotifications() {
  const container = $("#notificationsList");
  if (!state.notifications.length) {
    container.innerHTML = `<p class="muted">No notifications yet.</p>`;
    return;
  }
  container.innerHTML = state.notifications.map((item) => {
    const actor = item.expand?.actor?.name || "Someone";
    const action = item.type === "comment" ? "commented on" : "reacted to";
    return `
      <div class="list-item">
        <span>${escapeHtml(actor)} ${action} your post.</span>
        <span class="tiny muted">${new Date(item.created).toLocaleString()}</span>
      </div>
    `;
  }).join("");
}

function renderMemory() {
  const expiring = state.posts
    .filter((post) => daysUntil(post.expiresAt) <= 7)
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
  renderPosts($("#memoryList"), expiring);
}

function renderProfile() {
  $("#profileForm").name.value = state.user.name || "";
  $("#profileForm").bio.value = state.user.bio || "";
  $("#profileForm").theme.value = state.user.theme || "dark";
  const avatar = userAvatar(state.user);
  $("#profileAvatarPreview").src = avatar || "";
  $("#profileAvatarPreview").alt = state.user.name || "Profile picture";
  renderProfilePosts();
}

function renderProfilePosts() {
  const mine = state.posts.filter((post) => post.author === state.user?.id);
  const container = $("#profilePosts");
  if (container) renderPosts(container, mine);
}

async function loadDeveloper() {
  if (state.user?.role !== "developer") return;
  $("#settingsForm").postLifetimeDays.value = state.settings?.postLifetimeDays || 30;
  $("#settingsForm").cookbookBaseUrl.value = state.settings?.cookbookBaseUrl || COOKBOOK_URL;
  $("#settingsForm").maxImagesPerPost.value = state.settings?.maxImagesPerPost || 6;
  $("#settingsForm").maintenanceMode.checked = Boolean(state.settings?.maintenanceMode);
  const pendingFilter = encodeURIComponent("approved = false");
  const pending = await pb(`/api/collections/users/records?sort=created&perPage=80&filter=${pendingFilter}`);
  $("#pendingUsersList").innerHTML = pending.items.length ? pending.items.map((user) => `
    <div class="list-item">
      <span>${escapeHtml(user.name)} <span class="tiny muted">${escapeHtml(user.email || "")}</span></span>
      <button class="primary-button approve-user" data-user-id="${user.id}" type="button">Approve</button>
    </div>
  `).join("") : `<p class="muted">No accounts waiting.</p>`;
  $("#moderationList").innerHTML = state.posts.map((post) => `
    <div class="list-item">
      <span>${escapeHtml(post.expand?.author?.name || "Family")} - ${escapeHtml((post.text || "Photo post").slice(0, 70))}</span>
      <button class="ghost-button delete-post-inline" data-post-id="${post.id}" type="button">Delete</button>
    </div>
  `).join("") || `<p class="muted">No active posts.</p>`;
}

async function createNotification(post, type, commentId = "") {
  if (!post || post.author === state.user.id) return;
  await pb("/api/collections/notifications/records", {
    method: "POST",
    body: JSON.stringify({
      recipient: post.author,
      actor: state.user.id,
      post: post.id,
      comment: commentId || undefined,
      type,
      read: false
    })
  });
}

function bindEvents() {
  $("#showLogin").addEventListener("click", () => {
    $("#loginForm").classList.remove("hidden");
    $("#signupForm").classList.add("hidden");
    $("#showLogin").classList.add("active");
    $("#showSignup").classList.remove("active");
  });
  $("#showSignup").addEventListener("click", () => {
    $("#loginForm").classList.add("hidden");
    $("#signupForm").classList.remove("hidden");
    $("#showLogin").classList.remove("active");
    $("#showSignup").classList.add("active");
  });
  $$(".nav-item").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
  $("#logoutBtn").addEventListener("click", logout);
  $("#pendingLogoutBtn").addEventListener("click", logout);
  $("#refreshFeedBtn").addEventListener("click", loadApp);

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await pb("/api/collections/users/auth-with-password", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          identity: form.get("identity"),
          password: form.get("password")
        })
      });
      storageAuth(data.token, data.record);
      applyUserChrome();
      if (data.record.approved) await loadApp();
    } catch (error) {
      toast(error.message);
    }
  });

  $("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await pb("/api/collections/users/records", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          name: form.get("name"),
          username: form.get("username"),
          email: form.get("email"),
          password: form.get("password"),
          passwordConfirm: form.get("password"),
          approved: false,
          role: "member",
          theme: "dark"
        })
      });
      toast("Account created. You can sign in after approval.");
      $("#showLogin").click();
      event.currentTarget.reset();
    } catch (error) {
      toast(error.message);
    }
  });

  $("#postForm").isCookbookPost.addEventListener("change", (event) => {
    $("#cookbookLabelWrap").classList.toggle("hidden", !event.target.checked);
    $("#cookbookUrlWrap").classList.toggle("hidden", !event.target.checked);
  });

  $("#postForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData();
    const files = Array.from(form.images.files).slice(0, Number(state.settings?.maxImagesPerPost || 6));
    data.set("author", state.user.id);
    data.set("text", form.text.value);
    data.set("expiresAt", expiresAtForNewPost());
    data.set("isCookbookPost", form.isCookbookPost.checked ? "true" : "false");
    data.set("cookbookLabel", form.cookbookLabel.value || "Open family cookbook");
    data.set("cookbookUrl", form.cookbookUrl.value || state.settings?.cookbookBaseUrl || COOKBOOK_URL);
    files.forEach((file) => data.append("images", file));
    try {
      await pb("/api/collections/posts/records", {
        method: "POST",
        json: false,
        headers: { Authorization: `Bearer ${state.token}` },
        body: data
      });
      form.reset();
      $("#cookbookLabelWrap").classList.add("hidden");
      $("#cookbookUrlWrap").classList.add("hidden");
      await loadPosts();
      toast("Posted to Kelley Corner.");
    } catch (error) {
      toast(error.message);
    }
  });

  document.addEventListener("click", async (event) => {
    const reaction = event.target.closest(".reaction-button");
    const deletePost = event.target.closest(".delete-post, .delete-post-inline");
    const approve = event.target.closest(".approve-user");
    if (reaction) {
      await handleReaction(reaction.closest(".post-card").dataset.postId, reaction.dataset.reaction);
    }
    if (deletePost) {
      await handleDeletePost(deletePost.dataset.postId || deletePost.closest(".post-card").dataset.postId);
    }
    if (approve) {
      await pb(`/api/collections/users/records/${approve.dataset.userId}`, {
        method: "PATCH",
        body: JSON.stringify({ approved: true })
      });
      await loadDeveloper();
      toast("Family member approved.");
    }
  });

  document.addEventListener("submit", async (event) => {
    const commentForm = event.target.closest(".comment-row");
    if (!commentForm) return;
    event.preventDefault();
    const post = state.posts.find((item) => item.id === commentForm.closest(".post-card").dataset.postId);
    try {
      const created = await pb("/api/collections/comments/records", {
        method: "POST",
        body: JSON.stringify({
          post: post.id,
          author: state.user.id,
          text: commentForm.text.value
        })
      });
      await createNotification(post, "comment", created.id);
      commentForm.reset();
      await Promise.all([loadPosts(), loadNotifications()]);
    } catch (error) {
      toast(error.message);
    }
  });

  $("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData();
    data.set("name", form.name.value);
    data.set("bio", form.bio.value);
    data.set("theme", form.theme.value);
    if (form.avatar.files[0]) data.set("avatar", form.avatar.files[0]);
    try {
      const user = await pb(`/api/collections/users/records/${state.user.id}`, {
        method: "PATCH",
        json: false,
        headers: { Authorization: `Bearer ${state.token}` },
        body: data
      });
      storageAuth(state.token, user);
      document.body.classList.toggle("light", user.theme === "light");
      renderProfile();
      toast("Profile saved.");
    } catch (error) {
      toast(error.message);
    }
  });

  $("#settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = {
      postLifetimeDays: Number(form.postLifetimeDays.value),
      cookbookBaseUrl: form.cookbookBaseUrl.value,
      maxImagesPerPost: Number(form.maxImagesPerPost.value),
      maintenanceMode: form.maintenanceMode.checked
    };
    try {
      if (state.settings?.id) {
        state.settings = await pb(`/api/collections/app_settings/records/${state.settings.id}`, {
          method: "PATCH",
          body: JSON.stringify(body)
        });
      } else {
        state.settings = await pb("/api/collections/app_settings/records", {
          method: "POST",
          body: JSON.stringify(body)
        });
      }
      $("#postLifetimeHint").textContent = `Posts delete after ${state.settings.postLifetimeDays} days.`;
      toast("Settings saved.");
    } catch (error) {
      toast(error.message);
    }
  });

  $("#markAllReadBtn").addEventListener("click", async () => {
    await Promise.all(state.notifications.filter((item) => !item.read).map((item) =>
      pb(`/api/collections/notifications/records/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true })
      })
    ));
    await loadNotifications();
    renderNotifications();
  });
}

async function handleReaction(postId, type) {
  const post = state.posts.find((item) => item.id === postId);
  const existing = post.reactions?.find((reaction) => reaction.user === state.user.id);
  try {
    if (existing?.type === type) {
      await pb(`/api/collections/reactions/records/${existing.id}`, { method: "DELETE" });
    } else if (existing) {
      await pb(`/api/collections/reactions/records/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ type })
      });
      await createNotification(post, "reaction");
    } else {
      await pb("/api/collections/reactions/records", {
        method: "POST",
        body: JSON.stringify({ post: postId, user: state.user.id, type })
      });
      await createNotification(post, "reaction");
    }
    await Promise.all([loadPosts(), loadNotifications()]);
  } catch (error) {
    toast(error.message);
  }
}

async function handleDeletePost(postId) {
  try {
    await pb(`/api/collections/posts/records/${postId}`, { method: "DELETE" });
    await loadPosts();
    if (!$("#developerView").classList.contains("hidden")) await loadDeveloper();
    toast("Post deleted.");
  } catch (error) {
    toast(error.message);
  }
}

function logout() {
  storageAuth("", null);
  location.reload();
}

boot();

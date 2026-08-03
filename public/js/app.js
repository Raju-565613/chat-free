(() => {
  const AVATAR_COLORS = ['#39ff6e', '#f2c14e', '#5eead4', '#f2716b', '#7dd3fc', '#c084fc', '#fb923c'];

  const state = {
    token: localStorage.getItem('nc_token') || null,
    username: localStorage.getItem('nc_username') || null,
    isGuest: localStorage.getItem('nc_isGuest') === 'true',
    hasPassword: true,
    bio: '',
    displayName: '',
    accountId: '',
    email: '',
    emailPublic: false,
    avatarColor: AVATAR_COLORS[0],
    avatarImage: null,
    presenceCount: 0,
    socket: null,
    room: null,
    mode: 'netchat',
    currentChannelId: null,
    currentChannelIsOwner: false,
    currentChannel: null,
    dmPartner: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const el = {
    authScreen: $('#auth-screen'),
    netchatScreen: $('#netchat-screen'),
    outchatScreen: $('#outchat-screen'),
    tabs: document.querySelectorAll('.tab'),
    loginForm: $('#login-form'),
    signupForm: $('#signup-form'),
    guestBtn: $('#guest-btn'),
    googleSigninWrap: $('#google-signin-wrap'),
    googleSigninBtn: $('#google-signin-btn'),

    // NetChat
    messages: $('#messages'),
    messageForm: $('#message-form'),
    messageInput: $('#message-input'),
    typingIndicator: $('#typing-indicator'),
    fileInputPhoto: $('#file-input-photo'),
    fileInputDoc: $('#file-input-doc'),
    attachBtn: $('#attach-btn'),
    attachMenu: $('#attach-menu'),
    uploadStatus: $('#upload-status'),
    roomBadge: $('#room-badge'),
    roomIdText: $('#room-id-text'),
    presenceCount: $('#presence-count'),
    reportBtn: $('#report-btn'),
    roomModal: $('#room-modal'),
    recentRoomsSection: $('#recent-rooms-section'),
    recentRoomsList: $('#recent-rooms-list'),
    overrideInput: $('#override-input'),
    overrideApply: $('#override-apply'),
    overrideReset: $('#override-reset'),
    modalClose: $('#modal-close'),
    reportModal: $('#report-modal'),
    reportBody: $('#report-body'),
    reportClose: $('#report-close'),
    flagModal: $('#flag-modal'),
    flagTarget: $('#flag-target'),
    flagReason: $('#flag-reason'),
    flagDetails: $('#flag-details'),
    flagSubmit: $('#flag-submit'),
    flagError: $('#flag-error'),

    // Theme + mode
    themeToggle: $('#theme-toggle'),
    themeToggleAuth: $('#theme-toggle-auth'),
    modeToggle1: $('#mode-toggle-1'),
    modeToggle2: $('#mode-toggle-2'),

    // Profile / Settings
    profileBtn: $('#profile-btn'),
    profileBtn2: $('#profile-btn-2'),
    profileAvatarInitial: $('#profile-avatar-initial'),
    profileAvatarInitial2: $('#profile-avatar-initial-2'),
    // Tutorial
    tutorialModal: $('#tutorial-modal'),
    tutorialDots: $('#tutorial-dots'),
    tutorialTitle: $('#tutorial-title'),
    tutorialBody: $('#tutorial-body'),
    tutorialSkip: $('#tutorial-skip'),
    tutorialBack: $('#tutorial-back'),
    tutorialNext: $('#tutorial-next'),
    helpBtn1: $('#help-btn-1'),
    helpBtn2: $('#help-btn-2'),

    profileModal: $('#profile-modal'),
    profileView: $('#profile-view'),
    settingsView: $('#settings-view'),
    openSettingsBtn: $('#open-settings-btn'),
    settingsBackBtn: $('#settings-back-btn'),
    profileViewAvatar: $('#profile-view-avatar'),
    profileViewName: $('#profile-view-name'),
    profileViewEmail: $('#profile-view-email'),
    profileViewBio: $('#profile-view-bio'),
    profileUsername: $('#profile-username'),
    profileAccountId: $('#profile-account-id'),
    guestBanner: $('#guest-banner'),
    profileBio: $('#profile-bio'),
    profileDisplayName: $('#profile-display-name'),
    profileEmail: $('#profile-email'),
    profileEmailPublic: $('#profile-email-public'),
    avatarSwatches: $('#avatar-swatches'),
    avatarPreviewBtn: $('#avatar-preview-btn'),
    avatarPreviewInitial: $('#avatar-preview-initial'),
    avatarPreviewImg: $('#avatar-preview-img'),
    avatarFileInput: $('#avatar-file-input'),
    profileSave: $('#profile-save'),
    profileError: $('#profile-error'),
    passwordSection: $('#password-section'),
    usernameSection: $('#username-section'),
    usernameToggleBtn: $('#username-toggle-btn'),
    usernameFields: $('#username-fields'),
    newUsername: $('#new-username'),
    usernamePassword: $('#username-password'),
    usernamePasswordLabel: $('#username-password-label'),
    usernameSave: $('#username-save'),
    usernameError: $('#username-error'),
    passwordToggleBtn: $('#password-toggle-btn'),
    passwordFields: $('#password-fields'),
    currentPassword: $('#current-password'),
    newPassword: $('#new-password'),
    passwordSave: $('#password-save'),
    passwordError: $('#password-error'),
    settingsLogoutBtn: $('#settings-logout-btn'),
    wallpaperSelect: $('#wallpaper-select'),
    notificationsToggle: $('#notifications-toggle'),
    privacyToggleBtn: $('#privacy-toggle-btn'),
    blockedListWrap: $('#blocked-list-wrap'),
    blockedList: $('#blocked-list'),
    accountInfoHint: $('#account-info-hint'),
    shortcutsToggleBtn: $('#shortcuts-toggle-btn'),
    shortcutsPanel: $('#shortcuts-panel'),
    helpToggleBtn: $('#help-toggle-btn'),
    helpPanel: $('#help-panel'),
    profileCardActions: $('#profile-card-actions'),
    profileCardBlock: $('#profile-card-block'),

    // Public profile card
    profileCardModal: $('#profile-card-modal'),
    profileCardAvatar: $('#profile-card-avatar'),
    profileCardName: $('#profile-card-name'),
    profileCardUsername: $('#profile-card-username'),
    profileCardBio: $('#profile-card-bio'),
    profileCardEmail: $('#profile-card-email'),

    // Friends
    friendsBtn: $('#friends-btn'),
    friendsBtn2: $('#friends-btn-2'),
    friendsBadge: $('#friends-badge'),
    friendsBadge2: $('#friends-badge-2'),
    friendsModal: $('#friends-modal'),
    addFriendInput: $('#add-friend-input'),
    addFriendBtn: $('#add-friend-btn'),
    addFriendError: $('#add-friend-error'),
    incomingSection: $('#incoming-requests-section'),
    incomingList: $('#incoming-list'),
    friendsList: $('#friends-list'),

    // DM
    dmModal: $('#dm-modal'),
    dmTitle: $('#dm-title'),
    dmMessages: $('#dm-messages'),
    dmForm: $('#dm-form'),
    dmInput: $('#dm-input'),
    dmTypingIndicator: $('#dm-typing-indicator'),
    dmFileInputPhoto: $('#dm-file-input-photo'),
    dmFileInputDoc: $('#dm-file-input-doc'),
    dmAttachBtn: $('#dm-attach-btn'),
    dmAttachMenu: $('#dm-attach-menu'),
    dmUploadStatus: $('#dm-upload-status'),

    // OutChat
    channelList: $('#channel-list'),
    createChannelBtn: $('#create-channel-btn'),
    createChannelModal: $('#create-channel-modal'),
    newChannelName: $('#new-channel-name'),
    createChannelSubmit: $('#create-channel-submit'),
    createChannelError: $('#create-channel-error'),
    joinCodeInput: $('#join-code-input'),
    joinCodeBtn: $('#join-code-btn'),
    joinStatus: $('#join-status'),
    outchatEmpty: $('#outchat-empty'),
    outchatChannel: $('#outchat-channel'),
    channelName: $('#channel-name'),
    channelInvite: $('#channel-invite'),
    channelPhoto: $('#channel-photo'),
    channelMenuEdit: $('#channel-menu-edit'),
    channelEditModal: $('#channel-edit-modal'),
    channelEditName: $('#channel-edit-name'),
    channelEditDescription: $('#channel-edit-description'),
    channelEditSave: $('#channel-edit-save'),
    channelEditError: $('#channel-edit-error'),
    channelPhotoPreviewBtn: $('#channel-photo-preview-btn'),
    channelPhotoPreviewInitial: $('#channel-photo-preview-initial'),
    channelPhotoFileInput: $('#channel-photo-file-input'),
    channelMenuBtn: $('#channel-menu-btn'),
    channelMenu: $('#channel-menu'),
    channelMenuManage: $('#channel-menu-manage'),
    channelMenuTransfer: $('#channel-menu-transfer'),
    channelMenuLeave: $('#channel-menu-leave'),
    pendingBadge: $('#pending-badge'),
    transferModal: $('#transfer-modal'),
    transferList: $('#transfer-list'),
    outchatMessages: $('#outchat-messages'),
    outchatMessageForm: $('#outchat-message-form'),
    outchatMessageInput: $('#outchat-message-input'),
    outchatTypingIndicator: $('#outchat-typing-indicator'),
    outchatFileInputPhoto: $('#outchat-file-input-photo'),
    outchatFileInputDoc: $('#outchat-file-input-doc'),
    outchatAttachBtn: $('#outchat-attach-btn'),
    outchatAttachMenu: $('#outchat-attach-menu'),
    outchatUploadStatus: $('#outchat-upload-status'),
    manageModal: $('#manage-modal'),
    pendingList: $('#pending-list'),
    memberList: $('#member-list'),
  };

  let flagTargetMessage = null;

  // ---------- Helpers ----------

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function scrollEl(node) {
    node.scrollTop = node.scrollHeight;
  }

  let toastTimer = null;
  function showToast(text, onClick) {
    let toast = document.getElementById('nc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nc-toast';
      toast.className = 'nc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.onclick = onClick || null;
    toast.classList.toggle('clickable', !!onClick);
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  // Shows "<name> is typing…" in the given <p> element, auto-hiding after a
  // short silence -- no explicit "stopped typing" event needed.
  const typingTimers = new WeakMap();
  function showTypingIndicator(node, displayName) {
    if (!node) return;
    node.textContent = `${displayName} is typing…`;
    node.classList.add('visible');
    clearTimeout(typingTimers.get(node));
    typingTimers.set(node, setTimeout(() => node.classList.remove('visible'), 2500));
  }

  // Emits a 'typing' ping at most once every 1.2s while the person keeps
  // typing, rather than flooding the socket on every keystroke.
  const lastTypingEmit = new WeakMap();
  function pingTyping(inputEl, context, extra) {
    const now = Date.now();
    const last = lastTypingEmit.get(inputEl) || 0;
    if (now - last < 1200) return;
    lastTypingEmit.set(inputEl, now);
    if (state.socket) state.socket.emit('typing', { context, ...extra });
  }

  function maybeRequestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Shown for events the user isn't currently looking at (a DM for a
  // conversation that isn't open, etc.) -- an in-app toast always, plus a
  // real OS notification when the tab is in the background, if permitted.
  function notifyIncoming(title, body, onClick) {
    if (!notificationsEnabled()) return;
    showToast(`${title}: ${body}`, onClick);

    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const n = new Notification(title, { body, icon: '/icon.png' });
      if (onClick) n.onclick = () => { window.focus(); onClick(); };
    }
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function doLogout(message) {
    localStorage.removeItem('nc_token');
    localStorage.removeItem('nc_username');
    localStorage.removeItem('nc_isGuest');
    if (state.socket) state.socket.disconnect();
    if (message) sessionStorage.setItem('nc_login_message', message);
    location.reload();
  }
  el.settingsLogoutBtn.addEventListener('click', () => {
    if (confirm('Log out?')) doLogout();
  });

  async function api(path, { method = 'GET', body, isForm = false } = {}) {
    const headers = {};
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    if (!isForm && body) headers['Content-Type'] = 'application/json';

    const res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && state.token) {
      // Session expired/invalid -- bounce cleanly back to login instead of
      // leaving a half-working screen with silent failures everywhere.
      doLogout('Your session expired. Please log in again.');
      throw new Error('Session expired.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).classList.add('hidden');
    });
  });

  // Clicking the dimmed backdrop area (not the panel itself) closes any
  // modal or the DM slide-in panel -- same behavior as tapping outside a
  // sheet in most chat apps.
  document.querySelectorAll('.modal-backdrop:not(#tutorial-modal), .dm-panel-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });
  });

  // ---------- Reusable: "+" attach menu ----------

  // Wires a "+" button to a small popover with "Photos & videos" / "Document"
  // options. Both route through the same onFile(file) callback -- the only
  // difference is the file picker's accept filter, matching how most chat
  // apps split this menu without needing separate upload logic.
  function setupAttachMenu(btn, menu, photoInput, docInput, onFile) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers(menu);
      menu.classList.toggle('hidden');
    });
    menu.querySelector('[data-attach-photo]').addEventListener('click', () => {
      menu.classList.add('hidden');
      photoInput.click();
    });
    menu.querySelector('[data-attach-doc]').addEventListener('click', () => {
      menu.classList.add('hidden');
      docInput.click();
    });
    [photoInput, docInput].forEach((input) => {
      input.addEventListener('change', () => {
        const file = input.files[0];
        input.value = '';
        if (file) onFile(file);
      });
    });
  }

  // the text input's current cursor position rather than just appending.
  // Closes every attach-menu popover except the one about to open.
  function closeAllPopovers(except) {
    document.querySelectorAll('.attach-menu').forEach((el2) => {
      if (el2 !== except) el2.classList.add('hidden');
    });
  }
  document.addEventListener('click', () => closeAllPopovers(null));

  // ---------- Theme toggle ----------

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('nc_theme', next);
  }
  el.themeToggle.addEventListener('click', toggleTheme);
  el.themeToggleAuth.addEventListener('click', toggleTheme);

  // ---------- Wallpaper ----------

  function applyWallpaper(name) {
    [el.messages, el.outchatMessages, el.dmMessages].forEach((node) => {
      if (!node) return;
      node.classList.remove('wallpaper-grid', 'wallpaper-dots', 'wallpaper-solid');
      if (name !== 'default') node.classList.add(`wallpaper-${name}`);
    });
  }
  const savedWallpaper = localStorage.getItem('nc_wallpaper') || 'default';
  el.wallpaperSelect.value = savedWallpaper;
  applyWallpaper(savedWallpaper);
  el.wallpaperSelect.addEventListener('change', () => {
    localStorage.setItem('nc_wallpaper', el.wallpaperSelect.value);
    applyWallpaper(el.wallpaperSelect.value);
  });

  // ---------- Notifications toggle ----------

  function notificationsEnabled() {
    return localStorage.getItem('nc_notifications_enabled') !== 'false';
  }
  el.notificationsToggle.checked = notificationsEnabled();
  el.notificationsToggle.addEventListener('change', () => {
    localStorage.setItem('nc_notifications_enabled', String(el.notificationsToggle.checked));
  });

  // ---------- Escape closes whatever's open ----------

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAllPopovers(null);
    el.channelMenu.classList.add('hidden');
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((m) => {
      if (m === el.tutorialModal) closeTutorial();
      else m.classList.add('hidden');
    });
    if (!el.dmModal.classList.contains('hidden')) el.dmModal.classList.add('hidden');
  });

  // ---------- Auth ----------

  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      el.tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      el.loginForm.classList.toggle('hidden', !isLogin);
      el.signupForm.classList.toggle('hidden', isLogin);
    });
  });

  el.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(el.loginForm);
    const errorEl = el.loginForm.querySelector('.form-error');
    errorEl.textContent = '';
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password') },
      });
      onAuthed(data);
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  el.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(el.signupForm);
    const errorEl = el.signupForm.querySelector('.form-error');
    errorEl.textContent = '';
    try {
      const data = await api('/auth/signup', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password') },
      });
      onAuthed(data);
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  el.guestBtn.addEventListener('click', async () => {
    try {
      const data = await api('/auth/guest', { method: 'POST' });
      onAuthed(data);
    } catch (err) {
      alert(err.message);
    }
  });

  // ---------- Google Sign-In (only shown if the server has it configured) ----------

  async function initGoogleSignIn() {
    try {
      const { clientId } = await api('/auth/google-client-id');
      if (!clientId || !window.google || !window.google.accounts) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const data = await api('/auth/google', { method: 'POST', body: { credential: response.credential } });
            onAuthed(data);
          } catch (err) {
            alert(err.message);
          }
        },
      });
      window.google.accounts.id.renderButton(el.googleSigninBtn, {
        theme: 'outline',
        size: 'large',
        width: 280,
      });
      el.googleSigninWrap.classList.remove('hidden');
    } catch {
      // No client ID configured, or Google's script hasn't loaded -- the
      // button simply stays hidden and the rest of the app works as normal.
    }
  }
  // Google's script loads async; give it a moment before checking window.google.
  window.addEventListener('load', () => setTimeout(initGoogleSignIn, 300));

  function onAuthed(data) {
    state.token = data.token;
    state.username = data.username;
    state.isGuest = !!data.isGuest;
    state.bio = data.bio || '';
    state.displayName = data.displayName || data.username;
    state.accountId = data.accountId || state.accountId;
    state.avatarColor = data.avatarColor || AVATAR_COLORS[0];
    state.avatarImage = data.avatarImage || null;
    localStorage.setItem('nc_token', state.token);
    localStorage.setItem('nc_username', state.username);
    localStorage.setItem('nc_isGuest', String(state.isGuest));
    enterApp();
  }

  // ================= Tutorial / onboarding =================

  const TUTORIALS = {
    netchat: [
      {
        title: 'Welcome to NetChat',
        body: "Everyone connected to the same WiFi or Ethernet network automatically lands in the same room — no setup needed. Switch networks and you'll be moved into a different room.",
      },
      {
        title: 'The room badge',
        body: 'That pulsing badge up top shows your current room. Click it if you want to set a custom room name instead — handy on mobile data, where many people can share one network address.',
      },
      {
        title: 'Messages & files',
        body: 'Type and hit Send to chat with everyone in the room. The 📎 icon next to the message box lets you share a file with the room.',
      },
      {
        title: 'Insights & reporting',
        body: "Click Insights to see how many people are online right now, plus room stats. If someone's messages are a problem, hover their message and click ⚑ to report it.",
      },
      {
        title: 'Add friends instantly',
        body: 'Hover any message from someone else and click the ＋ icon to send them a friend request on the spot — no typing required.',
      },
    ],
    outchat: [
      {
        title: 'Welcome to OutChat',
        body: 'This is the Discord-style side of the app — create or join channels that work over the internet, not just your local network.',
      },
      {
        title: 'Create a channel',
        body: 'Click "+ Create channel" to start one. You become the owner and get a shareable invite code for others to join.',
      },
      {
        title: 'Join with a code',
        body: "Got an invite code from someone? Paste it under \"Join with code.\" This sends a request — the owner has to approve it before you're in.",
      },
      {
        title: "As the channel owner",
        body: 'Click Manage to approve or reject join requests, and handle membership. You have full control over who\'s in your channel.',
      },
      {
        title: 'Friends work here too',
        body: 'Click any username to view their profile, or use the friends icon to manage requests and start a direct message.',
      },
    ],
  };

  let tutorialMode = null;
  let tutorialStep = 0;

  function tutorialSeenKey(mode) {
    return `nc_tutorial_seen_${mode}`;
  }

  function maybeShowTutorial(mode) {
    if (localStorage.getItem(tutorialSeenKey(mode))) return;
    openTutorial(mode);
  }

  function openTutorial(mode) {
    tutorialMode = mode;
    tutorialStep = 0;
    renderTutorialStep();
    el.tutorialModal.classList.remove('hidden');
  }

  function closeTutorial() {
    if (tutorialMode) localStorage.setItem(tutorialSeenKey(tutorialMode), 'true');
    el.tutorialModal.classList.add('hidden');
    tutorialMode = null;
  }

  function renderTutorialStep() {
    const steps = TUTORIALS[tutorialMode];
    const step = steps[tutorialStep];
    el.tutorialTitle.textContent = step.title;
    el.tutorialBody.textContent = step.body;
    el.tutorialBack.classList.toggle('hidden', tutorialStep === 0);
    el.tutorialNext.textContent = tutorialStep === steps.length - 1 ? 'Got it' : 'Next';

    el.tutorialDots.innerHTML = '';
    steps.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'tutorial-dot' + (i === tutorialStep ? ' active' : '');
      el.tutorialDots.appendChild(dot);
    });
  }

  el.tutorialNext.addEventListener('click', () => {
    const steps = TUTORIALS[tutorialMode];
    if (tutorialStep < steps.length - 1) {
      tutorialStep += 1;
      renderTutorialStep();
    } else {
      closeTutorial();
    }
  });
  el.tutorialBack.addEventListener('click', () => {
    if (tutorialStep > 0) {
      tutorialStep -= 1;
      renderTutorialStep();
    }
  });
  el.tutorialSkip.addEventListener('click', closeTutorial);
  el.tutorialModal.addEventListener('click', (e) => {
    if (e.target === el.tutorialModal) closeTutorial();
  });

  el.helpBtn1.addEventListener('click', () => openTutorial('netchat'));
  el.helpBtn2.addEventListener('click', () => openTutorial('outchat'));

  // ================= App bootstrap =================

  function enterApp() {
    el.authScreen.classList.add('hidden');
    updateAvatarButtons();
    hydrateProfile();

    let mode = localStorage.getItem('nc_mode') === 'outchat' ? 'outchat' : 'netchat';
    if (state.isGuest) mode = 'netchat'; // guests are NetChat-only
    setMode(mode);

    connectSocket();
    loadNetchat();
    if (!state.isGuest) refreshFriendsBadge();
    maybeRequestNotificationPermission();
  }

  async function hydrateProfile() {
    try {
      const data = await api('/profile/me');
      state.bio = data.bio || '';
      state.displayName = data.displayName || state.username;
      state.accountId = data.accountId || state.accountId;
      state.email = data.email || '';
      state.emailPublic = !!data.emailPublic;
      state.avatarColor = data.avatarColor;
      state.avatarImage = data.avatarImage || null;
      state.hasPassword = !!data.hasPassword;
      updateAvatarButtons();
    } catch {
      /* not fatal -- profile modal will retry when opened */
    }
  }

  function updateAvatarButtons() {
    const initial = (state.displayName || state.username || '?')[0].toUpperCase();
    [el.profileAvatarInitial, el.profileAvatarInitial2].forEach((node) => {
      const btn = node.parentElement;
      btn.querySelectorAll('img').forEach((img) => img.remove());
      if (state.avatarImage) {
        node.classList.add('hidden');
        const img = document.createElement('img');
        img.src = state.avatarImage;
        img.alt = '';
        btn.appendChild(img);
        btn.style.background = 'transparent';
      } else {
        node.classList.remove('hidden');
        node.textContent = initial;
        btn.style.background = state.avatarColor;
      }
    });
  }

  function setMode(mode) {
    state.mode = mode;
    localStorage.setItem('nc_mode', mode);
    document.documentElement.dataset.mode = mode;
    el.netchatScreen.classList.toggle('hidden', mode !== 'netchat');
    el.outchatScreen.classList.toggle('hidden', mode !== 'outchat');
    if (mode === 'outchat') loadChannels();
    maybeShowTutorial(mode);
  }

  function trySwitchMode(target) {
    if (target === 'outchat' && state.isGuest) {
      alert('Guests can only use NetChat. Sign up for a full account (from the login screen) to unlock OutChat and Friends.');
      return;
    }
    setMode(target);
  }
  el.modeToggle1.addEventListener('click', () => trySwitchMode('outchat'));
  el.modeToggle2.addEventListener('click', () => trySwitchMode('netchat'));

  // ================= Socket (shared across NetChat / DMs / OutChat) =================

  function connectSocket() {
    if (state.socket) state.socket.disconnect();
    state.socket = io({ auth: { token: state.token } });

    state.socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') {
        doLogout('Your session expired. Please log in again.');
      }
    });

    // NetChat
    state.socket.on('room:joined', (room) => {
      state.room = room;
      renderRoomBadge(room);
    });
    state.socket.on('presence:count', (count) => {
      state.presenceCount = count;
      el.presenceCount.textContent = `${count} online`;
    });
    state.socket.on('chat:message', (message) => {
      renderMessage(message);
      scrollEl(el.messages);
    });
    state.socket.on('chat:message:edited', (message) => applyEditedMessage(el.messages, message));
    state.socket.on('chat:message:deleted', ({ id }) => applyDeletedMessage(el.messages, id));

    // Friends
    state.socket.on('friend:request', (request) => {
      refreshFriendsBadge();
      notifyIncoming('Friend request', `${request.from} wants to be friends`, () => openFriendsModal());
    });
    state.socket.on('friend:accepted', () => {
      refreshFriendsBadge();
      if (!el.friendsModal.classList.contains('hidden')) openFriendsModal();
    });

    // Direct messages
    state.socket.on('dm:message', (message) => {
      const partner = message.from === state.username ? message.to : message.from;
      const dmOpenForThisPartner = !el.dmModal.classList.contains('hidden') && state.dmPartner === partner;

      if (dmOpenForThisPartner) {
        renderDmMessage(message);
        scrollEl(el.dmMessages);
      } else if (message.from !== state.username) {
        notifyIncoming(`${message.displayName || message.from}`, message.content || 'Sent a file', () =>
          openDmModal(message.from)
        );
      }
    });
    state.socket.on('dm:message:edited', (message) => applyEditedMessage(el.dmMessages, message));
    state.socket.on('dm:message:deleted', ({ id }) => applyDeletedMessage(el.dmMessages, id));

    // OutChat
    state.socket.on('outchat:message', (message) => {
      if (message.channelId === state.currentChannelId) {
        renderOutchatMessage(message);
        scrollEl(el.outchatMessages);
      }
    });
    state.socket.on('outchat:message:edited', (message) => {
      if (message.channelId === state.currentChannelId) applyEditedMessage(el.outchatMessages, message);
    });
    state.socket.on('outchat:message:deleted', ({ id, channelId }) => {
      if (channelId === state.currentChannelId) applyDeletedMessage(el.outchatMessages, id);
    });

    // Typing indicators
    state.socket.on('typing', (payload) => {
      if (payload.context === 'netchat') {
        showTypingIndicator(el.typingIndicator, payload.displayName);
      } else if (payload.context === 'outchat' && payload.channelId === state.currentChannelId) {
        showTypingIndicator(el.outchatTypingIndicator, payload.displayName);
      } else if (payload.context === 'dm' && payload.username === state.dmPartner) {
        showTypingIndicator(el.dmTypingIndicator, payload.displayName);
      }
    });
    state.socket.on('outchat:join-request', (payload) => {
      if (payload.channelId === state.currentChannelId) refreshCurrentChannel();
    });
    state.socket.on('outchat:approved', () => loadChannels());
    state.socket.on('outchat:kicked', (payload) => {
      if (payload.channelId === state.currentChannelId) {
        state.currentChannelId = null;
        el.outchatChannel.classList.add('hidden');
        el.outchatEmpty.classList.remove('hidden');
        alert(`You were removed from "${payload.channelName}".`);
      }
      loadChannels();
    });
    state.socket.on('outchat:member-removed', () => {
      if (!el.manageModal.classList.contains('hidden')) openManageModal();
    });
    state.socket.on('outchat:ownership-transferred', (payload) => {
      loadChannels();
      if (payload.channelId === state.currentChannelId) refreshCurrentChannel();
    });
  }

  async function quickAddFriend(username, btn) {
    if (state.isGuest) {
      showToast('Sign up for a full account to add friends.');
      return;
    }
    try {
      await api('/friends/request', { method: 'POST', body: { username } });
      showToast(`Friend request sent to ${username}.`);
      if (btn) {
        btn.textContent = '✓';
        btn.disabled = true;
      }
    } catch (err) {
      showToast(err.message);
    }
  }

  // ================= NetChat =================

  async function loadNetchat() {
    try {
      const { room, history } = await api('/rooms/current');
      state.room = room;
      renderRoomBadge(room);
      el.messages.innerHTML = '';
      history.forEach(renderMessage);
      scrollEl(el.messages);
    } catch (err) {
      renderSystemMessage(err.message);
    }
  }

  function renderRoomBadge(room) {
    el.roomIdText.textContent = room.kind === 'manual' ? room.label : room.id;
    el.roomBadge.title =
      room.kind === 'manual'
        ? `Manually set room: "${room.label}". Click to change.`
        : 'Auto-detected from your network. Click to override.';
    if (room.kind === 'manual') trackRecentRoom(room);
  }

  const RECENT_ROOMS_KEY = 'nc_recent_rooms';
  function trackRecentRoom(room) {
    let list = getRecentRooms();
    list = list.filter((r) => r.label !== room.label);
    list.unshift({ label: room.label, lastUsed: Date.now() });
    localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(list.slice(0, 8)));
  }
  function getRecentRooms() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_ROOMS_KEY)) || [];
    } catch {
      return [];
    }
  }
  function renderRecentRooms() {
    const rooms = getRecentRooms().filter((r) => r.label !== state.room?.label);
    el.recentRoomsSection.classList.toggle('hidden', rooms.length === 0);
    el.recentRoomsList.innerHTML = rooms
      .map(
        (r) => `
      <div class="flagged-row">
        <span class="flagged-user">${escapeHtml(r.label)}</span>
        <button class="btn-ghost small-btn" data-recent-room="${escapeHtml(r.label)}">Use this</button>
      </div>`
      )
      .join('');
    el.recentRoomsList.querySelectorAll('[data-recent-room]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        try {
          await api('/rooms/override', { method: 'POST', body: { name: btn.dataset.recentRoom } });
          el.roomModal.classList.add('hidden');
          await loadNetchat();
        } catch (err) {
          alert(err.message);
        }
      })
    );
  }

  el.messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = el.messageInput.value.trim();
    if (!content || !state.socket) return;
    state.socket.emit('chat:message', { content });
    el.messageInput.value = '';
  });
  el.messageInput.addEventListener('input', () => pingTyping(el.messageInput, 'netchat'));

  function renderMessage(m) {
    const wrap = document.createElement('div');
    const mine = m.username === state.username;
    wrap.className = `msg${mine ? ' mine' : ''}`;
    wrap.dataset.messageId = m.id;

    const meta = document.createElement('span');
    meta.className = 'msg-meta';
    meta.appendChild(usernameSpan(m.username, m.displayName || m.username));
    meta.appendChild(document.createTextNode(` · ${formatTime(m.created_at)}`));
    if (m.edited) {
      const tag = document.createElement('span');
      tag.className = 'edited-tag';
      tag.textContent = ' (edited)';
      meta.appendChild(tag);
    }
    wrap.appendChild(meta);

    if (m.deleted) {
      const placeholder = document.createElement('div');
      placeholder.className = 'msg-deleted-text';
      placeholder.textContent = 'Message deleted';
      wrap.appendChild(placeholder);
      el.messages.appendChild(wrap);
      return;
    }

    if (m.file_path) {
      if (/\.(png|jpe?g|gif|webp)$/i.test(m.file_name || '')) {
        const img = document.createElement('img');
        img.src = m.file_path;
        img.alt = m.file_name;
        img.className = 'msg-image';
        wrap.appendChild(img);
      } else if (/\.(mp4|webm|mov|ogg)$/i.test(m.file_name || '')) {
        const video = document.createElement('video');
        video.src = m.file_path;
        video.controls = true;
        video.className = 'msg-image';
        wrap.appendChild(video);
      } else {
        const link = document.createElement('a');
        link.className = 'msg-file';
        link.href = m.file_path;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `📎 ${m.file_name}`;
        wrap.appendChild(link);
      }
    } else {
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.textContent = m.content;
      wrap.appendChild(body);
    }

    if (mine) {
      addOwnMessageControls(wrap, m, {
        editPath: (id) => `/rooms/messages/${id}`,
        deletePath: (id) => `/rooms/messages/${id}`,
      });
    }

    if (!mine) {
      const actions = document.createElement('span');
      actions.className = 'msg-actions';

      if (!state.isGuest) {
        const addFriendBtn = document.createElement('button');
        addFriendBtn.className = 'msg-flag msg-add-friend';
        addFriendBtn.title = `Add ${m.username} as a friend`;
        addFriendBtn.setAttribute('aria-label', `Add ${m.username} as a friend`);
        addFriendBtn.textContent = '＋';
        addFriendBtn.addEventListener('click', () => quickAddFriend(m.username, addFriendBtn));
        actions.appendChild(addFriendBtn);
      }

      const flagBtn = document.createElement('button');
      flagBtn.className = 'msg-flag';
      flagBtn.title = 'Report this message';
      flagBtn.setAttribute('aria-label', 'Report this message');
      flagBtn.textContent = '⚑';
      flagBtn.addEventListener('click', () => openFlagModal(m));
      actions.appendChild(flagBtn);

      wrap.appendChild(actions);
    }

    el.messages.appendChild(wrap);
  }

  function renderSystemMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-system';
    wrap.textContent = text;
    el.messages.appendChild(wrap);
    scrollEl(el.messages);
  }

  // Attach menu (Photos & videos / Document)
  setupAttachMenu(el.attachBtn, el.attachMenu, el.fileInputPhoto, el.fileInputDoc, async (file) => {
    el.uploadStatus.textContent = `Uploading ${file.name}…`;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api('/rooms/upload', { method: 'POST', body: fd, isForm: true });
      el.uploadStatus.textContent = '';
    } catch (err) {
      el.uploadStatus.textContent = err.message;
    }
  });

  // Room override modal
  el.roomBadge.addEventListener('click', () => {
    renderRecentRooms();
    el.roomModal.classList.remove('hidden');
  });
  el.modalClose.addEventListener('click', () => el.roomModal.classList.add('hidden'));

  el.overrideApply.addEventListener('click', async () => {
    const name = el.overrideInput.value.trim();
    if (!name) return;
    try {
      await api('/rooms/override', { method: 'POST', body: { name } });
      el.roomModal.classList.add('hidden');
      await loadNetchat();
    } catch (err) {
      alert(err.message);
    }
  });
  el.overrideReset.addEventListener('click', async () => {
    try {
      await api('/rooms/reset', { method: 'POST' });
      el.roomModal.classList.add('hidden');
      await loadNetchat();
    } catch (err) {
      alert(err.message);
    }
  });

  // Report a message
  function openFlagModal(message) {
    flagTargetMessage = message;
    el.flagError.textContent = '';
    el.flagDetails.value = '';
    el.flagReason.selectedIndex = 0;
    el.flagTarget.textContent = message.file_path
      ? `${message.username}: 📎 ${message.file_name}`
      : `${message.username}: "${message.content}"`;
    el.flagModal.classList.remove('hidden');
  }
  el.flagSubmit.addEventListener('click', async () => {
    if (!flagTargetMessage) return;
    el.flagError.textContent = '';
    try {
      await api('/rooms/report-user', {
        method: 'POST',
        body: {
          messageId: flagTargetMessage.id,
          reason: el.flagReason.value,
          details: el.flagDetails.value.trim(),
        },
      });
      el.flagModal.classList.add('hidden');
    } catch (err) {
      el.flagError.textContent = err.message;
    }
  });

  // Insights modal
  el.reportBtn.addEventListener('click', async () => {
    el.reportModal.classList.remove('hidden');
    el.reportBody.textContent = 'Loading…';
    try {
      const r = await api('/rooms/report');
      const flaggedHtml = r.flaggedUsers.length
        ? r.flaggedUsers
            .map(
              (f) => `
            <div class="flagged-row">
              <div>
                <div class="flagged-user">${escapeHtml(f.username)}</div>
                <div class="flagged-reason">${escapeHtml(f.lastReason)}</div>
              </div>
              <span class="flagged-count">${f.count} report${f.count === 1 ? '' : 's'}</span>
            </div>`
            )
            .join('')
        : '<p class="report-empty">No one has been reported in this room.</p>';

      el.reportBody.innerHTML = `
        <div class="report-section-title">Room stats</div>
        <div class="report-row"><span class="label">Room</span><span class="value">${escapeHtml(r.room.kind === 'manual' ? r.room.label : r.room.id)}</span></div>
        <div class="report-row"><span class="label">Currently online</span><span class="value">${state.presenceCount}</span></div>
        <div class="report-row"><span class="label">Messages</span><span class="value">${r.messageCount}</span></div>
        <div class="report-row"><span class="label">Files shared</span><span class="value">${r.fileCount}</span></div>
        <div class="report-row"><span class="label">Active users (all-time)</span><span class="value">${r.activeUsers}</span></div>
        <div class="report-section-title">Flagged users</div>
        ${flaggedHtml}
      `;
    } catch (err) {
      el.reportBody.textContent = err.message;
    }
  });
  el.reportClose.addEventListener('click', () => el.reportModal.classList.add('hidden'));

  // ================= Settings (Profile) =================

  function renderAvatarPreview() {
    el.avatarPreviewBtn.querySelectorAll('img').forEach((img) => img.remove());
    if (state.avatarImage) {
      el.avatarPreviewInitial.classList.add('hidden');
      const img = document.createElement('img');
      img.src = state.avatarImage;
      img.alt = '';
      el.avatarPreviewBtn.appendChild(img);
      el.avatarPreviewBtn.style.background = 'transparent';
    } else {
      el.avatarPreviewInitial.classList.remove('hidden');
      el.avatarPreviewInitial.textContent = (state.displayName || state.username || '?')[0].toUpperCase();
      el.avatarPreviewBtn.style.background = state.avatarColor;
    }
  }

  function renderProfileView() {
    el.profileViewName.textContent = state.displayName || state.username;
    el.profileUsername.textContent = `@${state.username}${state.isGuest ? ' (guest)' : ''}`;
    el.profileAccountId.textContent = state.accountId ? `ID: ${state.accountId}` : '';
    el.profileViewBio.textContent = state.bio || 'No bio yet.';

    if (state.email) {
      el.profileViewEmail.textContent = `✉ ${state.email}`;
      el.profileViewEmail.classList.remove('hidden');
    } else {
      el.profileViewEmail.classList.add('hidden');
    }

    el.profileViewAvatar.innerHTML = '';
    if (state.avatarImage) {
      const img = document.createElement('img');
      img.src = state.avatarImage;
      img.alt = '';
      el.profileViewAvatar.appendChild(img);
      el.profileViewAvatar.style.background = 'transparent';
    } else {
      el.profileViewAvatar.textContent = (state.displayName || state.username)[0].toUpperCase();
      el.profileViewAvatar.style.background = state.avatarColor;
    }
  }

  function showProfileView() {
    el.settingsView.classList.add('hidden');
    el.profileView.classList.remove('hidden');
    renderProfileView();
  }
  function showSettingsView() {
    el.profileView.classList.add('hidden');
    el.settingsView.classList.remove('hidden');
  }
  el.openSettingsBtn.addEventListener('click', showSettingsView);
  el.settingsBackBtn.addEventListener('click', showProfileView);

  function openProfileModal() {
    el.guestBanner.classList.toggle('hidden', !state.isGuest);
    el.passwordSection.classList.toggle('hidden', state.isGuest || !state.hasPassword);
    el.usernameSection.classList.toggle('hidden', state.isGuest);
    el.usernameFields.classList.add('hidden');
    el.passwordFields.classList.add('hidden');
    el.profileError.textContent = '';
    el.passwordError.textContent = '';
    el.currentPassword.value = '';
    el.newPassword.value = '';
    el.profileDisplayName.value = state.displayName || state.username;
    el.profileBio.value = state.bio;
    el.profileEmail.value = state.email;
    el.profileEmailPublic.checked = state.emailPublic;
    renderAvatarSwatches();
    renderAvatarPreview();
    showProfileView();
    el.profileModal.classList.remove('hidden');

    api('/profile/me')
      .then((data) => {
        state.bio = data.bio || '';
        state.displayName = data.displayName || state.username;
        state.accountId = data.accountId || state.accountId;
        state.email = data.email || '';
        state.emailPublic = !!data.emailPublic;
        state.avatarColor = data.avatarColor;
        state.avatarImage = data.avatarImage || null;
        state.hasPassword = !!data.hasPassword;
        el.passwordSection.classList.toggle('hidden', state.isGuest || !state.hasPassword);
        el.profileDisplayName.value = state.displayName;
        el.profileBio.value = state.bio;
        el.profileEmail.value = state.email;
        el.profileEmailPublic.checked = state.emailPublic;
        renderAvatarSwatches();
        renderAvatarPreview();
        renderProfileView();
        updateAvatarButtons();

        const created = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'unknown';
        const method = state.isGuest ? 'Guest session' : data.hasPassword ? 'Username & password' : 'Google sign-in';
        el.accountInfoHint.textContent = `Joined ${created} · ${method}`;
      })
      .catch(() => {
        /* keep the cached values already shown */
      });

    el.profileModal.classList.remove('hidden');
  }
  el.profileBtn.addEventListener('click', openProfileModal);
  el.profileBtn2.addEventListener('click', openProfileModal);

  function renderAvatarSwatches() {
    el.avatarSwatches.innerHTML = '';
    AVATAR_COLORS.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (color === state.avatarColor && !state.avatarImage ? ' selected' : '');
      btn.style.background = color;
      btn.addEventListener('click', () => {
        state.avatarColor = color;
        state.avatarImage = null; // picking a color falls back off any custom image
        renderAvatarSwatches();
        renderAvatarPreview();
      });
      el.avatarSwatches.appendChild(btn);
    });
  }

  el.avatarPreviewBtn.addEventListener('click', () => el.avatarFileInput.click());
  el.avatarFileInput.addEventListener('change', async () => {
    const file = el.avatarFileInput.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { avatarImage } = await api('/profile/avatar', { method: 'POST', body: fd, isForm: true });
      state.avatarImage = avatarImage;
      renderAvatarPreview();
      updateAvatarButtons();
      showToast('Avatar updated.');
    } catch (err) {
      el.profileError.textContent = err.message;
    }
    el.avatarFileInput.value = '';
  });

  el.profileSave.addEventListener('click', async () => {
    el.profileError.textContent = '';
    try {
      await api('/profile/me', {
        method: 'PATCH',
        body: {
          bio: el.profileBio.value.trim(),
          avatarColor: state.avatarColor,
          displayName: el.profileDisplayName.value.trim(),
          email: el.profileEmail.value.trim(),
          emailPublic: el.profileEmailPublic.checked,
        },
      });
      state.displayName = el.profileDisplayName.value.trim();
      state.email = el.profileEmail.value.trim();
      state.emailPublic = el.profileEmailPublic.checked;
      updateAvatarButtons();
      renderProfileView();
      showToast('Profile saved.');
    } catch (err) {
      el.profileError.textContent = err.message;
    }
  });

  el.passwordToggleBtn.addEventListener('click', () => {
    el.passwordFields.classList.toggle('hidden');
  });

  // ---------- Username change ----------

  el.usernameToggleBtn.addEventListener('click', () => {
    el.usernameFields.classList.toggle('hidden');
    el.usernamePasswordLabel.classList.toggle('hidden', !state.hasPassword);
    el.newUsername.value = '';
    el.usernamePassword.value = '';
    el.usernameError.textContent = '';
  });

  el.usernameSave.addEventListener('click', async () => {
    el.usernameError.textContent = '';
    try {
      const data = await api('/profile/username', {
        method: 'POST',
        body: {
          newUsername: el.newUsername.value.trim(),
          currentPassword: el.usernamePassword.value,
        },
      });
      // The username is baked into the JWT (used for socket auth and every
      // username-based check server-side), so a fresh token is required --
      // just updating local state isn't enough.
      state.token = data.token;
      state.username = data.username;
      localStorage.setItem('nc_token', state.token);
      localStorage.setItem('nc_username', state.username);
      el.usernameFields.classList.add('hidden');
      updateAvatarButtons();
      renderProfileView();
      connectSocket();
      showToast('Username updated.');
    } catch (err) {
      el.usernameError.textContent = err.message;
    }
  });

  // ---------- Privacy: blocked users ----------

  el.privacyToggleBtn.addEventListener('click', async () => {
    const opening = el.blockedListWrap.classList.contains('hidden');
    el.blockedListWrap.classList.toggle('hidden');
    if (!opening) return;
    el.blockedList.textContent = 'Loading…';
    try {
      const { blocked } = await api('/friends/blocked');
      el.blockedList.innerHTML = blocked.length
        ? blocked
            .map(
              (u) => `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(u)}</span>
          <button class="btn-ghost small-btn" data-unblock="${escapeHtml(u)}">Unblock</button>
        </div>`
            )
            .join('')
        : '<p class="report-empty">No one is blocked.</p>';
      el.blockedList.querySelectorAll('[data-unblock]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api('/friends/unblock', { method: 'POST', body: { username: btn.dataset.unblock } });
          btn.closest('.flagged-row').remove();
          showToast(`Unblocked ${btn.dataset.unblock}.`);
        })
      );
    } catch (err) {
      el.blockedList.textContent = err.message;
    }
  });

  // ---------- Keyboard shortcuts panel ----------

  el.shortcutsToggleBtn.addEventListener('click', () => {
    const opening = el.shortcutsPanel.classList.contains('hidden');
    el.shortcutsPanel.classList.toggle('hidden');
    el.shortcutsToggleBtn.textContent = opening ? 'Hide' : 'Show';
  });

  // ---------- Help panel ----------

  el.helpToggleBtn.addEventListener('click', () => {
    const opening = el.helpPanel.classList.contains('hidden');
    el.helpPanel.classList.toggle('hidden');
    el.helpToggleBtn.textContent = opening ? 'Hide' : 'Show';
  });

  el.passwordSave.addEventListener('click', async () => {
    el.passwordError.textContent = '';
    try {
      await api('/profile/change-password', {
        method: 'POST',
        body: { currentPassword: el.currentPassword.value, newPassword: el.newPassword.value },
      });
      el.currentPassword.value = '';
      el.newPassword.value = '';
      el.passwordError.textContent = 'Password updated.';
    } catch (err) {
      el.passwordError.textContent = err.message;
    }
  });

  // ================= Public profile card =================

  async function openProfileCard(username) {
    el.profileCardModal.classList.remove('hidden');
    el.profileCardName.textContent = username;
    el.profileCardUsername.textContent = '';
    el.profileCardBio.textContent = 'Loading…';
    el.profileCardEmail.classList.add('hidden');
    el.profileCardAvatar.innerHTML = '';
    el.profileCardAvatar.style.background = '#39ff6e';

    const showBlock = username !== state.username && !state.isGuest;
    el.profileCardActions.classList.toggle('hidden', !showBlock);
    el.profileCardBlock.onclick = showBlock
      ? async () => {
          if (!confirm(`Block ${username}? They won't be able to message or friend-request you.`)) return;
          try {
            await api('/friends/block', { method: 'POST', body: { username } });
            showToast(`Blocked ${username}.`);
            el.profileCardModal.classList.add('hidden');
          } catch (err) {
            alert(err.message);
          }
        }
      : null;

    try {
      const p = await api(`/profile/public/${encodeURIComponent(username)}`);
      el.profileCardName.textContent = p.displayName;
      el.profileCardUsername.textContent = `@${p.username}`;
      el.profileCardBio.textContent = p.bio || 'No bio yet.';
      if (p.email) {
        el.profileCardEmail.textContent = `✉ ${p.email}`;
        el.profileCardEmail.classList.remove('hidden');
      }
      if (p.avatarImage) {
        const img = document.createElement('img');
        img.src = p.avatarImage;
        img.alt = '';
        el.profileCardAvatar.appendChild(img);
        el.profileCardAvatar.style.background = 'transparent';
      } else {
        el.profileCardAvatar.textContent = p.displayName[0].toUpperCase();
        el.profileCardAvatar.style.background = p.avatarColor;
      }
    } catch (err) {
      el.profileCardBio.textContent = err.message;
    }
  }

  // Turns any rendered username into a clickable element opening its profile card.
  function usernameSpan(username, displayText) {
    const span = document.createElement('span');
    span.className = 'clickable-username';
    span.textContent = displayText || username;
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      openProfileCard(username);
    });
    return span;
  }

  // ================= Message edit / delete (1-minute window) =================

  const EDIT_WINDOW_MS = 60 * 1000;

  // Adds Edit (text-only) and Delete buttons to a message you sent, but only
  // while still inside the 1-minute window -- and removes them automatically
  // the instant that window closes, without needing a refresh.
  function addOwnMessageControls(wrap, m, paths) {
    if (m.deleted) return;
    const remaining = EDIT_WINDOW_MS - (Date.now() - new Date(m.created_at).getTime());
    if (remaining <= 0) return;

    let actions = wrap.querySelector('.msg-actions');
    if (!actions) {
      actions = document.createElement('span');
      actions.className = 'msg-actions';
      wrap.appendChild(actions);
    }

    let editBtn = null;
    if (!m.file_path) {
      editBtn = document.createElement('button');
      editBtn.className = 'msg-flag msg-edit';
      editBtn.title = 'Edit message';
      editBtn.setAttribute('aria-label', 'Edit message');
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', () => startInlineEdit(wrap, m, paths));
      actions.appendChild(editBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'msg-flag msg-delete';
    delBtn.title = 'Delete message';
    delBtn.setAttribute('aria-label', 'Delete message');
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this message? This cannot be undone.')) return;
      try {
        await api(paths.deletePath(m.id), { method: 'DELETE' });
      } catch (err) {
        alert(err.message);
      }
    });
    actions.appendChild(delBtn);

    setTimeout(() => {
      if (editBtn) editBtn.remove();
      delBtn.remove();
    }, remaining);
  }

  function startInlineEdit(wrap, m, paths) {
    const body = wrap.querySelector('.msg-body');
    if (!body) return;
    const original = m.content;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'msg-edit-input';
    input.value = original;
    body.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    function finish(save) {
      if (done) return;
      done = true;
      const value = input.value.trim();
      if (save && value && value !== original) {
        api(paths.editPath(m.id), { method: 'PATCH', body: { content: value } }).catch((err) =>
          alert(err.message)
        );
      }
      const newBody = document.createElement('div');
      newBody.className = 'msg-body';
      newBody.textContent = save && value ? value : original;
      input.replaceWith(newBody);
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  // Applies a real-time "edited" or "deleted" update to an already-rendered
  // message, without re-fetching or re-rendering the whole list.
  function applyEditedMessage(container, message) {
    const node = container.querySelector(`[data-message-id="${message.id}"]`);
    if (!node) return;
    const body = node.querySelector('.msg-body');
    if (body) body.textContent = message.content;
    const meta = node.querySelector('.msg-meta');
    if (meta && !meta.querySelector('.edited-tag')) {
      const tag = document.createElement('span');
      tag.className = 'edited-tag';
      tag.textContent = ' (edited)';
      meta.appendChild(tag);
    }
  }
  function applyDeletedMessage(container, id) {
    const node = container.querySelector(`[data-message-id="${id}"]`);
    if (!node) return;
    node.querySelectorAll('.msg-body, .msg-file, .msg-image, .msg-actions, .msg-flag').forEach((n) => n.remove());
    const placeholder = document.createElement('div');
    placeholder.className = 'msg-deleted-text';
    placeholder.textContent = 'Message deleted';
    node.appendChild(placeholder);
  }

  // ================= Friends =================

  async function refreshFriendsBadge() {
    if (state.isGuest) return;
    try {
      const { incoming } = await api('/friends');
      const hasRequests = incoming.length > 0;
      el.friendsBadge.classList.toggle('hidden', !hasRequests);
      el.friendsBadge2.classList.toggle('hidden', !hasRequests);
    } catch {
      /* not fatal */
    }
  }

  async function openFriendsModal() {
    el.friendsModal.classList.remove('hidden');
    el.addFriendError.textContent = '';
    try {
      const { friends, incoming, outgoing } = await api('/friends');

      el.incomingSection.classList.toggle('hidden', incoming.length === 0);
      el.incomingList.innerHTML = incoming
        .map(
          (r) => `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(r.from)}</span>
          <span>
            <button class="btn-ghost small-btn" data-accept="${r.id}">Accept</button>
            <button class="btn-ghost small-btn" data-decline="${r.id}">Decline</button>
          </span>
        </div>`
        )
        .join('');

      const outgoingHtml = outgoing.length
        ? outgoing
            .map(
              (r) => `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(r.to)}</span>
          <span class="flagged-reason">Request sent — waiting for them to accept</span>
        </div>`
            )
            .join('')
        : '';

      el.friendsList.innerHTML =
        outgoingHtml +
        (friends.length
          ? friends
              .map(
                (f) => `
        <div class="flagged-row friend-row">
          <span class="flagged-user friend-name" data-view="${escapeHtml(f.username)}">
            ${f.starred ? '⭐ ' : ''}${escapeHtml(f.displayName || f.username)}
          </span>
          <span class="friend-row-actions">
            <button class="btn-ghost small-btn" data-message="${escapeHtml(f.username)}">Message</button>
            <button class="icon-btn friend-menu-btn" data-menu="${escapeHtml(f.username)}" title="More">⋮</button>
            <div class="friend-menu hidden" data-menu-panel="${escapeHtml(f.username)}">
              <button data-star="${escapeHtml(f.username)}">${f.starred ? '☆ Unstar' : '⭐ Star friend'}</button>
              <button data-view-profile="${escapeHtml(f.username)}">View profile</button>
              <button class="danger-item" data-remove="${escapeHtml(f.username)}">Remove friend</button>
            </div>
          </span>
        </div>`
              )
              .join('')
          : outgoing.length
          ? ''
          : '<p class="report-empty">No friends yet — add one above, or use the ⚑-style “+ friend” icon on any message in chat.</p>');

      el.friendsList.querySelectorAll('[data-view], [data-view-profile]').forEach((node) =>
        node.addEventListener('click', () => {
          openProfileCard(node.dataset.view || node.dataset.viewProfile);
        })
      );
      el.friendsList.querySelectorAll('[data-menu]').forEach((btn) =>
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const panel = el.friendsList.querySelector(`[data-menu-panel="${btn.dataset.menu}"]`);
          const wasHidden = panel.classList.contains('hidden');
          el.friendsList.querySelectorAll('.friend-menu').forEach((p) => p.classList.add('hidden'));
          if (wasHidden) panel.classList.remove('hidden');
        })
      );
      el.friendsList.querySelectorAll('[data-star]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api('/friends/star', { method: 'POST', body: { username: btn.dataset.star } });
          openFriendsModal();
        })
      );

      el.incomingList.querySelectorAll('[data-accept]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api('/friends/accept', { method: 'POST', body: { requestId: Number(btn.dataset.accept) } });
          openFriendsModal();
          refreshFriendsBadge();
        })
      );
      el.incomingList.querySelectorAll('[data-decline]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api('/friends/decline', { method: 'POST', body: { requestId: Number(btn.dataset.decline) } });
          openFriendsModal();
          refreshFriendsBadge();
        })
      );
      el.friendsList.querySelectorAll('[data-message]').forEach((btn) =>
        btn.addEventListener('click', () => {
          el.friendsModal.classList.add('hidden');
          openDmModal(btn.dataset.message);
        })
      );
      el.friendsList.querySelectorAll('[data-remove]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api('/friends/remove', { method: 'POST', body: { username: btn.dataset.remove } });
          openFriendsModal();
        })
      );
    } catch (err) {
      el.friendsList.textContent = err.message;
    }
  }
  document.addEventListener('click', () => {
    document.querySelectorAll('.friend-menu').forEach((p) => p.classList.add('hidden'));
  });

  el.friendsBtn.addEventListener('click', openFriendsModal);
  el.friendsBtn2.addEventListener('click', openFriendsModal);

  el.addFriendBtn.addEventListener('click', async () => {
    el.addFriendError.textContent = '';
    const username = el.addFriendInput.value.trim().replace(/^@/, '');
    if (!username) return;
    try {
      await api('/friends/request', { method: 'POST', body: { username } });
      el.addFriendInput.value = '';
      showToast(`Friend request sent to ${username}.`);
      openFriendsModal();
    } catch (err) {
      el.addFriendError.textContent = err.message;
    }
  });

  // ================= Direct messages =================

  function openDmModal(username) {
    state.dmPartner = username;
    el.dmTitle.textContent = `Chat with ${username}`;
    el.dmMessages.innerHTML = 'Loading…';
    el.dmModal.classList.remove('hidden');

    api(`/dm/${encodeURIComponent(username)}`)
      .then(({ history }) => {
        el.dmMessages.innerHTML = '';
        history.forEach(renderDmMessage);
        scrollEl(el.dmMessages);
      })
      .catch((err) => {
        el.dmMessages.textContent = err.message;
      });
  }

  function renderDmMessage(m) {
    const wrap = document.createElement('div');
    const mine = m.from === state.username;
    wrap.className = `msg${mine ? ' mine' : ''}`;
    wrap.dataset.messageId = m.id;
    const meta = document.createElement('span');
    meta.className = 'msg-meta';
    meta.appendChild(usernameSpan(m.from, m.displayName || m.from));
    meta.appendChild(document.createTextNode(` · ${formatTime(m.created_at)}`));
    if (m.edited) {
      const tag = document.createElement('span');
      tag.className = 'edited-tag';
      tag.textContent = ' (edited)';
      meta.appendChild(tag);
    }
    wrap.appendChild(meta);

    if (m.deleted) {
      const placeholder = document.createElement('div');
      placeholder.className = 'msg-deleted-text';
      placeholder.textContent = 'Message deleted';
      wrap.appendChild(placeholder);
      el.dmMessages.appendChild(wrap);
      return;
    }

    if (m.file_path) {
      if (/\.(png|jpe?g|gif|webp)$/i.test(m.file_name || '')) {
        const img = document.createElement('img');
        img.src = m.file_path;
        img.alt = m.file_name;
        img.className = 'msg-image';
        wrap.appendChild(img);
      } else if (/\.(mp4|webm|mov|ogg)$/i.test(m.file_name || '')) {
        const video = document.createElement('video');
        video.src = m.file_path;
        video.controls = true;
        video.className = 'msg-image';
        wrap.appendChild(video);
      } else {
        const link = document.createElement('a');
        link.className = 'msg-file';
        link.href = m.file_path;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `📎 ${m.file_name}`;
        wrap.appendChild(link);
      }
    } else {
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.textContent = m.content;
      wrap.appendChild(body);
    }

    if (mine) {
      addOwnMessageControls(wrap, m, {
        editPath: (id) => `/dm/messages/${id}`,
        deletePath: (id) => `/dm/messages/${id}`,
      });
    }

    el.dmMessages.appendChild(wrap);
  }

  el.dmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = el.dmInput.value.trim();
    if (!content || !state.dmPartner) return;
    state.socket.emit('dm:message', { to: state.dmPartner, content }, (res) => {
      if (res && res.error) alert(res.error);
    });
    el.dmInput.value = '';
  });
  el.dmInput.addEventListener('input', () => {
    if (state.dmPartner) pingTyping(el.dmInput, 'dm', { to: state.dmPartner });
  });

  setupAttachMenu(el.dmAttachBtn, el.dmAttachMenu, el.dmFileInputPhoto, el.dmFileInputDoc, async (file) => {
    if (!state.dmPartner) return;
    el.dmUploadStatus.textContent = `Uploading ${file.name}…`;
    const fd = new FormData();
    fd.append('to', state.dmPartner);
    fd.append('file', file);
    try {
      await api('/dm/upload', { method: 'POST', body: fd, isForm: true });
      el.dmUploadStatus.textContent = '';
    } catch (err) {
      el.dmUploadStatus.textContent = err.message;
    }
  });

  // ================= OutChat =================

  async function loadChannels() {
    try {
      const { channels } = await api('/outchat/channels');
      el.channelList.innerHTML = channels.length
        ? channels
            .map(
              (c) => `
        <button class="channel-item${c.id === state.currentChannelId ? ' active' : ''}" data-channel="${c.id}">
          <span class="channel-item-photo" style="${c.photo ? '' : `background:${AVATAR_COLORS[c.id.length % AVATAR_COLORS.length]}`}">
            ${c.photo ? `<img src="${c.photo}" alt="" />` : escapeHtml(c.name[0].toUpperCase())}
          </span>
          <span class="channel-item-text">
            <span class="channel-item-name">${escapeHtml(c.name)}</span>
            ${c.myRole === 'owner' ? '<span class="channel-item-role">owner</span>' : ''}
          </span>
        </button>`
            )
            .join('')
        : '<p class="report-empty">No channels yet.</p>';

      el.channelList.querySelectorAll('[data-channel]').forEach((btn) => {
        btn.addEventListener('click', () => selectChannel(btn.dataset.channel));
      });
    } catch (err) {
      el.channelList.textContent = err.message;
    }
  }

  async function selectChannel(channelId) {
    try {
      const { channel, pending, history } = await api(`/outchat/channels/${channelId}`);
      state.currentChannelId = channel.id;

      el.outchatEmpty.classList.add('hidden');
      el.outchatChannel.classList.remove('hidden');
      el.channelName.textContent = channel.name;
      el.channelInvite.textContent = `Invite code: ${channel.inviteCode}`;
      state.currentChannel = channel;

      el.channelPhoto.innerHTML = '';
      if (channel.photo) {
        const img = document.createElement('img');
        img.src = channel.photo;
        img.alt = '';
        el.channelPhoto.appendChild(img);
        el.channelPhoto.style.background = 'transparent';
      } else {
        el.channelPhoto.textContent = channel.name[0].toUpperCase();
        el.channelPhoto.style.background = AVATAR_COLORS[channel.id.length % AVATAR_COLORS.length];
      }

      const isOwner = channel.myRole === 'owner';
      state.currentChannelIsOwner = isOwner;
      el.channelMenuEdit.classList.toggle('hidden', !isOwner);
      el.channelMenuManage.classList.toggle('hidden', !isOwner);
      el.channelMenuTransfer.classList.toggle('hidden', !isOwner);
      el.pendingBadge.classList.toggle('hidden', !(isOwner && pending.length));
      el.pendingBadge.textContent = pending.length;

      el.outchatMessages.innerHTML = '';
      history.forEach(renderOutchatMessage);
      scrollEl(el.outchatMessages);

      state.socket.emit('outchat:join', { channelId: channel.id }, () => {});
      loadChannels(); // refresh active-state highlight in sidebar
    } catch (err) {
      alert(err.message);
    }
  }

  function refreshCurrentChannel() {
    if (state.currentChannelId) selectChannel(state.currentChannelId);
  }

  function renderOutchatMessage(m) {
    const wrap = document.createElement('div');
    const mine = m.username === state.username;
    wrap.className = `msg${mine ? ' mine' : ''}`;
    wrap.dataset.messageId = m.id;
    const meta = document.createElement('span');
    meta.className = 'msg-meta';
    meta.appendChild(usernameSpan(m.username, m.displayName || m.username));
    meta.appendChild(document.createTextNode(` · ${formatTime(m.created_at)}`));
    if (m.edited) {
      const tag = document.createElement('span');
      tag.className = 'edited-tag';
      tag.textContent = ' (edited)';
      meta.appendChild(tag);
    }
    wrap.appendChild(meta);

    if (m.deleted) {
      const placeholder = document.createElement('div');
      placeholder.className = 'msg-deleted-text';
      placeholder.textContent = 'Message deleted';
      wrap.appendChild(placeholder);
      el.outchatMessages.appendChild(wrap);
      return;
    }

    if (m.file_path) {
      if (/\.(png|jpe?g|gif|webp)$/i.test(m.file_name || '')) {
        const img = document.createElement('img');
        img.src = m.file_path;
        img.alt = m.file_name;
        img.className = 'msg-image';
        wrap.appendChild(img);
      } else if (/\.(mp4|webm|mov|ogg)$/i.test(m.file_name || '')) {
        const video = document.createElement('video');
        video.src = m.file_path;
        video.controls = true;
        video.className = 'msg-image';
        wrap.appendChild(video);
      } else {
        const link = document.createElement('a');
        link.className = 'msg-file';
        link.href = m.file_path;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `📎 ${m.file_name}`;
        wrap.appendChild(link);
      }
    } else {
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.textContent = m.content;
      wrap.appendChild(body);
    }

    if (mine) {
      addOwnMessageControls(wrap, m, {
        editPath: (id) => `/outchat/messages/${id}`,
        deletePath: (id) => `/outchat/messages/${id}`,
      });
    }

    if (!mine) {
      const addFriendBtn = document.createElement('button');
      addFriendBtn.className = 'msg-flag msg-add-friend';
      addFriendBtn.title = `Add ${m.username} as a friend`;
      addFriendBtn.setAttribute('aria-label', `Add ${m.username} as a friend`);
      addFriendBtn.textContent = '＋';
      addFriendBtn.addEventListener('click', () => quickAddFriend(m.username, addFriendBtn));
      wrap.appendChild(addFriendBtn);
    }

    el.outchatMessages.appendChild(wrap);
  }

  el.outchatMessageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = el.outchatMessageInput.value.trim();
    if (!content || !state.currentChannelId) return;
    state.socket.emit('outchat:message', { channelId: state.currentChannelId, content }, (res) => {
      if (res && res.error) alert(res.error);
    });
    el.outchatMessageInput.value = '';
  });
  el.outchatMessageInput.addEventListener('input', () => {
    if (state.currentChannelId) pingTyping(el.outchatMessageInput, 'outchat', { channelId: state.currentChannelId });
  });

  setupAttachMenu(el.outchatAttachBtn, el.outchatAttachMenu, el.outchatFileInputPhoto, el.outchatFileInputDoc, async (file) => {
    if (!state.currentChannelId) return;
    el.outchatUploadStatus.textContent = `Uploading ${file.name}…`;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api(`/outchat/channels/${state.currentChannelId}/upload`, { method: 'POST', body: fd, isForm: true });
      el.outchatUploadStatus.textContent = '';
    } catch (err) {
      el.outchatUploadStatus.textContent = err.message;
    }
  });

  // Create channel
  el.createChannelBtn.addEventListener('click', () => {
    el.newChannelName.value = '';
    el.createChannelError.textContent = '';
    el.createChannelModal.classList.remove('hidden');
  });
  el.createChannelSubmit.addEventListener('click', async () => {
    el.createChannelError.textContent = '';
    const name = el.newChannelName.value.trim();
    if (!name) return;
    try {
      const { channel } = await api('/outchat/channels', { method: 'POST', body: { name } });
      el.createChannelModal.classList.add('hidden');
      await loadChannels();
      selectChannel(channel.id);
    } catch (err) {
      el.createChannelError.textContent = err.message;
    }
  });

  // Join by code
  el.joinCodeBtn.addEventListener('click', async () => {
    el.joinStatus.textContent = '';
    const code = el.joinCodeInput.value.trim();
    if (!code) return;
    try {
      const data = await api('/outchat/channels/join', { method: 'POST', body: { code } });
      if (data.alreadyMember) {
        await loadChannels();
        selectChannel(data.channel.id);
        el.joinStatus.textContent = "You're already a member — opened.";
      } else {
        el.joinStatus.textContent = `Request sent to join "${data.channelName}". Waiting for the owner to approve.`;
      }
      el.joinCodeInput.value = '';
    } catch (err) {
      el.joinStatus.textContent = err.message;
    }
  });

  // Channel three-dot menu
  el.channelMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    el.channelMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => el.channelMenu.classList.add('hidden'));

  el.channelMenuEdit.addEventListener('click', () => {
    el.channelMenu.classList.add('hidden');
    openChannelEditModal();
  });
  el.channelMenuManage.addEventListener('click', () => {
    el.channelMenu.classList.add('hidden');
    openManageModal();
  });
  el.channelMenuTransfer.addEventListener('click', () => {
    el.channelMenu.classList.add('hidden');
    openTransferModal();
  });
  el.channelMenuLeave.addEventListener('click', async () => {
    el.channelMenu.classList.add('hidden');
    if (!state.currentChannelId) return;
    if (!confirm('Leave this channel?')) return;
    try {
      await api(`/outchat/channels/${state.currentChannelId}/leave`, { method: 'POST' });
      state.currentChannelId = null;
      el.outchatChannel.classList.add('hidden');
      el.outchatEmpty.classList.remove('hidden');
      loadChannels();
    } catch (err) {
      alert(err.message);
    }
  });

  // Edit channel profile (name, description, photo) -- owner only
  function renderChannelPhotoPreview() {
    const channel = state.currentChannel;
    el.channelPhotoPreviewBtn.querySelectorAll('img').forEach((img) => img.remove());
    if (channel && channel.photo) {
      el.channelPhotoPreviewInitial.classList.add('hidden');
      const img = document.createElement('img');
      img.src = channel.photo;
      img.alt = '';
      el.channelPhotoPreviewBtn.appendChild(img);
      el.channelPhotoPreviewBtn.style.background = 'transparent';
    } else {
      el.channelPhotoPreviewInitial.classList.remove('hidden');
      el.channelPhotoPreviewInitial.textContent = channel ? channel.name[0].toUpperCase() : '?';
      el.channelPhotoPreviewBtn.style.background = channel
        ? AVATAR_COLORS[channel.id.length % AVATAR_COLORS.length]
        : AVATAR_COLORS[0];
    }
  }

  function openChannelEditModal() {
    if (!state.currentChannel) return;
    el.channelEditName.value = state.currentChannel.name;
    el.channelEditDescription.value = state.currentChannel.description || '';
    el.channelEditError.textContent = '';
    renderChannelPhotoPreview();
    el.channelEditModal.classList.remove('hidden');
  }

  el.channelPhotoPreviewBtn.addEventListener('click', () => el.channelPhotoFileInput.click());
  el.channelPhotoFileInput.addEventListener('change', async () => {
    const file = el.channelPhotoFileInput.files[0];
    if (!file || !state.currentChannelId) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const { photo } = await api(`/outchat/channels/${state.currentChannelId}/photo`, {
        method: 'POST',
        body: fd,
        isForm: true,
      });
      state.currentChannel.photo = photo;
      renderChannelPhotoPreview();
      refreshCurrentChannel();
      showToast('Channel photo updated.');
    } catch (err) {
      el.channelEditError.textContent = err.message;
    }
    el.channelPhotoFileInput.value = '';
  });

  el.channelEditSave.addEventListener('click', async () => {
    el.channelEditError.textContent = '';
    try {
      await api(`/outchat/channels/${state.currentChannelId}`, {
        method: 'PATCH',
        body: {
          name: el.channelEditName.value.trim(),
          description: el.channelEditDescription.value.trim(),
        },
      });
      el.channelEditModal.classList.add('hidden');
      refreshCurrentChannel();
      loadChannels();
      showToast('Channel profile saved.');
    } catch (err) {
      el.channelEditError.textContent = err.message;
    }
  });

  // Transfer ownership: a deliberately two-step confirm per member, so a
  // stray click can't hand off a channel by accident.
  let transferPendingUsername = null;

  async function openTransferModal() {
    if (!state.currentChannelId) return;
    transferPendingUsername = null;
    el.transferModal.classList.remove('hidden');
    el.transferList.textContent = 'Loading…';
    try {
      const { members } = await api(`/outchat/channels/${state.currentChannelId}`);
      renderTransferList(members.filter((m) => m.role !== 'owner'));
    } catch (err) {
      el.transferList.textContent = err.message;
    }
  }

  function renderTransferList(members) {
    if (!members.length) {
      el.transferList.innerHTML = '<p class="report-empty">No other members to transfer to.</p>';
      return;
    }
    el.transferList.innerHTML = members
      .map((m) => {
        if (m.username === transferPendingUsername) {
          return `
        <div class="flagged-row">
          <span class="flagged-user">Make ${escapeHtml(m.username)} the owner?</span>
          <span>
            <button class="btn-ghost small-btn" data-transfer-cancel>Cancel</button>
            <button class="btn-ghost small-btn btn-danger" data-transfer-confirm="${escapeHtml(m.username)}">Confirm</button>
          </span>
        </div>`;
        }
        return `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(m.username)}</span>
          <button class="btn-ghost small-btn" data-transfer-start="${escapeHtml(m.username)}">Transfer to this person</button>
        </div>`;
      })
      .join('');

    el.transferList.querySelectorAll('[data-transfer-start]').forEach((btn) =>
      btn.addEventListener('click', () => {
        transferPendingUsername = btn.dataset.transferStart;
        openTransferModal();
      })
    );
    el.transferList.querySelectorAll('[data-transfer-cancel]').forEach((btn) =>
      btn.addEventListener('click', () => {
        transferPendingUsername = null;
        openTransferModal();
      })
    );
    el.transferList.querySelectorAll('[data-transfer-confirm]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        // A native confirm() as the final, third step -- deliberately hard
        // to trigger by accident.
        if (!confirm(`Final check: make ${btn.dataset.transferConfirm} the owner? You'll become a regular member.`)) {
          return;
        }
        try {
          await api(`/outchat/channels/${state.currentChannelId}/transfer`, {
            method: 'POST',
            body: { username: btn.dataset.transferConfirm },
          });
          el.transferModal.classList.add('hidden');
          refreshCurrentChannel();
        } catch (err) {
          alert(err.message);
        }
      })
    );
  }

  // Manage: pending requests + members (approve/reject/kick)
  async function openManageModal() {
    if (!state.currentChannelId) return;
    el.manageModal.classList.remove('hidden');
    try {
      const { members, pending } = await api(`/outchat/channels/${state.currentChannelId}`);

      el.pendingList.innerHTML = pending.length
        ? pending
            .map(
              (p) => `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(p.username)}</span>
          <span>
            <button class="btn-ghost small-btn" data-approve="${escapeHtml(p.username)}">Approve</button>
            <button class="btn-ghost small-btn" data-reject="${escapeHtml(p.username)}">Reject</button>
          </span>
        </div>`
            )
            .join('')
        : '<p class="report-empty">No pending requests.</p>';

      el.memberList.innerHTML = members
        .map((m) => {
          const isSelf = m.username === state.username;
          const actions =
            m.role === 'owner'
              ? '<span class="flagged-reason">owner</span>'
              : isSelf
              ? ''
              : `<button class="btn-ghost small-btn btn-danger" data-kick="${escapeHtml(m.username)}">Kick</button>`;
          return `
        <div class="flagged-row">
          <span class="flagged-user">${escapeHtml(m.username)}</span>
          <span>${actions}</span>
        </div>`;
        })
        .join('');

      el.pendingList.querySelectorAll('[data-approve]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api(`/outchat/channels/${state.currentChannelId}/approve`, {
            method: 'POST',
            body: { username: btn.dataset.approve },
          });
          openManageModal();
          refreshCurrentChannel();
        })
      );
      el.pendingList.querySelectorAll('[data-reject]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          await api(`/outchat/channels/${state.currentChannelId}/reject`, {
            method: 'POST',
            body: { username: btn.dataset.reject },
          });
          openManageModal();
          refreshCurrentChannel();
        })
      );
      el.memberList.querySelectorAll('[data-kick]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          if (!confirm(`Kick ${btn.dataset.kick}?`)) return;
          await api(`/outchat/channels/${state.currentChannelId}/kick`, {
            method: 'POST',
            body: { username: btn.dataset.kick },
          });
          openManageModal();
        })
      );
    } catch (err) {
      el.pendingList.textContent = err.message;
    }
  }

  // ---------- Boot ----------

  const pendingLoginMessage = sessionStorage.getItem('nc_login_message');
  if (pendingLoginMessage) {
    sessionStorage.removeItem('nc_login_message');
    el.loginForm.querySelector('.form-error').textContent = pendingLoginMessage;
  }

  if (state.token && state.username) {
    enterApp();
  }
})();

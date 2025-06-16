// chatroom.js — Final Version for Paritalk

import { getDatabase, ref, onChildAdded, push, set, onDisconnect, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js"; import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js"; import { app } from "./firebase.js";

const db = getDatabase(app); const auth = getAuth(app);

const chatBox = document.getElementById("chatBox"); const msgInput = document.getElementById("msgInput"); const sendBtn = document.getElementById("sendBtn"); const sendFileBtn = document.getElementById("sendFileBtn"); const typingStatus = document.getElementById("typingStatus"); const roomNameEl = document.getElementById("roomName"); const userCountEl = document.getElementById("userCount"); const leaveRoomBtn = document.getElementById("leaveRoomBtn"); const startCallBtn = document.getElementById("startCallBtn");

let currentUser = null; let currentRoom = null; let typingTimeout = null;

function scrollToBottom() { chatBox.scrollTop = chatBox.scrollHeight; }

function showSystemMessage(text) { const el = document.createElement("div"); el.className = "system-msg"; el.textContent = text; chatBox.appendChild(el); scrollToBottom(); }

function showMessage(msg, user, time, type = 'text') { const div = document.createElement("div"); div.className = message ${user === currentUser ? 'user' : 'other'};

if (type === 'file') { const anchor = document.createElement('a'); anchor.href = msg; anchor.target = '_blank'; anchor.className = 'fixed-file'; anchor.innerText = '📎 File attachment'; div.appendChild(anchor); } else { div.textContent = msg; }

const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = ${user} • ${new Date(time).toLocaleTimeString()}; div.appendChild(meta);

chatBox.appendChild(div); scrollToBottom(); }

function sendMessage(msg, type = 'text') { const msgRef = ref(db, rooms/${currentRoom}/messages); push(msgRef, { user: currentUser, msg, time: Date.now(), type }); }

function handleTyping() { const typingRef = ref(db, rooms/${currentRoom}/typing/${currentUser}); set(typingRef, true); clearTimeout(typingTimeout); typingTimeout = setTimeout(() => set(typingRef, false), 2000); }

function setupTypingStatus() { const typingRef = ref(db, rooms/${currentRoom}/typing); onValue(typingRef, snap => { let users = []; snap.forEach(child => { if (child.key !== currentUser && child.val()) users.push(child.key); }); typingStatus.textContent = users.length ? ${users.join(', ')} is typing... : ''; }); }

function setupPresence() { const presenceRef = ref(db, rooms/${currentRoom}/online/${currentUser}); set(presenceRef, true); onDisconnect(presenceRef).remove();

const onlineRef = ref(db, rooms/${currentRoom}/online); onValue(onlineRef, snap => { const count = snap.size; userCountEl.textContent = count; }); }

function handleLogin() { onAuthStateChanged(auth, user => { if (!user) return location.href = "index.html"; currentUser = user.displayName; const params = new URLSearchParams(location.search); const room = params.get("room"); const allowedUsers = ["Yash", "Pari"]; const allowedRooms = ["5201314pari", "238023"];

if (!allowedUsers.includes(currentUser) || !allowedRooms.includes(room)) {
  alert("Access Denied");
  return signOut(auth);
}

currentRoom = room;
roomNameEl.textContent = room;

setupTypingStatus();
setupPresence();
listenToMessages();
showSystemMessage(`${currentUser} joined the chat`);

}); }

function listenToMessages() { const msgRef = ref(db, rooms/${currentRoom}/messages); onChildAdded(msgRef, snap => { const { msg, user, time, type } = snap.val(); showMessage(msg, user, time, type); }); }

msgInput.addEventListener("input", handleTyping);

sendBtn.addEventListener("click", () => { const text = msgInput.value.trim(); if (text) { sendMessage(text); msgInput.value = ""; } });

sendFileBtn.addEventListener("click", async () => { const input = document.createElement("input"); input.type = "file"; input.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; // Upload file to Supabase logic here (mock link below) const url = URL.createObjectURL(file); // TODO: Replace with Supabase link sendMessage(url, 'file'); }; input.click(); });

leaveRoomBtn.addEventListener("click", () => { signOut(auth); });

startCallBtn.addEventListener("click", () => { const domain = "meet.jit.si"; const room = currentRoom; const options = { roomName: room, width: "100%", height: 500, parentNode: document.body, interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [ 'microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat', 'raisehand', 'tileview', 'videobackgroundblur' ], SHOW_JITSI_WATERMARK: false }, configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false } }; const api = new JitsiMeetExternalAPI(domain, options); });

handleLogin();

  

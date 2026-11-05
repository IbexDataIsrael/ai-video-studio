/* Writing memory stays local. The editing assistant maintains its meaning. */
window.WritingVoice = (() => {
 let dialog = null;
 let opener = null;
 let data = null;
 let busy = false;
 let pending = null;
 let undoId = null;

 async function reply(response) {
  const value = await response.json();
  if (!response.ok) throw Error(value.error || 'Writing memory is unavailable.');
  return value;
 }

 function message(value) {
  dialog.querySelector('[data-voice-status]').textContent = value;
 }

 function render() {
  const list = dialog.querySelector('[data-voice-list]');
  list.innerHTML = data.preferences.length ? data.preferences.map(memory => {
   const examples = (memory.examples || []).map(example =>
    '<div class="memory-example">' +
    (example.context ? '<p class="memory-context">' + esc(example.context) + '</p>' : '') +
    (example.before ? '<p><strong>Earlier wording</strong></p><blockquote>' + esc(example.before) + '</blockquote>' : '') +
    (example.after ? '<p><strong>Chosen wording</strong></p><blockquote>' + esc(example.after) + '</blockquote>' : '') +
    '<p><strong>Your feedback</strong></p><blockquote>' + esc(example.feedback) + '</blockquote></div>'
   ).join('');
   return '<li data-memory="' + esc(memory.id) + '"><p class="memory-summary">' + esc(memory.text) + '</p>' +
    '<details><summary>Why this was remembered</summary><p>' + esc(memory.source) + '</p>' + examples + '</details>' +
    '<div class="memory-actions"><button class="text-button" data-correct-memory="' + esc(memory.id) + '">Correct in chat</button>' +
    '<button class="text-button" data-forget-memory="' + esc(memory.id) + '">Forget</button></div></li>';
  }).join('') : '<li class="voice-empty"><h3>It starts with your first script.</h3>' +
   '<p>As you refine scripts in chat, your assistant can remember the choices and feedback that help it write with you.</p></li>';
  dialog.querySelector('[data-undo-voice]').hidden = !undoId;
  dialog.querySelector('[data-retry-voice]').hidden = !pending;
  dialog.querySelectorAll('[data-forget-memory],[data-correct-memory],[data-undo-voice],[data-retry-voice]')
   .forEach(button => { button.disabled = busy || Boolean(pending && !button.hasAttribute('data-retry-voice')); });
 }

 async function load() {
  data = await fetch('/writing-voice', { cache: 'no-store' }).then(reply);
  if (undoId && !data.forgotten_ids.includes(undoId)) undoId = null;
  render();
 }

 async function changeMemory(id, forgotten) {
  if (busy) return;
  pending = pending || { revision: data.revision, request_id: crypto.randomUUID(), memory_id: id, forgotten };
  busy = true;
  render();
  message(forgotten ? 'Forgetting…' : 'Restoring…');
  try {
   data = await fetch('/writing-memory-forget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Studio-Action': 'writing-memory-forget' },
    body: JSON.stringify(pending)
   }).then(reply);
   undoId = forgotten ? id : null;
   pending = null;
   message(forgotten ? 'Forgotten. You can undo this.' : 'Memory restored.');
  } catch (error) {
   message(error.message + ' Retry, or close and reopen to review the latest memory.');
  } finally {
   busy = false;
   render();
   if (dialog.open) dialog.querySelector(undoId ? '[data-undo-voice]' : '[data-done-voice]').focus();
  }
 }

 async function correctInChat(id) {
  const memory = data.preferences.find(item => item.id === id);
  if (!memory) return;
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ 'writing-memory': id, 'memory-revision': data.revision }).toString();
  const text = 'Help me correct this writing memory.\n' + url.href + '\n\n' + memory.text;
  const fallback = dialog.querySelector('[data-memory-copy]');
  fallback.hidden = true;
  try {
   await navigator.clipboard.writeText(text);
   message('Copied. Paste into your editing chat and tell it what to change.');
  } catch {
   fallback.value = text;
   fallback.hidden = false;
   fallback.focus();
   fallback.select();
   message('Copy this message into your editing chat and tell it what to change.');
  }
 }

 function mount() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.className = 'writing-voice-dialog';
  dialog.setAttribute('aria-labelledby', 'writing-voice-title');
  dialog.innerHTML = '<div class="project-start-head"><div><p class="eyebrow">PERSONAL TO YOUR STUDIO</p>' +
   '<h2 id="writing-voice-title" tabindex="-1">Writing memory</h2>' +
   '<p>What your assistant has learned from your scripts and feedback.</p></div>' +
   '<button class="close-button" data-close-voice aria-label="Close writing memory">×</button></div>' +
   '<div class="voice-body"><ul data-voice-list></ul>' +
   '<textarea data-memory-copy readonly hidden aria-label="Message to copy into your editing chat"></textarea></div>' +
   '<div class="project-start-foot"><div class="memory-status"><p data-voice-status role="status" aria-live="polite"></p>' +
   '<button class="text-button" data-undo-voice hidden>Undo</button>' +
   '<button class="text-button" data-retry-voice hidden>Retry</button></div>' +
   '<button class="primary" data-done-voice>Done</button></div>';
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector('[data-close-voice]').onclick = close;
  dialog.querySelector('[data-done-voice]').onclick = close;
  dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });
  dialog.addEventListener('click', event => {
   const forget = event.target.closest('[data-forget-memory]');
   if (forget && !pending) changeMemory(forget.dataset.forgetMemory, true);
   const correct = event.target.closest('[data-correct-memory]');
   if (correct && !busy) correctInChat(correct.dataset.correctMemory);
  });
  dialog.querySelector('[data-undo-voice]').onclick = () => { if (!pending) changeMemory(undoId, false); };
  dialog.querySelector('[data-retry-voice]').onclick = () => {
   if (pending) changeMemory(pending.memory_id, pending.forgotten);
  };
 }

 async function open(button) {
  mount();
  opener = button;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('#writing-voice-title').focus();
  if (busy) return;
  pending = null;
  dialog.querySelector('[data-memory-copy]').hidden = true;
  message('');
  try { await load(); }
  catch (error) { message(error.message); }
 }

 document.addEventListener('click', event => {
  const button = event.target.closest('[data-writing-voice]');
  if (button) { event.preventDefault(); open(button); }
 });
 return { open };
})();

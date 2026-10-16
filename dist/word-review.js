/* Personal marks are shared by lessons and review on this browser/origin. */
(() => {
  'use strict';
  const KEY = 'a2-unfamiliar-words-v1', bindings = [];
  const review = document.getElementById('word-review');
  let catalog = [], lastList = '';
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function error(message) {
    let box = document.getElementById('word-storage-error');
    if (!box) {
      box = element('p', '', 'word-storage-error');
      box.id = 'word-storage-error';
      box.setAttribute('role', 'alert');
      (document.querySelector('main') || document.body).prepend(box);
    }
    box.textContent = message;
    box.hidden = !message;
  }
  function read() {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
        Object.entries(value).some(([id, time]) => !/^CORE\d+$/.test(id) || !Number.isFinite(time))) {
      throw new Error('Invalid word marks');
    }
    return value;
  }
  function load() {
    try { return read(); }
    catch { error('Your word collection could not be read. Check browser storage settings and try again.'); return null; }
  }
  function save(id, marked) {
    try {
      const words = read();
      if (marked) words[id] = Date.now();
      else delete words[id];
      localStorage.setItem(KEY, JSON.stringify(words));
      error('');
      refresh();
      return true;
    } catch {
      error('Your word mark was not saved. Check browser storage space or settings and try again.');
      return false;
    }
  }
  function refresh() {
    const words = load();
    if (!words) return;
    for (const {id, button} of bindings) {
      const marked = Object.hasOwn(words, id);
      button.textContent = marked ? '★ Saved for review · Remove' : '☆ Save for review';
      button.setAttribute('aria-pressed', String(marked));
    }
    for (const link of document.querySelectorAll('[data-word-review-link]')) {
      link.textContent = `My word collection · ${Object.keys(words).length}`;
    }
    if (review) render(words);
  }
  function attachLesson(data, slides, show) {
    for (const [group, words] of [['vocab', data.new_vocabulary], ['review', data.review_vocabulary]]) {
      const cards = slides.filter(slide => slide.dataset.group === group);
      words.forEach((word, index) => {
        const button = element('button', '☆ Save for review', 'word-mark');
        button.type = 'button';
        button.lang = 'en';
        button.dataset.wordId = word.id;
        button.onclick = () => {
          const current = load();
          if (current) save(word.id, !Object.hasOwn(current, word.id));
        };
        cards[index].querySelector('.task-content').prepend(button);
        bindings.push({id: word.id, button});
      });
    }
    function openWord() {
      const index = data.new_vocabulary.findIndex(word => `#word-${word.id}` === location.hash);
      if (index >= 0) show(slides.findIndex(slide => slide.dataset.group === 'vocab') + index);
    }
    window.addEventListener('hashchange', openWord);
    openWord();
    refresh();
  }
  function render(words) {
    const search = document.getElementById('word-search').value.trim().toLocaleLowerCase();
    const day = document.getElementById('word-day').value;
    const signature = JSON.stringify([words, search, day]);
    if (signature === lastList) return;
    lastList = signature;
    const marked = catalog.filter(word => Object.hasOwn(words, word.id));
    const available=marked.filter(word => typeof CourseAccess==='undefined'||CourseAccess.canAccess(word.day));
    const visible = available.filter(word => (!day || word.day === Number(day)) &&
      [word.word_or_phrase, word.simple_english_meaning, word.chinese_meaning].some(text => text.toLocaleLowerCase().includes(search)))
      .sort((a, b) => words[b.id] - words[a.id] || a.word_or_phrase.localeCompare(b.word_or_phrase));
    document.getElementById('word-count').textContent = String(marked.length);
    document.getElementById('word-results').textContent = `${marked.length} words to revisit · Showing ${visible.length}`;
    const list = document.getElementById('word-list');
    list.replaceChildren();
    document.getElementById('word-empty').hidden = visible.length > 0;
    document.getElementById('word-empty-title').textContent = marked.length ? 'No matching words' : 'Your collection is empty';
    document.getElementById('word-empty-hint').textContent = marked.length ? 'Try another search, or choose “All lessons”.' : 'Select “Save for review” in a lesson to collect a word here. You can remove it whenever you are ready.';
    if(marked.length&&!available.length){
      document.getElementById('word-empty-title').textContent='These words are in locked lessons';
      document.getElementById('word-empty-hint').textContent='Complete the preceding lessons to practise these words. Your saved marks are kept.';
    }
    for (const word of visible) {
      const card = element('article', undefined, 'review-word');
      card.append(element('p', `DAY ${String(word.day).padStart(2, '0')} · ${word.part_of_speech}`, 'word-meta'),
        element('h2', word.word_or_phrase), element('p', word.simple_english_meaning, 'word-meaning'));
      const details = element('details', undefined, 'word-translation');
      details.append(element('summary', 'Reveal Chinese'), element('p', word.chinese_meaning));
      card.append(details);
      if (word.example_sentence) {
        const example = element('div', undefined, 'word-example');
        example.append(element('span', 'EXAMPLE'), element('p', word.example_sentence));
        card.append(example);
      }
      if (word.speaking_question) card.append(element('p', word.speaking_question, 'word-prompt'));
      const actions = element('div', undefined, 'word-actions');
      const source = element('a', 'Back to lesson ↗');
      source.href = `html/${word.day === 1 ? 'index' : 'day' + String(word.day).padStart(2, '0')}.html#word-${word.id}`;
      const learned = element('button', '✓ Learned · Remove', 'word-learned');
      learned.type = 'button';
      learned.setAttribute('aria-label', `${word.word_or_phrase}: learned, remove`);
      learned.onclick = () => {
        const index = [...list.children].indexOf(card);
        if (save(word.id, false)) {
          document.getElementById('word-notice').textContent = `${word.word_or_phrase} was removed from your collection.`;
          const next = list.children[Math.min(index, list.children.length - 1)];
          (next?.querySelector('.word-learned') || document.getElementById('word-search')).focus({preventScroll: true});
        }
      };
      actions.append(source, learned);
      card.append(actions);
      list.append(card);
    }
  }
  if (review) {
    catalog = globalThis.A2WordCatalog || [];
    const days = document.getElementById('word-day');
    for (let day = 1; day <= 30; day++) {
      const option = element('option', `Day ${String(day).padStart(2, '0')}`);
      option.value = String(day);
      days.append(option);
    }
    for (const [id, event] of [['word-search', 'input'], ['word-day', 'change']]) {
      document.getElementById(id).addEventListener(event, refresh);
    }
  }
  window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) refresh(); });
  window.addEventListener('course-access-change',()=>{lastList='';refresh();});
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  globalThis.WordReview = {attachLesson};
  refresh();
})();

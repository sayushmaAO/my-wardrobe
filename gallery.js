(() => {
  const archive = `IMG_0050.JPEG IMG_0546.JPG IMG_0559.JPG IMG_0921.JPEG IMG_1479.JPEG IMG_1556.JPEG IMG_1934.JPEG IMG_2805.JPEG IMG_2836.PNG IMG_2887.JPEG IMG_3074.JPEG IMG_3161.JPEG IMG_3193.JPEG IMG_3239.JPEG IMG_3243.JPEG IMG_3253.JPEG IMG_3254.JPEG IMG_3255.JPEG IMG_3256.JPEG IMG_3257.JPEG IMG_3258.JPEG IMG_3259.JPEG IMG_3260.JPEG IMG_3261.JPEG IMG_3262.JPEG IMG_3263.JPEG IMG_3264.JPEG IMG_3265.JPEG IMG_3266.JPEG IMG_3267.JPEG IMG_3269.JPEG IMG_3270.JPEG IMG_3271.JPEG IMG_3272.JPEG IMG_3274.JPEG IMG_3581.JPEG IMG_3770.JPG IMG_3948.JPEG IMG_4033.JPEG IMG_4071.JPEG IMG_4100.JPG IMG_4661.JPEG IMG_4662.JPEG IMG_4663.JPEG IMG_4664.JPEG IMG_4665.JPEG IMG_4666.JPEG IMG_4670.JPEG IMG_4671.JPEG IMG_4673.JPEG IMG_4674.JPEG IMG_4675.JPEG IMG_4702.JPEG IMG_4730.JPEG IMG_4731.JPEG IMG_4733.JPEG IMG_4734.JPEG IMG_4735.JPEG IMG_4736.JPEG IMG_4737.JPEG IMG_4738.JPEG IMG_4739.JPEG IMG_4740.JPEG IMG_4741.JPEG IMG_4742.JPEG IMG_4743.JPEG IMG_4744.JPEG IMG_4745.JPEG IMG_4748.JPEG IMG_5535.JPEG IMG_5537.JPEG IMG_5540.JPEG IMG_6072.JPEG IMG_6345.JPEG IMG_6360.JPEG IMG_8333.JPEG IMG_8508.JPEG IMG_9431.JPEG`.split(' ');
  const tags = ['work', 'office', 'meeting', 'weekend', 'evening'];
  const itemCategories = [
    { value: 'outerwear', label: 'Верхняя одежда' },
    { value: 'bottom', label: 'Низ' },
    { value: 'tailoring', label: 'Жакет' },
    { value: 'dress', label: 'Платье или юбка' },
    { value: 'top', label: 'Верх' },
    { value: 'shoes', label: 'Обувь' },
    { value: 'accessories', label: 'Аксессуар' },
    { value: 'other', label: 'Другое' }
  ];
  const MAX_IMAGE_SIZE = 1200;
  const JPEG_QUALITY = 0.8;

  const toast = document.createElement('div');
  toast.className = 'upload-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer;
  function message(text, type = '') {
    toast.textContent = text;
    toast.className = `upload-toast is-visible ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4500);
  }

  function readStored(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { message('Не удалось прочитать сохранённые фото. Попробуй перезагрузить страницу.', 'error'); return fallback; }
  }
  function saveStored(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) {
      const full = error?.name === 'QuotaExceededError' || error?.code === 22;
      message(full ? 'Память для фото заполнена. Удали несколько старых загруженных фото и попробуй снова.' : 'Фото не удалось сохранить. Попробуй выбрать его ещё раз.', 'error');
      return false;
    }
  }
  const get = key => readStored(key, []);
  const getObject = key => readStored(key, {});
  const set = saveStored;
  const imageCache = new Map();
  const imageDb = new Promise((resolve, reject) => {
    const request = indexedDB.open('alina-wardrobe-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const isStoredImage = value => typeof value === 'string' && value.startsWith('idb:');
  async function storeImage(dataUrl) {
    const key = `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    imageCache.set(key, dataUrl);
    const db = await imageDb;
    await new Promise((resolve, reject) => { const tx = db.transaction('images', 'readwrite'); tx.objectStore('images').put(dataUrl, key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    return `idb:${key}`;
  }
  async function loadImage(ref) {
    if (!isStoredImage(ref)) return ref;
    const key = ref.slice(4);
    if (imageCache.has(key)) return imageCache.get(key);
    const db = await imageDb;
    const value = await new Promise((resolve, reject) => { const request = db.transaction('images').objectStore('images').get(key); request.onsuccess = () => resolve(request.result || ''); request.onerror = () => reject(request.error); });
    imageCache.set(key, value); return value;
  }
  function imageTag(ref, alt, className = '') { return `<img ${isStoredImage(ref) ? `data-image-ref="${ref}"` : `src="${ref}"`} class="${className}" alt="${alt}" loading="lazy">`; }
  function hydrateImages(root = document) { root.querySelectorAll('img[data-image-ref]').forEach(async image => { try { image.src = await loadImage(image.dataset.imageRef); } catch { message('Не удалось открыть одно из сохранённых фото.', 'error'); } }); }

  async function compressImage(file) {
    if (!file?.type?.startsWith('image/')) throw new Error('not-image');
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('decode'));
        img.src = objectUrl;
      });
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
      if (!blob) throw new Error('compress');
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(blob);
      });
    } finally { URL.revokeObjectURL(objectUrl); }
  }

  const imageCard = (look, i) => `<article class="look-card personal-look" data-personal="${i}">${imageTag(look.src, look.name)}<button class="remove-card" data-remove="${i}" aria-label="Удалить образ">×</button><span class="card-status">${look.custom ? 'новый' : 'личный архив'}</span><div class="look-card-body"><h3>${look.name}</h3><p>${look.note || 'Добавь повод и вещи'}</p></div></article>`;
  const allLooks = () => {
    const meta = getObject('wardrobe:look-meta');
    const saved = get('wardrobe:looks');
    return [...archive.map((name, i) => ({ id: `archive:${name}`, name: `Образ ${String(i + 1).padStart(2, '0')}`, src: `assets/web-looks/${name}`, note: 'Личный архив', tag: meta[`archive:${name}`]?.tag || tags[i % tags.length] })), ...saved.map((look, i) => ({ ...look, id: look.id || `user:${i}`, tag: meta[look.id || `user:${i}`]?.tag || look.tag || 'work' }))].filter(look => !meta[look.id]?.deleted);
  };
  let visibleLooks = [], activeFilter = 'all', itemToReplace = null, staticItemToReplace = null;
  function renderPersonal(filter = 'all') { activeFilter = filter; visibleLooks = allLooks().filter(x => filter === 'all' || x.tag === filter || filter === 'favorite' && x.favorite); const grid = document.querySelector('#lookGrid'); grid.innerHTML = visibleLooks.map(imageCard).join(''); hydrateImages(grid); }
  function note(text) { const area = document.querySelector('#today .today-intro'); let card = document.querySelector('.suggestion'); if (!card) { card = document.createElement('button'); card.className = 'suggestion'; card.type = 'button'; area.after(card); } card.innerHTML = `<span>✦ Подсказка</span><b>${text}</b><small>Собрать комплект →</small>`; card.onclick = () => document.querySelector('[data-view="closet"]').click(); }

  function addPhotoButtons() {
    const replacements = getObject('wardrobe:item-photo-overrides');
    document.querySelectorAll('#closetGrid .item-card:not(.user-item)').forEach((card, index) => {
      const media = card.querySelector('.item-image'); if (!media) return;
      const name = card.querySelector('h3')?.textContent || 'Вещь'; media.classList.add('photo-item');
      if (replacements[index]) { media.innerHTML = `${imageTag(replacements[index], name)}<button class="change-item change-static" data-change-static="${index}" aria-label="Изменить фото">↻</button>`; hydrateImages(media); }
      else if (!media.querySelector('[data-change-static]')) media.insertAdjacentHTML('beforeend', `<button class="change-item change-static" data-change-static="${index}" aria-label="Изменить фото">↻</button>`);
    });
  }
  function renderItems() {
    const added = get('wardrobe:items'), grid = document.querySelector('#closetGrid');
    grid.querySelectorAll('.user-item').forEach(card => card.remove());
    const filter = document.querySelector('#closetFilters .chip.active')?.dataset.filter || 'all';
    const filtered = added.map((item, i) => ({ item, i })).filter(({ item }) => filter === 'all' || item.category === filter);
    if (filtered.length) grid.insertAdjacentHTML('afterbegin', filtered.map(({ item, i }) => `<article class="item-card user-item" data-kit="${i}"><div class="item-image photo-item">${imageTag(item.src, item.name)}<button class="change-item" data-change-item="${i}" aria-label="Изменить фото">↻</button></div><h3>${item.name}</h3><p><button class="item-tag" data-edit-category="${i}">${item.categoryLabel || 'Другое'}</button> · моя вещь</p></article>`).join(''));
    addPhotoButtons();
    hydrateImages(grid);
  }
  function renderInspiration() { const data = get('wardrobe:inspiration'), grid = document.querySelector('#inspirationGrid'); grid.innerHTML = data.map((x, i) => `<article class="inspo-card">${imageTag(x.src, 'Вдохновение')}<button data-remove-inspo="${i}" aria-label="Удалить">×</button><p>${x.name}</p></article>`).join('') || '<p class="empty-state">Здесь будут твои референсы: фото образов, деталей и сочетаний.</p>'; hydrateImages(grid); }

  async function addFiles(files, target, kind) {
    const selected = [...files]; if (!selected.length) return;
    message(selected.length > 1 ? `Подготавливаю ${selected.length} фото…` : 'Подготавливаю фото…');
    let saved = 0;
    for (const file of selected) {
      try {
        const compressed = await compressImage(file);
        const src = await storeImage(compressed);
        if (kind === 'static-item') {
          const replacements = getObject('wardrobe:item-photo-overrides'); replacements[staticItemToReplace] = src;
          if (set('wardrobe:item-photo-overrides', replacements)) { saved++; staticItemToReplace = null; addPhotoButtons(); }
          continue;
        }
        const list = get(target);
        if (kind === 'item' && itemToReplace !== null) { list[itemToReplace].src = src; if (set(target, list)) { saved++; itemToReplace = null; renderItems(); } continue; }
        const name = kind === 'item' ? (window.prompt('Название вещи', file.name.replace(/\.[^.]+$/, '')) || 'Новая вещь') : kind === 'inspiration' ? file.name.replace(/\.[^.]+$/, '') : `Новый образ ${list.length + 1}`;
        const categoryInput = kind === 'item' ? window.prompt(`Метка вещи:\n${itemCategories.map(category => `${category.value} — ${category.label}`).join('\n')}`, 'other') : '';
        const category = itemCategories.find(entry => entry.value === String(categoryInput).trim().toLowerCase()) || itemCategories[itemCategories.length - 1];
        const entry = kind === 'item' ? { id: `user:${Date.now()}-${Math.random().toString(16).slice(2)}`, name, src, note: 'Новая вещь', category: category.value, categoryLabel: category.label, tag: 'work', custom: true } : kind === 'inspiration' ? { name, src } : { id: `user:${Date.now()}-${Math.random().toString(16).slice(2)}`, name, src, note: 'Добавь повод и детали', tag: 'work', custom: true };
        list.unshift(entry);
        if (set(target, list)) { saved++; if (kind === 'item') renderItems(); else if (kind === 'inspiration') renderInspiration(); else renderPersonal(); }
      } catch (error) { message('Не удалось обработать это фото. Выбери JPEG, PNG или другое изображение из «Фото».', 'error'); }
    }
    if (saved) { if (kind === 'item' || kind === 'static-item') note('Фото вещи сохранено в гардеробе.'); if (kind === 'inspiration') renderInspiration(); if (kind === 'look') renderPersonal(activeFilter); message(saved === 1 ? 'Фото добавлено и сохранено.' : `Добавлено и сохранено: ${saved} фото.`); }
  }

  function buildPanel() { const closet = document.querySelector('#closet'); if (document.querySelector('.builder')) return; const panel = document.createElement('section'); panel.className = 'builder'; panel.innerHTML = '<div><p class="eyebrow">КОНСТРУКТОР</p><h2>Собрать комплект</h2><p>Добавь фото вещей в гардероб, выбери 2–4 карточки и сохрани идею образа.</p></div><button class="primary" id="saveKit">Сохранить идею <b>↗</b></button>'; closet.append(panel); panel.querySelector('#saveKit').onclick = async () => { const chosen = [...document.querySelectorAll('.item-card.selected-kit')]; if (!chosen.length) { note('Сначала выбери вещи в гардеробе — так я смогу подсказать сочетание.'); return; } const first = chosen[0].querySelector('img')?.src, list = get('wardrobe:looks'); const src = first?.startsWith('data:') ? await storeImage(first) : first || 'assets/real-look-4.jpg'; list.unshift({ name: 'Новый комплект', src, note: `Собрано из ${chosen.length} вещей`, tag: 'work', custom: true }); if (set('wardrobe:looks', list)) { note(`Идея сохранена: ${chosen.length} вещи.`); document.querySelector('[data-view="looks"]').click(); renderPersonal(); } }; }

  const lookInput = document.querySelector('#lookUpload'), itemInput = document.querySelector('#itemUpload'), inspirationInput = document.querySelector('#inspirationUpload');
  document.querySelector('#uploadLookBtn').onclick = () => lookInput.click();
  document.querySelector('#uploadItemBtn').onclick = () => { itemToReplace = null; staticItemToReplace = null; itemInput.click(); };
  document.querySelector('#uploadInspirationBtn').onclick = () => inspirationInput.click();
  lookInput.onchange = async e => { await addFiles(e.target.files, 'wardrobe:looks', 'look'); e.target.value = ''; };
  itemInput.onchange = async e => { await addFiles(e.target.files, 'wardrobe:items', staticItemToReplace !== null ? 'static-item' : 'item'); e.target.value = ''; };
  inspirationInput.onchange = async e => { await addFiles(e.target.files, 'wardrobe:inspiration', 'inspiration'); e.target.value = ''; };
  document.querySelector('#lookFilters').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setTimeout(() => renderPersonal(b.dataset.filter), 0); });
  document.querySelector('#closetFilters').addEventListener('click', e => { if (e.target.closest('.chip')) setTimeout(renderItems, 0); });
  document.querySelector('#closetGrid').addEventListener('click', e => { const categoryButton = e.target.closest('[data-edit-category]'); if (categoryButton) { e.preventDefault(); e.stopPropagation(); const index = Number(categoryButton.dataset.editCategory), list = get('wardrobe:items'), current = list[index]; const choice = window.prompt(`Метка вещи:\n${itemCategories.map(category => `${category.value} — ${category.label}`).join('\n')}`, current.category || 'other'); const category = itemCategories.find(entry => entry.value === String(choice).trim().toLowerCase()); if (category) { list[index] = { ...current, category: category.value, categoryLabel: category.label }; if (set('wardrobe:items', list)) renderItems(); } return; } const staticButton = e.target.closest('[data-change-static]'); if (staticButton) { e.preventDefault(); e.stopPropagation(); staticItemToReplace = Number(staticButton.dataset.changeStatic); itemToReplace = null; itemInput.click(); return; } const change = e.target.closest('[data-change-item]'); if (change) { e.stopPropagation(); itemToReplace = Number(change.dataset.changeItem); staticItemToReplace = null; itemInput.click(); return; } const card = e.target.closest('.user-item'); if (card) card.classList.toggle('selected-kit'); }, true);
  document.querySelector('#lookGrid').addEventListener('click', e => { const remove = e.target.closest('[data-remove]'); if (remove) { e.stopPropagation(); const look = visibleLooks[remove.dataset.remove]; if (window.confirm(`Удалить «${look.name}» из галереи?`)) { const meta = getObject('wardrobe:look-meta'); meta[look.id] = { ...(meta[look.id] || {}), deleted: true }; if (set('wardrobe:look-meta', meta)) renderPersonal(activeFilter); } return; } const card = e.target.closest('[data-personal]'); if (!card) return; const look = visibleLooks[card.dataset.personal], content = document.querySelector('#dialogContent'); content.innerHTML = `<div class="dialog-wrap">${imageTag(look.src, look.name, 'dialog-photo')}<div class="dialog-copy"><p class="eyebrow">ЛИЧНЫЙ АРХИВ</p><h2>${look.name}</h2><p>${look.note}</p><label class="look-field">Повод<select id="lookOccasion"><option value="work">Работа</option><option value="office">Офис</option><option value="meeting">Встреча</option><option value="weekend">Выходной</option><option value="evening">Вечер</option></select></label><button class="delete-look" id="deleteLook">Удалить из галереи</button></div></div>`; hydrateImages(content); const dialog = document.querySelector('#detailDialog'), select = document.querySelector('#lookOccasion'); select.value = look.tag; select.onchange = () => { const meta = getObject('wardrobe:look-meta'); meta[look.id] = { ...(meta[look.id] || {}), tag: select.value }; if (set('wardrobe:look-meta', meta)) renderPersonal(activeFilter); }; document.querySelector('#deleteLook').onclick = () => { const meta = getObject('wardrobe:look-meta'); meta[look.id] = { ...(meta[look.id] || {}), deleted: true }; if (set('wardrobe:look-meta', meta)) { dialog.close(); renderPersonal(activeFilter); } }; dialog.showModal(); });
  document.querySelector('#inspirationGrid').addEventListener('click', e => { const button = e.target.closest('[data-remove-inspo]'); if (!button) return; const list = get('wardrobe:inspiration'); list.splice(Number(button.dataset.removeInspo), 1); if (set('wardrobe:inspiration', list)) renderInspiration(); });

  async function migrateLegacyPhotos() {
    for (const key of ['wardrobe:looks', 'wardrobe:items', 'wardrobe:inspiration']) {
      const list = get(key); let changed = false;
      for (const entry of list) if (typeof entry.src === 'string' && entry.src.startsWith('data:image/')) { entry.src = await storeImage(entry.src); changed = true; }
      if (changed) set(key, list);
    }
    const replacements = getObject('wardrobe:item-photo-overrides'); let changed = false;
    for (const key of Object.keys(replacements)) if (typeof replacements[key] === 'string' && replacements[key].startsWith('data:image/')) { replacements[key] = await storeImage(replacements[key]); changed = true; }
    if (changed) set('wardrobe:item-photo-overrides', replacements);
    renderPersonal(activeFilter); renderItems(); renderInspiration();
  }

  renderPersonal(); renderItems(); renderInspiration(); buildPanel(); note('Добавь фото отдельных вещей — и я предложу сочетания из твоей палитры: wine, шоколад, глубокий зелёный и молочный.');
  migrateLegacyPhotos().catch(() => message('Не удалось перенести старые фото в новое хранилище. Новые фото всё равно будут сохраняться.', 'error'));
})();


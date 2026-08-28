(() => {
  const archive = `IMG_0050.JPEG IMG_0546.JPG IMG_0559.JPG IMG_0921.JPEG IMG_1479.JPEG IMG_1556.JPEG IMG_1934.JPEG IMG_2805.JPEG IMG_2836.PNG IMG_2887.JPEG IMG_3074.JPEG IMG_3161.JPEG IMG_3193.JPEG IMG_3239.JPEG IMG_3243.JPEG IMG_3253.JPEG IMG_3254.JPEG IMG_3255.JPEG IMG_3256.JPEG IMG_3257.JPEG IMG_3258.JPEG IMG_3259.JPEG IMG_3260.JPEG IMG_3261.JPEG IMG_3262.JPEG IMG_3263.JPEG IMG_3264.JPEG IMG_3265.JPEG IMG_3266.JPEG IMG_3267.JPEG IMG_3269.JPEG IMG_3270.JPEG IMG_3271.JPEG IMG_3272.JPEG IMG_3274.JPEG IMG_3581.JPEG IMG_3770.JPG IMG_3948.JPEG IMG_4033.JPEG IMG_4071.JPEG IMG_4100.JPG IMG_4661.JPEG IMG_4662.JPEG IMG_4663.JPEG IMG_4664.JPEG IMG_4665.JPEG IMG_4666.JPEG IMG_4670.JPEG IMG_4671.JPEG IMG_4673.JPEG IMG_4674.JPEG IMG_4675.JPEG IMG_4702.JPEG IMG_4730.JPEG IMG_4731.JPEG IMG_4733.JPEG IMG_4734.JPEG IMG_4735.JPEG IMG_4736.JPEG IMG_4737.JPEG IMG_4738.JPEG IMG_4739.JPEG IMG_4740.JPEG IMG_4741.JPEG IMG_4742.JPEG IMG_4743.JPEG IMG_4744.JPEG IMG_4745.JPEG IMG_4748.JPEG IMG_5535.JPEG IMG_5537.JPEG IMG_5540.JPEG IMG_6072.JPEG IMG_6345.JPEG IMG_6360.JPEG IMG_8333.JPEG IMG_8508.JPEG IMG_9431.JPEG`.split(' ');
  const tags = ['work','office','meeting','weekend','evening'];
  const get = key => JSON.parse(localStorage.getItem(key) || '[]');
  const getObject = key => JSON.parse(localStorage.getItem(key) || '{}');
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const imageCard = (look, i) => `<article class="look-card personal-look" data-personal="${i}"><img src="${look.src}" alt="${look.name}" loading="lazy"><button class="remove-card" data-remove="${i}" aria-label="Удалить образ">×</button><span class="card-status">${look.custom ? 'новый' : 'личный архив'}</span><div class="look-card-body"><h3>${look.name}</h3><p>${look.note || 'Добавь повод и вещи'}</p></div></article>`;
  const allLooks = () => { const meta=getObject('wardrobe:look-meta'); return [...archive.map((name, i) => ({id:`archive:${name}`,name:`Образ ${String(i+1).padStart(2,'0')}`, src:`assets/web-looks/${name}`, note:'Личный архив', tag:meta[`archive:${name}`]?.tag || tags[i%tags.length]})), ...get('wardrobe:looks').map((look,i)=>({...look,id:look.id || `user:${i}`,tag:meta[look.id || `user:${i}`]?.tag || look.tag || 'work'}))].filter(look=>!meta[look.id]?.deleted) };
  let visibleLooks=[], activeFilter='all';
  function renderPersonal(filter='all') { activeFilter=filter; const data=allLooks().filter(x=>filter==='all'||x.tag===filter||filter==='favorite'&&x.favorite); visibleLooks=data; document.querySelector('#lookGrid').innerHTML=data.map(imageCard).join(''); }
  function note(text) { const area=document.querySelector('#today .today-intro'); let card=document.querySelector('.suggestion'); if(!card){card=document.createElement('button');card.className='suggestion';card.type='button';area.after(card)} card.innerHTML=`<span>✦ Подсказка</span><b>${text}</b><small>Собрать комплект →</small>`; card.onclick=()=>document.querySelector('[data-view="closet"]').click(); }
  let itemToReplace=null;
  function readFiles(files, target, isItem=false) { [...files].forEach(file => { const reader=new FileReader(); reader.onload=()=>{ const list=get(target); if(isItem&&itemToReplace!==null){list[itemToReplace].src=reader.result;set(target,list);itemToReplace=null;renderItems();note('Фото вещи обновлено.');return} const name=isItem ? (window.prompt('Название вещи', file.name.replace(/\.[^.]+$/,'')) || 'Новая вещь') : `Новый образ ${list.length+1}`; list.unshift({id:`user:${Date.now()}-${Math.random().toString(16).slice(2)}`,name,src:reader.result,note:isItem?'Новая вещь':'Добавь повод и детали',tag:'work',custom:true}); set(target,list); if(isItem) renderItems(); else renderPersonal(); note(isItem?`«${name}» уже в гардеробе. Попробуй сочетать её с сатиновой миди.`:'Новый образ добавлен в личную галерею.'); }; reader.readAsDataURL(file); }); }
  function renderItems(){ const added=get('wardrobe:items'); if(!added.length)return; const grid=document.querySelector('#closetGrid'); grid.querySelectorAll('.user-item').forEach(card=>card.remove()); const cards=added.map((item,i)=>`<article class="item-card user-item" data-kit="${i}"><div class="item-image photo-item"><img src="${item.src}" alt="${item.name}"><button class="change-item" data-change-item="${i}" aria-label="Изменить фото">↻</button></div><h3>${item.name}</h3><p>моя вещь · нажми для комплекта</p></article>`).join(''); grid.insertAdjacentHTML('afterbegin',cards); }
  function buildPanel(){ const closet=document.querySelector('#closet'); if(document.querySelector('.builder'))return; const panel=document.createElement('section');panel.className='builder';panel.innerHTML='<div><p class="eyebrow">КОНСТРУКТОР</p><h2>Собрать комплект</h2><p>Добавь фото вещей в гардероб, выбери 2–4 карточки и сохрани идею образа.</p></div><button class="primary" id="saveKit">Сохранить идею <b>↗</b></button>';closet.append(panel); panel.querySelector('#saveKit').onclick=()=>{const chosen=[...document.querySelectorAll('.item-card.selected-kit')]; if(!chosen.length){note('Сначала выбери вещи в гардеробе — так я смогу подсказать сочетание.');return} const first=chosen[0].querySelector('img')?.src; const list=get('wardrobe:looks'); list.unshift({name:'Новый комплект',src:first || 'assets/real-look-4.jpg',note:`Собрано из ${chosen.length} вещей`,tag:'work',custom:true});set('wardrobe:looks',list);note(`Идея сохранена: ${chosen.length} вещи. Для следующего шага добавь повод — я предложу обувь и верхний слой.`);document.querySelector('[data-view="looks"]').click();renderPersonal()}; }
  document.querySelector('#uploadLookBtn').onclick=()=>document.querySelector('#lookUpload').click(); document.querySelector('#uploadItemBtn').onclick=()=>document.querySelector('#itemUpload').click(); document.querySelector('#lookUpload').onchange=e=>readFiles(e.target.files,'wardrobe:looks'); document.querySelector('#itemUpload').onchange=e=>readFiles(e.target.files,'wardrobe:items',true);
  document.querySelector('#lookFilters').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return; setTimeout(()=>renderPersonal(b.dataset.filter),0)});
  document.querySelector('#closetFilters').addEventListener('click',e=>{if(e.target.closest('.chip'))setTimeout(renderItems,0)});
  document.querySelector('#closetGrid').addEventListener('click',e=>{const change=e.target.closest('[data-change-item]');if(change){e.stopPropagation();itemToReplace=Number(change.dataset.changeItem);document.querySelector('#itemUpload').click();return}const card=e.target.closest('.user-item');if(card)card.classList.toggle('selected-kit')});
  document.querySelector('#lookGrid').addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove){e.stopPropagation();const l=visibleLooks[remove.dataset.remove];if(window.confirm(`Удалить «${l.name}» из галереи?`)){const meta=getObject('wardrobe:look-meta');meta[l.id]={...(meta[l.id]||{}),deleted:true};set('wardrobe:look-meta',meta);renderPersonal(activeFilter);note('Образ удалён из галереи. Исходное фото осталось в папке.')}return}const card=e.target.closest('[data-personal]');if(!card)return;const l=visibleLooks[card.dataset.personal];document.querySelector('#dialogContent').innerHTML=`<div class="dialog-wrap"><img class="dialog-photo" src="${l.src}" alt="${l.name}"><div class="dialog-copy"><p class="eyebrow">ЛИЧНЫЙ АРХИВ</p><h2>${l.name}</h2><p>${l.note}</p><label class="look-field">Повод<select id="lookOccasion"><option value="work">Работа</option><option value="office">Офис</option><option value="meeting">Встреча</option><option value="weekend">Выходной</option><option value="evening">Вечер</option></select></label><button class="delete-look" id="deleteLook">Удалить из галереи</button><div class="ratings"><div class="rating"><span>Идёт мне</span><b>●●●●●</b></div><div class="rating"><span>Это моё</span><b>●●●●●</b></div></div></div></div>`;const dialog=document.querySelector('#detailDialog');const select=document.querySelector('#lookOccasion');select.value=l.tag;select.onchange=()=>{const meta=getObject('wardrobe:look-meta');meta[l.id]={...(meta[l.id]||{}),tag:select.value};set('wardrobe:look-meta',meta);renderPersonal(activeFilter);note(`Повод для «${l.name}» обновлён.`)};document.querySelector('#deleteLook').onclick=()=>{if(!window.confirm(`Удалить «${l.name}» из галереи?`))return;const meta=getObject('wardrobe:look-meta');meta[l.id]={...(meta[l.id]||{}),deleted:true};set('wardrobe:look-meta',meta);dialog.close();renderPersonal(activeFilter);note('Образ удалён из галереи. Исходное фото осталось в папке.');};dialog.showModal()});
  const renderInspiration=()=>{const data=get('wardrobe:inspiration');document.querySelector('#inspirationGrid').innerHTML=data.map((x,i)=>`<article class="inspo-card"><img src="${x.src}" alt="Вдохновение"><button data-remove-inspo="${i}" aria-label="Удалить">×</button><p>${x.name}</p></article>`).join('')||'<p class="empty-state">Здесь будут твои референсы: фото образов, деталей и сочетаний.</p>'};
  document.querySelector('#uploadInspirationBtn').onclick=()=>document.querySelector('#inspirationUpload').click();document.querySelector('#inspirationUpload').onchange=e=>{[...e.target.files].forEach(file=>{const reader=new FileReader();reader.onload=()=>{const list=get('wardrobe:inspiration');list.unshift({name:file.name.replace(/\.[^.]+$/,''),src:reader.result});set('wardrobe:inspiration',list);renderInspiration()};reader.readAsDataURL(file)})};document.querySelector('#inspirationGrid').addEventListener('click',e=>{const button=e.target.closest('[data-remove-inspo]');if(!button)return;const list=get('wardrobe:inspiration');list.splice(Number(button.dataset.removeInspo),1);set('wardrobe:inspiration',list);renderInspiration()});
  renderPersonal(); renderItems(); renderInspiration(); buildPanel(); note('Добавь фото отдельных вещей — и я предложу сочетания из твоей палитры: wine, шоколад, глубокий зелёный и молочный.');
})();

// Make every existing wardrobe card editable too, not only newly uploaded items.
(() => {
  let staticItemToReplace = null;
  const getObject = key => JSON.parse(localStorage.getItem(key) || '{}');
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const grid = document.querySelector('#closetGrid');
  const input = document.querySelector('#itemUpload');
  const uploadButton = document.querySelector('#uploadItemBtn');

  function addPhotoButtons() {
    const replacements = getObject('wardrobe:item-photo-overrides');
    grid.querySelectorAll('.item-card:not(.user-item)').forEach((card, index) => {
      const media = card.querySelector('.item-image');
      if (!media) return;
      const name = card.querySelector('h3')?.textContent || 'Вещь';
      media.classList.add('photo-item');
      if (replacements[index]) {
        media.innerHTML = `<img src="${replacements[index]}" alt="${name}"><button class="change-item change-static" data-change-static="${index}" aria-label="Изменить фото">↻</button>`;
      } else if (!media.querySelector('[data-change-static]')) {
        media.insertAdjacentHTML('beforeend', `<button class="change-item change-static" data-change-static="${index}" aria-label="Изменить фото">↻</button>`);
      }
    });
  }

  const originalChange = input.onchange;
  input.onchange = event => {
    if (staticItemToReplace === null) return originalChange(event);
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const replacements = getObject('wardrobe:item-photo-overrides');
      replacements[staticItemToReplace] = reader.result;
      set('wardrobe:item-photo-overrides', replacements);
      staticItemToReplace = null;
      addPhotoButtons();
    };
    reader.readAsDataURL(file);
  };

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-change-static]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    staticItemToReplace = Number(button.dataset.changeStatic);
    input.click();
  }, true);
  uploadButton.addEventListener('click', () => { staticItemToReplace = null; });
  document.querySelector('#closetFilters').addEventListener('click', () => setTimeout(addPhotoButtons, 20));
  addPhotoButtons();
})();


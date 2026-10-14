// Simple single-file app implementing inventory swipe and recipe swipe.
(function(){
  // Utilities
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Sample stock
  const SAMPLE = [
    {id:1,name:'Tomaten',qty:4,expires: daysFromNow(4)},
    {id:2,name:'Mozzarella',qty:1,expires: daysFromNow(2)},
    {id:3,name:'Pasta',qty:2,expires: daysFromNow(60)},
    {id:4,name:'Spinazie (zak)',qty:1,expires: daysFromNow(1)},
    {id:5,name:'Ei',qty:6,expires: daysFromNow(9)}
  ];

  // Known popular recipes (short dataset used to prefer internet-like recipes)
  const KNOWN_RECIPES = [
    {
      id: 'bolognese',
      title: 'Spaghetti Bolognese',
      ingredients: [ {name:'Pasta', qty:1}, {name:'Tomaten', qty:3}, {name:'Rundergehakt', qty:1}, {name:'Ui', qty:1} ],
      instructions: [
        'Bak ui en gehakt rul in een pan.',
        'Voeg tomaten (geblikt of vers) toe en laat sudderen 15-20 min.',
        'Kook de pasta volgens verpakking en serveer met saus.'
      ],
      url: 'https://www.bbcgoodfood.com/recipes/spaghetti-bolognese'
    },
    {
      id: 'caprese-pasta',
      title: 'Pasta Caprese',
      ingredients: [ {name:'Pasta', qty:1}, {name:'Tomaten', qty:2}, {name:'Mozzarella', qty:1}, {name:'Basilicum', qty:1} ],
      instructions: [
        'Kook de pasta al dente.',
        'Meng gesneden tomaat en mozzarella door de warme pasta.',
        'Breng op smaak met olijfolie, zout en peper.'
      ],
      url: 'https://www.allrecipes.com/recipe/228319/caprese-pasta-salad/'
    },
    {
      id: 'omelet',
      title: 'Eenvoudige Omelet',
      ingredients: [ {name:'Ei', qty:2}, {name:'Mozzarella', qty:1}, {name:'Spinazie', qty:1} ],
      instructions: [
        'Klop eieren en breng op smaak.',
        'Bak kort in een koekenpan, voeg kaas en spinazie toe en vouw dubbel.'
      ],
      url: ''
    }
  ];

  function daysFromNow(n){ return new Date(Date.now()+n*24*60*60*1000).toISOString().slice(0,10) }

  // Storage
  function loadStock(){
    const raw = localStorage.getItem('dyp_stock');
    if(!raw) return SAMPLE.map(x=>Object.assign({},x));
    try{ return JSON.parse(raw) }catch(e){ return SAMPLE.map(x=>Object.assign({},x)); }
  }
  function saveStock(stock){ localStorage.setItem('dyp_stock', JSON.stringify(stock)) }

  let stock = loadStock();

  // DOM refs
  const invStack = $('#inventory-stack');
  const recipeStack = $('#recipe-stack');
  const tabInv = $('#tab-inventory');
  const tabRec = $('#tab-recipes');
  const openRegisterBtn = $('#open-register');
  const registerPanel = $('#register-panel');
  const regName = () => $('#reg-name');
  const regQty = () => $('#reg-qty');
  const regExpires = () => $('#reg-expires');
  const regMsg = () => $('#reg-msg');
  const regCancel = $('#reg-cancel');

  // Tabs
  tabInv.addEventListener('click', ()=>{ showView('inventory') });
  tabRec.addEventListener('click', ()=>{ showView('recipes') });

  function showView(v){
    if(v==='inventory'){
      $('#inventory-view').classList.remove('hidden');
      $('#recipes-view').classList.add('hidden');
      tabInv.classList.add('active'); tabRec.classList.remove('active');
      renderInventory();
    } else {
      $('#inventory-view').classList.add('hidden');
      $('#recipes-view').classList.remove('hidden');
      tabRec.classList.add('active'); tabInv.classList.remove('active');
      renderRecipes([]);
    }
  }

  // Register panel logic
  if(openRegisterBtn){
    openRegisterBtn.addEventListener('click', ()=>{
      // open panel and set default date
      if(registerPanel) registerPanel.classList.remove('hidden');
      const tomorrow = new Date(Date.now()+7*24*60*60*1000).toISOString().slice(0,10);
      if(regExpires()) regExpires().value = tomorrow;
      if(regName()) regName().focus();
    });
  }
  if(regCancel){ regCancel.addEventListener('click', ()=>{ if(registerPanel) registerPanel.classList.add('hidden'); }); }

  if(registerPanel){
    registerPanel.addEventListener('submit', e=>{
      e.preventDefault();
      const name = regName().value.trim();
      const qty = parseInt(regQty().value,10) || 1;
      const expires = regExpires().value || new Date().toISOString().slice(0,10);
      if(!name){ regMsg().textContent = 'Vul een naam in.'; setTimeout(()=>regMsg().textContent='',2400); return }
      const id = Date.now();
      stock.push({id:id,name:name,qty:qty,expires:expires});
      saveStock(stock);
      renderInventory();
      registerPanel.classList.add('hidden');
      regMsg().textContent = 'Opgeslagen.';
      setTimeout(()=>{ if(regMsg()) regMsg().textContent=''; },1800);
    });
  }

  // Render inventory as stacked cards
  function renderInventory(){
    invStack.innerHTML='';
    const inStock = stock.filter(s=>s.qty>0);
    if(inStock.length===0){ invStack.innerHTML = '<p class="muted">Geen items in voorraad. Klik "Laad voorbeeldvoorraad" om te testen.</p>'; return }

    inStock.reverse().forEach((item, idx)=>{
      const el = makeCard(item.name + (item.qty>1?` x${item.qty}`:''), `Vervalt: ${item.expires}`);
      el.dataset.id = item.id;
      invStack.appendChild(el);
      attachSwipe(el, (dir)=>{
        if(dir==='left'){
          // remove one unit / mark removed
          const s = stock.find(x=>x.id==item.id);
          if(!s) return;
          s.qty = Math.max(0, s.qty-1);
          saveStock(stock);
          el.remove();
        } else if(dir==='right'){
          // move to bottom (lower priority)
          const s = stock.find(x=>x.id==item.id);
          if(!s) return;
          // simple effect: move to end of array
          stock = stock.filter(x=>x.id!=s.id).concat(s);
          saveStock(stock);
          el.remove();
        }
      });
    });
  }

  // Make a card element
  function makeCard(title, subtitle){
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p><div class="meta"><small class="muted">Swipe left/right</small></div>`;
    return div;
  }

  // Escape helper
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]) }

  // Attach swipe gestures to element
  function attachSwipe(el, onSwipe){
    let startX=0, startY=0, pointerId=null; const threshold=100;
    const overlay = document.createElement('div'); overlay.className='overlay'; overlay.style.opacity='0'; el.appendChild(overlay);

    function onDown(e){
      const p = e.touches ? e.touches[0] : e;
      pointerId = p.identifier ?? 'mouse'; startX = p.clientX; startY = p.clientY;
      el.style.transition='';
    }
    function onMove(e){
      if(pointerId===null) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - startX; const dy = p.clientY - startY;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx*0.03}deg)`;
      overlay.style.opacity = Math.min(1, Math.abs(dx)/160);
      overlay.className = 'overlay ' + (dx>0?'right':'left');
      overlay.textContent = dx>0? 'Nog aanwezig / Kies recept' : 'Opgegeten / Weggegooid';
    }
    function onUp(e){
      if(pointerId===null) return; pointerId=null;
      const p = (e.changedTouches ? e.changedTouches[0] : e);
      const dx = p.clientX - startX;
      el.style.transition='transform .25s ease-out';
      if(dx > threshold){ el.style.transform = `translate(1000px,0) rotate(20deg)`; setTimeout(()=>{ onSwipe('right') },220); }
      else if(dx < -threshold){ el.style.transform = `translate(-1000px,0) rotate(-20deg)`; setTimeout(()=>{ onSwipe('left') },220); }
      else { el.style.transform='translate(0,0)'; overlay.style.opacity='0' }
    }

    // Pointer events
    el.addEventListener('pointerdown', e=>{ el.setPointerCapture(e.pointerId); onDown(e); });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    // Touch fallback (for older browsers)
    el.addEventListener('touchstart', onDown);
    el.addEventListener('touchmove', onMove);
    el.addEventListener('touchend', onUp);
  }

  // RECIPES
  function generateRecipes(count){
    const available = stock.filter(s=>s.qty>0);
    const recipes = [];
    if(available.length===0) return recipes;
    for(let i=0;i<count;i++){
      const size = Math.min(3, Math.max(1, Math.floor(Math.random()*Math.min(4, available.length))+1));
      const chosen = shuffle(Array.from(available)).slice(0,size);
      recipes.push({id:Date.now()+i, title: chosen.map(c=>c.name).join(' + '), ingredients: chosen.map(c=>({id:c.id,name:c.name,qty:1}))});
    }
    return recipes;
  }

  function renderRecipes(list){
    recipeStack.innerHTML='';
    if(list.length===0){ recipeStack.innerHTML = '<p class="muted">Klik "Genereer recepten" om recepten te zien op basis van je voorraad.</p>'; return }
    list.reverse().forEach(r=>{
      const el = document.createElement('div'); el.className='card';
      const ingr = (r.ingredients||[]).map(i=>i.name).join(', ');
      const stepsHtml = (r.instructions||[]).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
      el.innerHTML = `
        <h3>${escapeHtml(r.title)}</h3>
        <p>${escapeHtml(ingr)}</p>
        <div class="meta"><small class="muted">Swipe right om te kiezen</small></div>
        <div class="recipe-actions" style="margin-top:10px;display:flex;gap:8px;align-items:center">
          <button class="btn" data-action="view">Bekijk recept</button>
          ${r.url?`<a class="btn ghost" href="${r.url}" target="_blank">Bron</a>`:''}
        </div>
        <div class="recipe-steps hidden" style="margin-top:10px"><ol>${stepsHtml}</ol></div>
      `;
      recipeStack.appendChild(el);
      const viewBtn = el.querySelector('[data-action="view"]');
      const steps = el.querySelector('.recipe-steps');
      if(viewBtn){ viewBtn.addEventListener('click', ()=>{ steps.classList.toggle('hidden'); }); }
      attachSwipe(el, (dir)=>{
        if(dir==='right'){
          // accept recipe: subtract ingredients
          r.ingredients.forEach(ing=>{
            // try to match by id first, else by name
            let s = stock.find(x=>x.id==ing.id);
            if(!s){ s = stock.find(x=>x.name.toLowerCase()===ing.name.toLowerCase()); }
            if(s) s.qty = Math.max(0, s.qty - (ing.qty||1));
          });
          saveStock(stock);
          // show instructions after choosing
          if(r.instructions && r.instructions.length>0){
            const text = r.instructions.map((st,idx)=>`${idx+1}. ${st}`).join('\n');
            // small in-page modal replacement
            alert(`Gekozen: ${r.title}.\n\nBereidingswijze:\n${text}`);
          } else if(r.url){ window.open(r.url, '_blank'); }
          el.remove();
        } else {
          // dismiss recipe
          el.remove();
        }
      });
    });
  }

  // Helpers
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a }

  // Controls
  $('#refresh-stock').addEventListener('click', ()=>{ stock = SAMPLE.map(x=>Object.assign({},x)); saveStock(stock); renderInventory(); });
  $('#clear-storage').addEventListener('click', ()=>{ localStorage.removeItem('dyp_stock'); stock = loadStock(); renderInventory(); });
  $('#generate-recipes').addEventListener('click', ()=>{
    const count = 3 + Math.floor(Math.random()*3);
    const recs = generateRecipes(count);
    $('#recipe-count').textContent = `${recs.length} recepten`;
    renderRecipes(recs);
    showView('recipes');
  });

  // Init
  renderInventory();
  // Ensure logo is visible; if the image fails to load, replace with inline SVG fallback
  document.addEventListener('DOMContentLoaded', ()=>{
    const img = document.querySelector('.site-logo');
    if(!img) return;
    img.addEventListener('error', ()=>{
      try{
        const wrapper = document.createElement('div');
        wrapper.className = 'logo-fallback';
        wrapper.innerHTML = `
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120' role='img' aria-label='Date Your Plate'>
            <rect width='100%' height='100%' fill='#FFF6E9'/>
            <text x='16' y='52' font-family='Fredoka One, Nunito Sans, sans-serif' font-size='28' fill='#1B5E3F'>Date Your Plate</text>
            <text x='16' y='88' font-family='Nunito Sans, sans-serif' font-size='12' fill='#FF6F5E'>Swipe right on food, swipe left on waste</text>
          </svg>`;
        img.replaceWith(wrapper);
      }catch(e){ /* ignore */ }
    });
  });
})();

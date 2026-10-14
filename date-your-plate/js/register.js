// register.js — handles adding a product to the shared dyp_stock localStorage
(function(){
  const form = document.getElementById('register-form');
  const back = document.getElementById('back');
  const msg = document.getElementById('msg');

  function loadStock(){
    const raw = localStorage.getItem('dyp_stock');
    if(!raw) return [];
    try{ return JSON.parse(raw) }catch(e){ return [] }
  }
  function saveStock(stock){ localStorage.setItem('dyp_stock', JSON.stringify(stock)) }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const qty = parseInt(document.getElementById('qty').value,10) || 1;
    const expires = document.getElementById('expires').value;
    if(!name || !expires){ showMsg('Vul naam en vervaldatum in.'); return }

    const stock = loadStock();
    const id = Date.now();
    stock.push({id:id, name:name, qty:qty, expires:expires});
    saveStock(stock);
    showMsg('Opgeslagen.');
    // short feedback then go back to index
    setTimeout(()=>{ window.location.href = './Index.razer.html'; }, 700);
  });

  back.addEventListener('click', ()=>{ window.location.href = './Index.razer.html'; });

  function showMsg(t){ msg.textContent = t; setTimeout(()=>{ msg.textContent=''; },2800); }

})();

/* 영통구청 AI 실습 대시보드. 외부 라이브러리 없음. */
(() => {
  'use strict';
  const data = window.DASHBOARD_DATA;
  if (!data) { document.body.textContent = '실습자료를 불러오지 못했어. data.js 파일을 확인해 줘.'; return; }
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const tabs = ['ask','press','apps','pickle'];
  let filter = 'all', query = '', toastTimer;
  const FAVKEY = 'yeongtong_favorites_v1';
  let favorites = new Set();
  try { const stored=JSON.parse(localStorage.getItem(FAVKEY)||'[]'); if(Array.isArray(stored)) favorites=new Set(stored.filter(v=>typeof v==='string')); } catch(e) {}

  function toast(message) {
    const el=$('#toast');
    el.textContent=message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('visible'),2700);
  }
  function manualCopy(text) {
    $('#manual-copy-text').value=text;
    const d=$('#manual-copy-dialog');
    if (d.showModal) d.showModal(); else d.setAttribute('open','');
    const area=$('#manual-copy-text'); area.focus(); area.select();
  }
  async function copyText(text) {
    if (!text || typeof text !== 'string') { toast('복사할 내용이 없어.'); return; }
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text); toast('복사했어! 원하는 곳에 붙여넣어 줘.'); return;
      }
    } catch (e) { /* fallback below */ }
    const temp=document.createElement('textarea');
    temp.value=text; temp.setAttribute('readonly','');
    temp.style.position='fixed';temp.style.left='-9999px';temp.style.top='0';
    document.body.appendChild(temp);temp.focus();temp.select();
    let copied=false;
    try { copied=document.execCommand('copy'); } catch(e) {}
    temp.remove();
    if(copied) toast('복사했어! 원하는 곳에 붙여넣어 줘.');
    else { toast('자동 복사가 어려워서 원문을 보여줄게.'); manualCopy(text); }
  }
  function setTab(name,updateHash=true,scrollToNav=updateHash) {
    if(!tabs.includes(name))name='ask';
    for (const n of tabs) {
      const selected=n===name;
      $('#tab-'+n).classList.toggle('active',selected);
      $('#tab-'+n).setAttribute('aria-selected',String(selected));
      $('#tab-'+n).tabIndex=selected?0:-1;
      $('#panel-'+n).hidden=!selected;
    }
    if(updateHash)history.replaceState(null,'','#'+name);
    if(scrollToNav) window.scrollTo({top:Math.max(0,$('.module-nav').getBoundingClientRect().top+window.scrollY-14),behavior:'smooth'});
  }
  $$('.tab').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
  $$('.tab').forEach((t,i)=>t.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft') {
      e.preventDefault(); const step=e.key==='ArrowRight'?1:-1;const next=$$('.tab')[(i+step+tabs.length)%tabs.length];next.focus();next.click();
    }
  }));
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.goto)));
  window.addEventListener('hashchange',()=>setTab(location.hash.replace('#',''),false,true));

  $('#question-short').textContent='“'+data.questionShort+'”';
  $('#question-full').textContent=data.questionFull;
  $('#user-instruction-recommended').textContent=data.userInstructionRecommended;
  $('#user-instruction-original').textContent=data.userInstructionOriginal;
  $('#press-full').textContent=data.pressReleaseInstruction;
  $('#poster-practice-prompt').textContent=data.posterPracticePrompt;
  $('#error-prompt').textContent=data.errorPrompt;
  $('#copy-question-short').addEventListener('click',()=>copyText(data.questionShort));
  $('#copy-question-full').addEventListener('click',()=>copyText(data.questionFull));
  $('#copy-user-instruction-recommended').addEventListener('click',()=>copyText(data.userInstructionRecommended));
  $('#copy-user-instruction-original').addEventListener('click',()=>copyText(data.userInstructionOriginal));
  $('#copy-press').addEventListener('click',()=>copyText(data.pressReleaseInstruction));
  $('#copy-poster-prompt').addEventListener('click',()=>copyText(data.posterPracticePrompt));
  $('#copy-error').addEventListener('click',()=>copyText(data.errorPrompt));
  $('#download-press').addEventListener('click',()=>{
    const blob=new Blob([data.pressReleaseInstruction],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url;a.download='수원시_영통구_보도자료_AI비서_프로젝트지침.txt';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('지침 TXT 파일 다운로드를 시작했어.');
  });
  $('#close-dialog').addEventListener('click',()=>{
    const dialog=$('#manual-copy-dialog');
    if(typeof dialog.close==='function') dialog.close();
    else dialog.removeAttribute('open');
  });

  const grid=$('#app-grid');
  function node(tag,cls,text) {const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function button(label,cls,onClick) {const el=node('button','button '+cls,label);el.type='button';el.addEventListener('click',onClick);return el;}
  function renderCards() {
    grid.replaceChildren();
    const items=data.apps.filter(a=>{
      if(filter==='favorite'&&!favorites.has(a.id))return false;
      if(filter!=='all'&&filter!=='favorite'&&a.category!==filter)return false;
      return (a.title+' '+a.summary+' '+a.short).toLowerCase().includes(query.toLowerCase());
    });
    $('#app-empty').hidden=items.length>0;
    for(const app of items) {
      const card=node('article','app-card');
      const head=node('div','app-card-head');
      const emoji=node('div','app-emoji',app.emoji); emoji.setAttribute('aria-hidden','true');
      const titlebox=node('div','app-card-title');titlebox.appendChild(node('h3','',app.title));
      const metas=node('div','meta-row');metas.appendChild(node('span','meta-pill',app.category));metas.appendChild(node('span','meta-pill',app.level));
      metas.appendChild(node('span','meta-pill '+(app.verified?'test-ok':''),app.verified?'강사 앱 생성 확인':'추가 테스트 예정'));
      titlebox.appendChild(metas);
      const fav=node('button','favorite'+(favorites.has(app.id)?' on':''),favorites.has(app.id)?'★':'☆');
      fav.type='button';fav.setAttribute('aria-label',(favorites.has(app.id)?'즐겨찾기 해제: ':'즐겨찾기 추가: ')+app.title);
      fav.setAttribute('aria-pressed',String(favorites.has(app.id)));
      fav.addEventListener('click',()=>{
        if(favorites.has(app.id))favorites.delete(app.id);else favorites.add(app.id);
        try {localStorage.setItem(FAVKEY,JSON.stringify([...favorites]));}catch(e){}
        renderCards();toast('즐겨찾기를 변경했어.');
      });
      head.append(emoji,titlebox,fav);card.appendChild(head);
      card.appendChild(node('p','app-description',app.summary));
      const actions=node('div','app-card-actions');
      actions.appendChild(button('📋 제작 프롬프트 복사','button-primary',()=>copyText(app.creation)));
      actions.appendChild(button('✨ 수정 주문 복사','button-outline',()=>copyText(app.revision)));
      card.appendChild(actions);
      const details=node('details','accordion');const summary=node('summary','', '제작 프롬프트 원문 보기 ▾');
      const pre=node('pre','full-prompt',app.creation);
      details.append(summary,pre);card.appendChild(details);
      grid.appendChild(card);
    }
  }
  $('#app-search').addEventListener('input',e=>{query=e.target.value.trim();renderCards();});
  $$('.filter').forEach(b=>b.addEventListener('click',()=>{
    filter=b.dataset.filter;
    $$('.filter').forEach(btn=>{const is=btn===b;btn.classList.toggle('active',is);btn.setAttribute('aria-pressed',String(is));});
    renderCards();
  }));
  renderCards();
  setTab(location.hash.replace('#',''),false);
})();

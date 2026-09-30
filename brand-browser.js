(() => {
'use strict';
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
function mount(host,{items=[],partners,brand,onOpen,onBrand,onCard,entries,hideTabs=false,landscape=false,label="Brand collaborations"}){
  const works=entries||partners.flatMap(partner=>items.filter(item=>item.partner===partner.id&&(item.collections||[]).includes('collaborations')));
  const available=partners.filter(partner=>works.some(item=>item.partner===partner.id));
  const browser=el('div','brand-browser'),tabs=el('div','brand-pills'),rail=el('div','brand-rail'),footer=el('div','brand-rail-footer');
  tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Choose a collaboration brand');
  rail.tabIndex=0;rail.setAttribute('role','region');rail.setAttribute('aria-label',label+'. Use left and right arrow keys to browse.');
  if(landscape)browser.classList.add('landscape-browser');
  const bounded=true;if(bounded)browser.classList.add('bounded-brand-browser');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active=0,frame=0,drag=null,suppressClick=false;
  const buttons=available.map(partner=>{const button=el('button','brand-pill',partner.name);button.type='button';button.setAttribute('aria-pressed','false');button.dataset.brand=partner.id;button.addEventListener('click',()=>go(works.findIndex(item=>item.partner===partner.id)));tabs.append(button);return button;});
  const cards=works.map(item=>{
    const card=el('article','brand-work'),button=el(onOpen&&!item.externalOnly?'button':'a','brand-work-cover');
    if(item.externalOnly){button.href=item.external;button.target='_blank';button.rel='noopener noreferrer';}else if(onOpen){button.type='button';button.addEventListener('click',()=>onOpen(item,button));}else button.href='my-work.html?collection=collaborations&brand='+encodeURIComponent(item.partner)+'&work='+encodeURIComponent(item.id);
    button.setAttribute('aria-label','Explore '+item.title);
    const img=el('img');img.src=item.image;img.alt='';img.loading='lazy';button.append(img);
    if(item.coverFit==='contain'||item.imageWidth>item.imageHeight)button.classList.add('landscape-cover');
    const marker=el('span','brand-work-open',(item.video||item.youtube||item.instagram||item.videos?.some(video=>video.src||video.youtube))?'▶':'↗');if(marker.textContent==='▶'){marker.classList.add('vector-play');marker.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';}marker.setAttribute('aria-hidden','true');button.append(marker);
    const partner=available.find(p=>p.id===item.partner);card.append(button);if(!hideTabs)card.append(el('p','brand-work-name',partner.name));if(item.partner!=='naver-clip')card.append(el('h3','',item.title));rail.append(card);onCard?.(item,button);return card;
  });
  const status=el('p','brand-rail-status'),controls=el('div','brand-rail-controls');status.setAttribute('aria-live','polite');
  const previous=el('button','','←'),next=el('button','','→');previous.type=next.type='button';previous.setAttribute('aria-label','Previous video');next.setAttribute('aria-label','Next video');previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));controls.append(previous,next);footer.append(status,controls);
  if(!hideTabs)browser.append(tabs);browser.append(rail,footer);host.append(browser);
  function position(index){const offset=cards[index].offsetLeft-cards[0].offsetLeft;return bounded?Math.max(0,Math.min(offset,rail.scrollWidth-rail.clientWidth)):offset;}
  function select(index){active=index;const id=works[index].partner;buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.brand===id)));status.textContent=available.find(p=>p.id===id).name;previous.disabled=index===0;next.disabled=index===cards.length-1;onBrand?.(id);}
  function step(direction){let index=active+direction;if(bounded){while(index>=0&&index<cards.length&&Math.abs(position(index)-rail.scrollLeft)<2)index+=direction;}go(index);}
  function go(index){index=Math.max(0,Math.min(cards.length-1,index));if(Math.abs(rail.scrollLeft-position(index))<2)select(index);rail.scrollTo({left:position(index),behavior:reduced?'instant':'smooth'});}
  rail.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{let nearest=0;cards.forEach((card,index)=>{if(Math.abs(position(index)-rail.scrollLeft)<Math.abs(position(nearest)-rail.scrollLeft))nearest=index;});if(bounded&&rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2)nearest=cards.length-1;if(nearest!==active)select(nearest);});},{passive:true});
  rail.addEventListener('keydown',event=>{if(!event.target.closest('.inline-video')&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}});
  rail.addEventListener('pointerdown',event=>{if(event.target.closest('.inline-video')||event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,left:rail.scrollLeft,id:event.pointerId,moved:false};});
  rail.addEventListener('pointermove',event=>{if(!drag)return;const delta=event.clientX-drag.x;if(Math.abs(delta)>6&&!drag.moved){drag.moved=true;rail.setPointerCapture(drag.id);rail.classList.add('dragging');}if(drag.moved){event.preventDefault();rail.scrollLeft=drag.left-delta;}});
  function endDrag(){if(!drag)return;const moved=drag.moved;drag=null;rail.classList.remove('dragging');if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,100);go(active);}}
  rail.addEventListener('pointerleave',()=>{if(drag&&!drag.moved)drag=null;});
  rail.addEventListener('pointerup',endDrag);rail.addEventListener('pointercancel',endDrag);rail.addEventListener('lostpointercapture',endDrag);
  rail.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}},true);rail.addEventListener('dragstart',event=>event.preventDefault());
  const initial=Math.max(0,works.findIndex(item=>item.partner===brand));select(initial);requestAnimationFrame(()=>{if(host.isConnected)rail.scrollTo({left:position(initial),behavior:'instant'});});
}
window.BrandBrowser={mount};
const home=document.getElementById('home-brand-browser');if(home)mount(home,{items:window.WORK_ITEMS||[],partners:window.COLLABORATORS||[]});
})();

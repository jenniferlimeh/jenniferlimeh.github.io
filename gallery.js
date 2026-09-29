(() => {
'use strict';
document.documentElement.classList.add('js');
const items=window.WORK_ITEMS||[], partners=window.COLLABORATORS||[], model=window.WorkGalleryModel;
const gallery=document.getElementById('gallery'), filters=document.querySelector('.filters'), count=document.getElementById('work-count');
const empty=document.getElementById('collection-empty'), brandFilters=document.getElementById('brand-filters');
const format=document.getElementById('format-filter'), platform=document.getElementById('platform-filter');
const dialog=document.getElementById('work-dialog'), stage=document.getElementById('player-stage');
const dialogHome=dialog.parentNode;
let inlineTrigger=null,clearTextScroll=null;
function resetInline(){
  if(!inlineTrigger)return;
  clearTextScroll?.();clearTextScroll=null;
  dialog.removeAttribute('open');stopPlayer();
  inlineTrigger.hidden=false;inlineTrigger.setAttribute('aria-expanded','false');
  inlineTrigger.closest('.brand-work')?.classList.remove('expanded-work');
  dialogHome.appendChild(dialog);dialog.classList.remove('inline-video');inlineTrigger=null;
}
const narrative=dialog.querySelector('.dialog-copy>div:first-child');narrative.classList.add('dialog-narrative');
const menu=document.getElementById('nav-links'), menuButton=document.querySelector('.menu-toggle');
const element=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;};
const channel=(text,url)=>{const a=element('a','text-link',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
const canPlay=model.canPlay;
function youtubeEmbed(media){
  const params=new URLSearchParams({playsinline:'1',rel:'0'});
  if(Number.isInteger(media.youtubeStart)&&media.youtubeStart>=0)params.set('start',String(media.youtubeStart));
  if(Number.isInteger(media.youtubeEnd)&&media.youtubeEnd>(media.youtubeStart||0))params.set('end',String(media.youtubeEnd));
  return 'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(media.youtube)+'?'+params;
}
let state=model.normalize(), returnFocus=null, slideshow=null, skipCloseSync=false;
const triggers=new Map();
const descriptions={
all:['The full creative collection.','Paid creative, personal stories, and collaborations, all in one place.'],
apr:['Made at APR.','Creative production, publishing, and performance reviews for APRILSKIN’s US and Singapore audiences, spanning Meta and Snapchat advertising and TikTok content.'],
collaborations:['Brands, through my lens.','Creator partnerships across beauty, travel, learning, and everyday life. Choose a brand to explore.'],
carousels:['Stories, one swipe at a time.','Personal Instagram carousels: travel diaries, everyday stories, and practical guides, told through photos and short videos.'],
personal:['Dwell on Jen, on YouTube.','Longer stories from my personal channel, collected into Camino de Santiago, London and travel, and everyday life in Korea.'],
reels:['Stories that become a series.','English diaries from France, my original useful-English series, and everyday discoveries.']};
menuButton.hidden=false;
const setMenu=open=>{menu.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close −':'Menu +';};
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('click',e=>{if(!e.target.closest('.nav'))setMenu(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){setMenu(false);menuButton.focus();}});
const mobile=window.matchMedia('(max-width:760px)');if(mobile.addEventListener)mobile.addEventListener('change',()=>setMenu(false));
document.getElementById('year').textContent=String(new Date().getFullYear());
function syncURL(workId,variantId){
  const u=new URL(location.href);u.searchParams.delete('filter');
  for(const key of ['collection','format','platform','brand']){const value=state[key];if(!value||value==='all')u.searchParams.delete(key);else u.searchParams.set(key,value);}
  if(workId)u.searchParams.set('work',workId);else u.searchParams.delete('work');
  if(workId&&variantId)u.searchParams.set('variant',variantId);else u.searchParams.delete('variant');
  try{history.replaceState(null,'',u);}catch(_){}
}
function releaseVideos(container){container.querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(source=>source.remove());video.load();});}
function restoreInlineDetails(){
  dialog.querySelector('.dialog-copy').prepend(narrative);
  const description=document.getElementById('dialog-description'),title=document.getElementById('dialog-title'),toolPanel=document.getElementById('dialog-tools');
  if(description)title.after(description);
  if(toolPanel)document.querySelector('.dialog-meta').appendChild(toolPanel);
}
function stopPlayer(){restoreInlineDetails();releaseVideos(stage);stage.replaceChildren();slideshow=null;}
const productionTools={'photoshop':'Adobe Photoshop','premiere-pro':'Adobe Premiere Pro','after-effects':'Adobe After Effects','final-cut-pro':'Final Cut Pro','final-cut-pro-x':'Final Cut Pro X'};
const roasValue=metric=>(metric||'').match(/([\d.,]+%\+?)\s+ROAS/i);
function showDetails(details){
  restoreInlineDetails();
  const description=document.getElementById('dialog-description'),role=document.getElementById('dialog-role');
  description.textContent=details.description||'';description.hidden=!details.description;
  role.textContent=details.role||'';role.hidden=!details.role;role.previousElementSibling.hidden=!details.role;
  document.getElementById('dialog-result').hidden=!details.metric;
  document.getElementById('dialog-metric').textContent=details.metric||'';
  let toolPanel=document.getElementById('dialog-tools');
  if(!toolPanel){toolPanel=element('div','production-tools');toolPanel.id='dialog-tools';document.querySelector('.dialog-meta').appendChild(toolPanel);}
  toolPanel.replaceChildren();const toolIds=(details.tools||[]).filter(id=>productionTools[id]);toolPanel.hidden=!toolIds.length;
  if(toolIds.length){
    const list=element('ul','tool-list');toolPanel.append(element('strong','tools-label','MADE WITH'),list);
    toolIds.forEach(id=>{const li=element('li','tool-chip'),icon=element('img');icon.src='logos/tools/'+(id==='final-cut-pro-x'?'final-cut-pro':id)+'.png';icon.alt=productionTools[id];icon.width=32;icon.height=32;li.appendChild(icon);list.appendChild(li);});
  }
  const process=document.getElementById('dialog-process');process.replaceChildren();
  let language=document.getElementById('dialog-language-context');
  if(!language){language=element('div','creative-language');language.id='dialog-language-context';process.before(language);}
  language.replaceChildren();language.hidden=!details.languageContext;
  if(details.languageContext){
    const context=details.languageContext,original=element('p','creative-original',context.original);original.lang='ko';
    language.append(element('h3','','Reading the creative'),original,element('p','creative-translation',context.translation),element('p','',context.context));
  }
  if(details.process)for(const [key,label] of [['idea','The idea'],['approach','My approach'],['delivery','How I delivered it'],['response','The response'],['learning','What I learned']])if(details.process[key]){const p=element('p');p.append(element('strong','',label+'. '),document.createTextNode(details.process[key]));process.appendChild(p);}
  process.hidden=!process.childElementCount;
}
function showSource(item,variant={}){
  const source=document.getElementById('dialog-source');
  const url=Object.prototype.hasOwnProperty.call(variant,'external')?variant.external:item.external;
  source.hidden=!url;
  if(url){source.href=url;source.textContent=variant.sourceLabel||item.sourceLabel||(item.youtube?'Open on YouTube ↗':item.instagram?'Open on Instagram ↗':'Visit Instagram profile ↗');}
  else source.removeAttribute('href');
}
function showVideos(item,requestedVariant,container=stage,preserveVariant=false){
  const videos=model.videoSources(item),media=model.mediaSources(item),campaign=media.length>1;
  if(media.length&&media.every(part=>part.type==='image')){
    stage.classList.add('has-slides');
    showSlides({...item,slides:media},container,{startIndex:Math.max(0,media.findIndex(part=>part.id===requestedVariant)),onSelect:variant=>{
      showDetails(model.videoDetails(item,variant));showSource(item,variant);syncURL(item.id,variant.id);
      document.getElementById('dialog-note').textContent=variant.preview?'Portfolio image preview. Choose a thumbnail to explore the other creative.':'Choose a thumbnail to explore the image creatives.';
    }});return;
  }
  const view=element('div','native-videos'),shell=element('div','video-shell'),facts=element('div','player-facts'),summary=element('p','video-selection');
  const choices=element('div','video-variants'),note=document.getElementById('dialog-note');
  stage.classList.add('has-native-video');shell.id='campaign-player';
  summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');summary.setAttribute('aria-atomic','true');
  choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a creative');
  if(item.showEpisodeThumbnails||item.stills?.length)choices.classList.add('episode-choices');
  const buttons=media.map((variant,index)=>{
    const button=element('button','video-variant',(variant.preview?'Preview':variant.type==='image'?'Image':String(index+1).padStart(2,'0'))+' / '+(variant.title||item.title));
    if((item.showEpisodeThumbnails||item.stills?.length)&&(variant.poster||variant.type==='image')){const label=element('span','episode-label',button.textContent),thumb=element('img');thumb.src=variant.poster||variant.src;thumb.alt='';thumb.loading='lazy';button.replaceChildren(thumb,label);}
    const roas=roasValue(variant.metric);if(roas)button.appendChild(element('span','variant-roas',roas[1]+' ROAS'));
    button.type='button';button.setAttribute('aria-controls',shell.id);button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>select(index));choices.appendChild(button);return button;
  });
  if(item.comparisonPairs?.length){
    choices.classList.add('comparison-pairs');choices.setAttribute('aria-label','Compare creative variations');
    item.comparisonPairs.forEach(pair=>{
      const group=element('div','comparison-pair'),heading=element('p','comparison-title',pair.title),description=element('p','comparison-description',pair.description),row=element('div','comparison-options');
      group.setAttribute('role','group');group.setAttribute('aria-label',pair.title);
      pair.variants.forEach(id=>{const index=media.findIndex(variant=>variant.id===id);if(index<0)return;
        const button=buttons[index],label=element('span','comparison-name',button.textContent),thumb=element('img');
        thumb.src=media[index].poster;thumb.alt='';thumb.loading='lazy';button.replaceChildren(thumb,label);row.appendChild(button);
      });
      group.append(heading,description,row);choices.appendChild(group);
    });
  }
  view.append(shell,facts);if(campaign)view.append(summary,choices);container.appendChild(view);
  let selectedIndex=-1;
  function select(index){
    if(index===selectedIndex)return;
    selectedIndex=index;releaseVideos(shell);shell.replaceChildren();
    const variant=media[index],isImage=variant.type==='image',isYouTube=Boolean(variant.youtube),video=element(isImage?'img':isYouTube?'iframe':'video');
    const width=Number(variant.width),height=Number(variant.height),ratio=width>0&&height>0?width/height:16/9;
    shell.style.setProperty('--video-ratio',String(ratio));
    video.style.aspectRatio=String(ratio);
    if(isImage)video.alt=variant.title||item.title;
    else if(isYouTube){video.title=(variant.title||item.title)+' — YouTube video';video.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';video.allowFullscreen=true;video.referrerPolicy='strict-origin-when-cross-origin';}
    else{video.controls=true;video.playsInline=true;video.preload='metadata';if(variant.poster||item.image)video.poster=variant.poster||item.image;}
    if(width>0&&height>0){video.width=width;video.height=height;}
    video.setAttribute('aria-label',variant.title||item.title);
    video.addEventListener('error',()=>{if(video.isConnected)note.textContent='This '+(isImage?'image':'video')+' could not load. Please try again later.';});
    video.src=isYouTube?youtubeEmbed(variant):variant.src;shell.appendChild(video);
    summary.textContent=(isImage?(variant.preview?'Preview ':'Image ')+(index-videos.length+1)+' of '+item.stills.length:'Video '+(index+1)+' of '+videos.length)+' — '+(variant.title||item.title);
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    const details=model.videoDetails(item,variant);showDetails(details);facts.replaceChildren();

    const roas=roasValue(details.metric);
    if(roas){
      const result=element('div','player-roas'),number=element('p','roas-number'),scope=(details.metric||'').replace(roas[0],'').replace(/^\s*·\s*/,'');
      number.append(element('strong','',roas[1]),element('span','','ROAS'));result.append(number);
      if(scope)result.appendChild(element('p','roas-scope',scope));facts.appendChild(result);document.getElementById('dialog-result').hidden=true;
    }
    if(details.conversionValue){const result=element('div','player-conversion');result.append(element('strong','',details.conversionValue.value),element('p','',details.conversionValue.scope));facts.appendChild(result);}
    facts.hidden=!facts.childElementCount;
    showSource(item,variant);
    document.getElementById('dialog-brand').textContent=[item.brand,model.platformNames({...variant,platform:variant.platform??item.platform}).join(' · ')].filter(Boolean).join(' / ');
    note.textContent=variant.sourceNote||(isImage?'Static review creative from this collection.':'');
    syncURL(item.id,campaign||preserveVariant?variant.id:undefined);
  }
  const requested=media.findIndex(variant=>variant.id===requestedVariant);
  const matching=media.findIndex(variant=>model.matchesPart({...variant,medium:variant.type==='image'&&!variant.preview?'image':'video',platform:variant.platform??item.platform},state));
  select(requested>=0?requested:matching>=0?matching:0);
}
function showSlides(item,container=stage,options={}){
  const slides=item.slides||[],view=element('div','slide-view');
  if(!slides.length)return;
  view.tabIndex=0;view.setAttribute('role','region');view.setAttribute('aria-label',item.title||'Image collection');view.setAttribute('aria-roledescription','carousel');
  const deck=element('div','slide-deck'),caption=element('p','slide-caption'),position=element('p','slide-position sr-only');
  const previous=element('button','slide-direction previous'),nextSlide=element('button','slide-direction next');
  [previous,nextSlide].forEach(button=>{button.type='button';button.addEventListener('pointerdown',e=>e.stopPropagation());deck.appendChild(button);});
  previous.addEventListener('click',e=>{e.stopPropagation();select(index-1)});nextSlide.addEventListener('click',e=>{e.stopPropagation();select(index+1)});
  const thumbs=element('div','slide-thumbnails'),hint=element('p','slide-hint','Choose a thumbnail, tap a neighbouring image, or swipe to explore.');
  thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','Choose a slide');
  position.setAttribute('role','status');position.setAttribute('aria-live','polite');position.setAttribute('aria-atomic','true');
  view.append(deck,caption,position,thumbs,hint);container.appendChild(view);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let index=-1,start=null,suppressClickUntil=0;
  const panels=slides.map((slide,i)=>{
    const panel=element('div','slide-panel'),frame=element('div','slide-preview'),peek=element('button','slide-peek');
    panel.style.setProperty('--slide-ratio',String(slide.width>0&&slide.height>0?slide.width/slide.height:1));
    peek.type='button';peek.tabIndex=-1;peek.setAttribute('aria-label','Show '+(slide.type==='video'?'video':'image')+' '+(i+1));
    peek.addEventListener('click',e=>{e.stopPropagation();if(performance.now()>suppressClickUntil)select(i)});
    panel.append(frame,peek);deck.appendChild(panel);return {panel,frame,peek};
  });
  const buttons=slides.map((slide,i)=>{
    const button=element('button','slide-thumbnail'),img=element('img');
    button.type='button';button.setAttribute('aria-label','Show '+(slide.type==='video'?'video':'image')+' '+(i+1)+' of '+slides.length+(slide.caption||slide.title?' — '+(slide.caption||slide.title):''));
    img.src=slide.poster||slide.src;img.alt='';img.loading='lazy';img.draggable=false;
    button.append(img);
    if(slide.type==='video'){const marker=element('span','slide-video-marker','▶');marker.setAttribute('aria-hidden','true');button.append(marker);}
    button.addEventListener('click',()=>select(i));thumbs.appendChild(button);return button;
  });
  function select(next,initial=false){
    next=model.slideIndex(0,next,slides.length);if(next===index)return;
    index=next;
    panels.forEach(({panel,frame,peek},i)=>{
      const slide=slides[i],distance=i-index,depth=Math.abs(distance),active=distance===0,visible=depth<=2;
      panel.classList.toggle('is-active',active);panel.classList.toggle('is-visible',visible);panel.setAttribute('aria-hidden',String(!active));
      panel.style.setProperty('--slide-offset',(distance===0?0:Math.sign(distance)*(59+(depth-1)*21))+'%');
      panel.style.setProperty('--slide-scale',String(active?1:Math.max(.5,.84-(depth-1)*.1)));
      panel.style.setProperty('--slide-turn',(distance===0?0:-Math.sign(distance)*14)+'deg');
      panel.style.setProperty('--slide-blur',(active?0:Math.min(5,depth*2+1))+'px');
      panel.style.zIndex=String(active?10:Math.max(0,7-depth));
      peek.hidden=active||!visible;frame.className=active?'slide-media':'slide-preview';
      const tag=active&&slide.type==='video'?'VIDEO':'IMG',src=tag==='VIDEO'?slide.src:slide.poster||slide.src;
      if(!visible){releaseVideos(frame);frame.replaceChildren();return;}
      let media=frame.firstElementChild;
      if(!media||media.tagName!==tag||media.getAttribute('src')!==src){
        releaseVideos(frame);frame.replaceChildren();media=element(tag.toLowerCase());
        if(tag==='VIDEO'){media.controls=true;media.playsInline=true;media.preload='metadata';media.poster=slide.poster||'';media.setAttribute('aria-label',slide.alt||slide.title||item.title);}
        else{media.alt=active?(slide.alt||slide.title||item.title):'';media.draggable=false;}
        if(slide.width&&slide.height){media.width=slide.width;media.height=slide.height;}
        media.src=src;frame.appendChild(media);
      }else if(tag==='IMG')media.alt=active?(slide.alt||slide.title||item.title):'';
    });
    buttons.forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===index));if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
    const slide=slides[index];caption.textContent=slide.caption||slide.title||'';caption.hidden=!caption.textContent;
    position.textContent=(index+1)+' / '+slides.length+(slide.type==='video'?' · Video':'');
    previous.textContent='Previous';previous.hidden=index===0;
    nextSlide.textContent='Next';nextSlide.hidden=index===slides.length-1;
    const strip=thumbs.getBoundingClientRect(),selected=buttons[index].getBoundingClientRect();
    thumbs.scrollTo({left:thumbs.scrollLeft+selected.left-strip.left-(strip.width-selected.width)/2,behavior:initial||reduced.matches?'instant':'smooth'});
    if(options.onSelect)options.onSelect(slide,index);
  }
  view.addEventListener('keydown',e=>{
    if(e.target.closest('video'))return;
    if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();select(e.key==='Home'?0:e.key==='End'?slides.length-1:index+(e.key==='ArrowRight'?1:-1));
      if(e.target.closest('.slide-thumbnail'))buttons[index].focus({preventScroll:true});
    }
  });
  deck.addEventListener('pointerdown',e=>{if(e.target.closest('video')||!e.isPrimary||e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};deck.setPointerCapture(e.pointerId);});
  deck.addEventListener('pointerup',e=>{
    if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
    if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.5){suppressClickUntil=performance.now()+350;select(index+(dx<0?1:-1));}
  });
  deck.addEventListener('pointercancel',()=>{start=null;});
  // Pointer capture changes the click target, so select neighbouring cards on pointerdown/up only for taps.
  deck.addEventListener('click',e=>{
    if(performance.now()<=suppressClickUntil||e.target.closest('video'))return;
    const rect=deck.getBoundingClientRect(),active=panels[index].panel.getBoundingClientRect();
    if(e.clientX<active.left&&index>0)select(index-1);
    else if(e.clientX>active.right&&e.clientX<=rect.right&&index<slides.length-1)select(index+1);
  });
  thumbs.hidden=slides.length<2;hint.hidden=slides.length<2;select(options.startIndex||0,true);slideshow=view;
}
function showCarousels(item,requestedVariant){
  const choices=element('div','video-variants carousel-choices'),content=element('div','carousel-content');
  const related=element('div','carousel-related'),relatedChoices=element('div','video-variants carousel-choices');
  related.append(element('p','carousel-related-label','Related work'),relatedChoices);
  relatedChoices.setAttribute('role','group');relatedChoices.setAttribute('aria-label','Choose related work');
  const carousels=item.carousels||[],images=[...carousels,...(item.imageSets||[])],videos=model.videoSources(item).map(video=>({...video,medium:'video',platform:video.platform??item.platform}));
  const groups=(item.videoGroups||[]).map(group=>({...group,medium:'video',platform:item.platform,videos:videos.filter(video=>group.variants.includes(video.id))}));
  const groupedIds=new Set(groups.flatMap(group=>group.variants)),videoEntries=[...videos.filter(video=>!groupedIds.has(video.id)),...groups];
  const entries=item.medium==='video'?[...videoEntries,...images]:[...images,...videoEntries];
  if(item.creativeOrder){const rank=id=>{const index=item.creativeOrder.indexOf(id);return index<0?Infinity:index;};entries.sort((a,b)=>rank(a.id)-rank(b.id));}
  choices.setAttribute('role','group');choices.setAttribute('aria-label',item.unifiedChoices?'Choose a creative':'Choose a carousel');
  content.id='carousel-content';
  const buttons=entries.map((entry,index)=>{
    const label=item.unifiedChoices?String(index+1).padStart(2,'0')+' · '+(entry.medium==='carousel'?'Carousel':entry.medium==='video'?'Video':'Images'):index<carousels.length?String(index+1).padStart(2,'0'):entry.medium==='video'?'Video':'Images';
    const button=element('button','video-variant',label+' / '+entry.title);
    button.type='button';button.setAttribute('aria-controls',content.id);
    button.addEventListener('click',()=>select(index));(item.unifiedChoices||index<carousels.length?choices:relatedChoices).appendChild(button);return button;
  });
  stage.append(choices);if(relatedChoices.childElementCount)stage.append(related);stage.append(content);
  function select(index){
    const entry=entries[index];releaseVideos(content);content.replaceChildren();slideshow=null;
    stage.classList.toggle('has-native-video',entry.medium==='video');
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    if(entry.medium==='video')showVideos({...item,videos:entry.videos||[entry],stills:[]},entry.videos?requestedVariant:entry.id,content,true);
    else{
      showSlides(entry,content);showDetails(entry);showSource(item,entry);slideshow.setAttribute('aria-label',entry.title);
      document.getElementById('dialog-brand').textContent=[item.brand,entry.platform].filter(Boolean).join(' / ');
      document.getElementById('dialog-note').textContent='Choose a thumbnail, select a neighbouring image, or swipe to explore.'+(entry.slides?.some(slide=>slide.type==='video')?' Video slides have their own play controls.':'');
      syncURL(item.id,entry.id);
    }
  }
  const requested=entries.findIndex(entry=>entry.id===requestedVariant||entry.variants?.includes(requestedVariant)),matching=entries.findIndex(entry=>entry.videos?entry.videos.some(video=>model.matchesPart(video,state)):model.matchesPart(entry,state));
  select(requested>=0?requested:matching>=0?matching:0);
}
function openWork(item,trigger,variantId){
  if(item.externalOnly){window.open(item.external,'_blank','noopener,noreferrer');return;}
  const redirect=item.variantRedirects?.find(link=>link.variant===variantId),destination=redirect&&items.find(entry=>entry.id===redirect.work);
  if(destination)return openWork(destination,trigger,variantId);
  if(typeof dialog.showModal!=='function'){const media=model.mediaSources(item),selected=media.find(variant=>variant.id===variantId)||media[0];window.open(selected?.external||selected?.src||item.external||item.linkedClips?.[0]?.external||item.image,'_blank','noopener,noreferrer');return;}
  resetInline();
  returnFocus=trigger;stopPlayer();stage.className='player-stage';dialog.classList.remove('single-video');
  document.getElementById('dialog-title').textContent=item.title;
  document.getElementById('dialog-brand').textContent=[item.brand,item.platform].filter(Boolean).join(' / ');
  showDetails(item);
  document.getElementById('dialog-format').textContent=item.theme;
  const note=document.getElementById('dialog-note');note.textContent='';showSource(item);
  const videoOptions=model.videoSources(item),chosenVideo=videoOptions.find(video=>video.id===variantId)||(!variantId?videoOptions[0]:null);
  const inlineCard=trigger?.closest('.brand-work');
  if(inlineCard&&(chosenVideo||item.youtube||item.instagram)){
    inlineTrigger=trigger;trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls',dialog.id);trigger.hidden=true;
    inlineCard.classList.add('expanded-work');trigger.after(dialog);dialog.classList.add('inline-video');dialog.show();
  }else{dialog.showModal();document.body.classList.add('dialog-open');}
  syncURL(item.id);
  if(chosenVideo){
    dialog.classList.add('single-video');
    document.getElementById('dialog-title').textContent=chosenVideo.title||item.title;
    document.getElementById('dialog-format').textContent=chosenVideo.format||item.format||item.theme;
    showVideos({...item,videos:[chosenVideo],stills:[],comparisonPairs:[],showEpisodeThumbnails:false},chosenVideo.id,stage,true);
  }else if(item.linkedClips?.length){
    stage.classList.add('has-linked-clips');
    const grid=element('div','linked-clips');
    item.linkedClips.forEach(clip=>{
      const link=element('a','linked-clip');link.href=clip.external;link.target='_blank';link.rel='noopener noreferrer';
      const image=element('img');image.src=clip.poster;image.alt=clip.title+' — opening-scene thumbnail';image.width=clip.width;image.height=clip.height;
      const copy=element('div','linked-clip-copy');copy.append(element('h3','',clip.title),element('p','',clip.description),element('span','linked-clip-action','Watch on NAVER Clip ↗'));
      link.append(image,copy);grid.appendChild(link);
    });
    stage.appendChild(grid);note.textContent='Select a thumbnail to watch the original clip on NAVER in a new tab.';
  }else if(item.carousels?.length||item.imageSets?.length||item.videoGroups?.length){
    stage.classList.add('has-slides','has-carousels');showCarousels(item,variantId);
  }else if(item.slides&&item.slides.length){
    stage.classList.add('has-slides');showSlides(item);note.textContent=item.sourceNote||'Choose a thumbnail, select a neighbouring image, or swipe to explore.';
  }else if(item.youtube){
    dialog.classList.add('single-video');
    const iframe=element('iframe');iframe.title=item.title+' — YouTube video';iframe.src=youtubeEmbed(item);iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';stage.appendChild(iframe);
    note.textContent='';
  }else if(model.mediaSources(item).length){
    showVideos(item,variantId);
  }else if(item.instagram){
    dialog.classList.add('single-video');
    const url=new URL(item.instagram);if(!['www.instagram.com','instagram.com'].includes(url.hostname))throw new Error('Unsupported Instagram host');
    const frame=element('iframe');frame.src=url.origin+url.pathname.replace(/\/$/,'')+'/embed/';frame.title=item.title+' — Instagram post';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';stage.classList.add('instagram');stage.appendChild(frame);note.textContent='Instagram may ask you to sign in or open the original post.';
  }else{
    const image=element('img');image.src=item.image;image.alt=item.title+' — original portfolio creative';stage.appendChild(image);
    note.textContent=item.medium==='image'?'Static campaign creative from my portfolio.':'Portfolio stills. The full video is not available on this page.';
  }
  if(dialog.classList.contains('single-video'))dialog.querySelector('.dialog-meta').appendChild(narrative);
  if(inlineTrigger){installTextScroll();stage.querySelector('video')?.play().catch(()=>{});}
}
dialog.querySelector('.close-dialog').addEventListener('click',()=>{if(inlineTrigger){const trigger=inlineTrigger;resetInline();syncURL();trigger.focus({preventScroll:true});}else dialog.close();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&inlineTrigger){const trigger=inlineTrigger;resetInline();syncURL();trigger.focus({preventScroll:true});}});
dialog.addEventListener('close',()=>{stopPlayer();document.body.classList.remove('dialog-open');if(!skipCloseSync)syncURL();skipCloseSync=false;if(returnFocus&&returnFocus.isConnected)returnFocus.focus();});
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
function installTextScroll(){
  clearTextScroll?.();
  const meta=dialog.querySelector('.dialog-meta'),control=element('input','text-scroll-control');
  control.type='range';control.min='0';control.step='1';control.value='0';control.setAttribute('aria-label','Scroll work description');
  dialog.append(control);
  const update=()=>{const max=Math.max(0,meta.scrollHeight-meta.clientHeight);control.max=String(max);control.hidden=max<1;control.style.height=Math.max(32,meta.clientHeight-58)+'px';control.value=String(meta.scrollTop);};
  const sync=()=>{control.value=String(meta.scrollTop);};
  control.addEventListener('input',()=>{meta.scrollTop=Number(control.value);});meta.addEventListener('scroll',sync,{passive:true});
  const observer=new ResizeObserver(update);observer.observe(meta);update();
  clearTextScroll=()=>{observer.disconnect();meta.removeEventListener('scroll',sync);control.remove();};
}
function decorateVideoCard(item,trigger,variantId){
  if(item.externalOnly)return;
  const variants=model.videoSources(item),variant=variants.find(v=>v.id===variantId)||(!variantId?variants[0]:null);
  if(!variant&&!item.youtube&&!item.instagram)return;
  const details=variant?model.videoDetails(item,variant):item,card=trigger.closest('.brand-work');
  if(!card)return;
  card.classList.add('video-reveal-card');
  const tools=element('div','production-tools revealed-tools'),list=element('ul','tool-list');
  (details.tools||[]).filter(id=>productionTools[id]).forEach(id=>{
    const li=element('li','tool-chip'),img=element('img');img.src='logos/tools/'+(id==='final-cut-pro-x'?'final-cut-pro':id)+'.png';img.alt=productionTools[id];img.width=32;img.height=32;li.append(img);list.append(li);
  });
  if(list.childElementCount){tools.setAttribute('aria-label','Made with');tools.append(list);card.append(tools);}
}
function renderBrands(){
  brandFilters.replaceChildren();brandFilters.hidden=state.collection!=='collaborations';
  if(brandFilters.hidden)return;
  const make=(id,name,logo,dark=false)=>{const b=element('button','brand-filter'+(dark?' dark-logo':''));b.type='button';b.dataset.brand=id;b.setAttribute('aria-pressed',String(state.brand===id));
    if(logo){const img=element('img');img.src=logo;img.alt='';b.appendChild(img);}b.appendChild(element('span','',name));
    b.addEventListener('click',()=>{state.brand=id;state.format='all';state.platform='all';render();syncURL();Array.from(brandFilters.querySelectorAll('button')).find(button=>button.dataset.brand===id)?.focus();});brandFilters.appendChild(b);};
  make('','All brands');partners.forEach(p=>make(p.id,p.name,p.logo,p.dark));
}
function showEmpty(){
  empty.replaceChildren();const brand=partners.find(p=>p.id===state.brand);
  if(state.collection==='carousels'&&state.format==='all'&&state.platform==='all'){
    empty.append(element('p','eyebrow','INSTAGRAM / PHOTO STORIES'),element('h3','','The latest, on Instagram.'),element('p','','Explore my recent photo stories and carousel edits on @eunheelim_.'));
    empty.append(channel('Explore Instagram ↗','https://www.instagram.com/eunheelim_/'));
  }else if(brand&&!model.filter(items,{collection:'collaborations',brand:brand.id}).length){
    if(brand.logo){const img=element('img','empty-brand-logo'+(brand.dark?' dark-logo':''));img.src=brand.logo;img.alt=brand.name;empty.appendChild(img);}
    empty.append(element('h3','',brand.name+' × Eun Hee'),element('p','','More from this collaboration is available through my channels or by getting in touch.'));
    const links=element('div','empty-links');links.append(channel('Instagram ↗','https://www.instagram.com/eunheelim_/'),channel('Dwell on Jen ↗','https://www.youtube.com/@dwellonjen'),channel('Get in touch ↗','mailto:jenlimeh@gmail.com'));empty.appendChild(links);
  }else{empty.append(element('h3','','No previews match these filters.'),element('p','','Try another format or platform to keep exploring.'));}
  const reset=element('button','btn btn-light','Explore APR work');reset.type='button';reset.addEventListener('click',()=>{state=model.normalize();render();syncURL();filters.querySelector('button').focus();});empty.appendChild(reset);
}
function render(){
  resetInline();
  state=model.normalize(state);gallery.replaceChildren();gallery.classList.remove("brand-browser-host");triggers.clear();
  document.querySelector('.gallery-selectors').hidden=['collaborations','reels','personal','apr'].includes(state.collection);
  const channelCollection=['carousels','reels','personal'].includes(state.collection);
  if(channelCollection)state.platform='all';
  platform.closest('label').hidden=channelCollection;
  const selected=model.filter(items,state),copy=descriptions[state.collection];
  document.getElementById('collection-title').classList.toggle('brand-collection-title',state.collection==='collaborations');document.getElementById('collection-title').textContent=copy[0];document.getElementById('collection-description').textContent=copy[1];
  format.value=state.format;platform.value=state.platform;
  filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.collection===state.collection)));
  if(state.collection==='collaborations'){
    brandFilters.replaceChildren();brandFilters.hidden=true;empty.hidden=true;gallery.classList.add('brand-browser-host');
    window.BrandBrowser.mount(gallery,{items,partners,brand:state.brand,onOpen:(item,button)=>openWork(item,button),onBrand:brand=>{state.brand=brand;if(!dialog.open)syncURL();},onCard:(item,button)=>{triggers.set(item.id,button);decorateVideoCard(item,button);}});
    count.textContent=items.filter(item=>(item.collections||[]).includes('collaborations')).length+' creatives · '+partners.length+' brands';
    return;
  }
  if(['reels','personal','apr'].includes(state.collection)){
    brandFilters.replaceChildren();brandFilters.hidden=true;empty.hidden=true;gallery.classList.add('brand-browser-host');
    const groups=state.collection==='personal'?['youtube-london','youtube-korea','youtube-camino'].map(id=>items.find(item=>item.id===id)):model.filter(items,{collection:state.collection});
    const entryList=group=>{
      const videos=model.videoSources(group).map(video=>({...video,id:group.id+'--'+video.id,partner:group.id,image:video.poster,imageWidth:video.width,imageHeight:video.height,video:video.src,coverFit:'contain',parent:group,variant:video.id}));
      const images=[...(group.carousels||[]),...(group.imageSets||[])].map(entry=>({...entry,id:group.id+'--'+entry.id,partner:group.id,coverFit:'contain',parent:group,variant:entry.id}));
      const entries=[...videos,...images];
      if(group.creativeOrder){const rank=entry=>{const groupId=group.videoGroups?.find(g=>g.variants.includes(entry.variant))?.id;const index=group.creativeOrder.indexOf(groupId||entry.variant);return index<0?Infinity:index;};entries.sort((a,b)=>rank(a)-rank(b));}
      return entries;
    };
    const open=(entry,button)=>openWork(entry.parent,button,entry.variant);
    const register=(entry,button)=>{decorateVideoCard(entry.parent,button,entry.variant);if(!triggers.has(entry.parent.id))triggers.set(entry.parent.id,button);};
    if(state.collection==='reels'){
      window.BrandBrowser.mount(gallery,{entries:groups.flatMap(entryList),partners:groups.map(group=>({id:group.id,name:group.title})),onOpen:open,onCard:register,label:'Instagram Reels'});
    }else groups.forEach(group=>{
      const section=element('section','video-series-row');section.setAttribute('aria-labelledby','row-'+group.id);const heading=element('h3','video-series-heading',group.title);heading.id='row-'+group.id;section.append(heading);gallery.append(section);
      window.BrandBrowser.mount(section,{entries:entryList(group),partners:[{id:group.id,name:group.title}],hideTabs:true,landscape:state.collection==='personal',onOpen:open,onCard:register,label:group.title});
    });
    count.textContent=groups.reduce((total,group)=>total+entryList(group).length,0)+(state.collection==='apr'?' creatives':' videos');
    return;
  }
  renderBrands();
  selected.forEach((item,index)=>{
    const card=element('article','work-card'),media=element('button','work-card-media'),filebar=element('div','card-filebar');
    filebar.setAttribute('aria-hidden','true');filebar.append(element('span','',item.id+(canPlay(item)?'.video':item.medium==='carousel'?'.carousel':'.preview')),element('span','',String(index+1).padStart(2,'0')));
    const videoCount=model.videoSources(item).length;
    const groupedCount=(item.videoGroups||[]).reduce((count,group)=>count+group.variants.length,0),creativeCount=(item.carousels?.length||0)+(item.imageSets?.length||0)+videoCount-groupedCount+(item.videoGroups?.length||0);
    const stillCount=item.stills?.length||0,previewCount=item.stills?.filter(still=>still.preview).length||0;
    const mediaLabel=videoCount+' videos'+(stillCount?' + '+stillCount+(previewCount===stillCount?' preview':' image')+(stillCount===1?'':'s'):'');
    const action=item.linkedClips?.length?'Explore '+item.linkedClips.length+' clips':item.unifiedChoices?'Explore '+creativeCount+' creatives':item.carousels?.length?'Explore '+item.carousels.length+' carousels'+(videoCount||item.imageSets?.length?' + related work':''):canPlay(item)?videoCount>1?'Explore '+mediaLabel:'Play video':stillCount>1?'Explore '+stillCount+' Reel previews':item.slides?.length?'View '+item.slides.length+' images':'View creative';
    media.type='button';media.setAttribute('aria-label',action+': '+item.title);
    const img=element('img');img.src=item.image;img.alt='';img.loading='lazy';
    const size=item.imageWidth>0&&item.imageHeight>0?{width:item.imageWidth,height:item.imageHeight}:window.WorkThumbnails.prepare(img,item.thumbnailId||item.id)||{width:456,height:564};
    const space=element('span','thumbnail-space'),frame=element('span','thumbnail-frame'+(size.width>size.height?' landscape':''));
    frame.style.aspectRatio=size.width+' / '+size.height;frame.appendChild(img);space.appendChild(frame);
    if(item.coverImages?.length){
      const mosaic=element('span','thumbnail-mosaic');
      if(item.coverStyle==='overlap'){mosaic.classList.add('overlap-covers');mosaic.dataset.coverCount=String(item.coverImages.length);}
      const columns=item.coverImages.length===3||item.coverImages.length>4?3:2;
      mosaic.style.setProperty('--cover-columns',String(columns));
      mosaic.style.setProperty('--cover-rows',String(Math.ceil(item.coverImages.length/columns)));
      item.coverImages.forEach(cover=>{const tile=element('span','thumbnail-mosaic-tile'),photo=element('img');photo.src=cover.src;photo.alt=cover.alt||'';photo.loading='lazy';if(cover.width&&cover.height){photo.width=cover.width;photo.height=cover.height;}tile.appendChild(photo);mosaic.appendChild(tile);});
      space.replaceChildren(mosaic);space.classList.add('has-mosaic');
    }
    const badge=element('span','video-mark'+(canPlay(item)?' play':''),canPlay(item)?videoCount>1?'▶ '+mediaLabel:'▶ Play video':item.slides?.length?item.slides.length+' images':item.medium==='image'?'Image creative':'Creative preview');
    if(item.linkedClips?.length)badge.textContent=item.linkedClips.length+' clips ↗';
    else if(item.unifiedChoices)badge.textContent=creativeCount+' creatives';
    else if(item.carousels?.length)badge.textContent=item.carousels.length+' carousels';
    else if(!videoCount&&previewCount>1)badge.textContent=previewCount+' Reel previews';
    media.append(space,badge);media.addEventListener('click',()=>openWork(item,media));
    const body=element('div','work-card-body'),badges=element('p','card-platform');
    if(item.platform&&!channelCollection)badges.appendChild(element('span','platform-badge',item.platform));
    badges.hidden=!badges.childElementCount;
    body.append(element('p','card-brand',item.brand),element('h3','',item.title),badges,element('p','card-theme',item.theme));
    if(item.metric)body.appendChild(element('p','card-metric',item.metric));
    if(item.resultLinks?.length){
      const results=element('div','card-results');results.appendChild(element('p','card-results-label','Selected results'));
      item.resultLinks.forEach(result=>{
        const variant=model.mediaSources(item).find(part=>part.id===result.variant);if(!variant)return;
        const link=element('button','card-result');link.type='button';
        link.append(element('strong','',result.value),element('span','',result.scope),element('span','result-action','View creative & result ↗'));
        if(result.detail)link.insertBefore(element('span','result-conversion',result.detail),link.lastChild);
        link.addEventListener('click',()=>openWork(item,link,variant.id));results.appendChild(link);
      });body.appendChild(results);
    }
    const button=element('button','card-action');button.type='button';button.append(element('span','',action),element('span','','↗'));button.addEventListener('click',()=>openWork(item,button));body.appendChild(button);card.append(filebar,media,body);gallery.appendChild(card);triggers.set(item.id,media);
  });
  count.textContent=selected.length+' creative'+(selected.length===1?'':'s')+(state.brand?' · '+(partners.find(p=>p.id===state.brand)?.name||state.brand):'');
  empty.hidden=selected.length>0;if(!selected.length)showEmpty();
}
filters.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state=model.normalize({collection:b.dataset.collection});render();syncURL();}));
format.addEventListener('change',()=>{state.format=format.value;render();syncURL();});platform.addEventListener('change',()=>{state.platform=platform.value;render();syncURL();});
function readURL(){
  const q=new URLSearchParams(location.search),legacy=q.get('filter');
  let next={collection:q.get('collection'),format:q.get('format'),platform:q.get('platform'),brand:q.get('brand')||''};
  if(!q.has('collection')&&legacy){if(legacy==='brand')next.collection='collaborations';else if(legacy==='instagram')next.platform='Instagram';else if(legacy==='youtube')next.platform='YouTube';else if(legacy==='shortform')next.platform='TikTok';}
  if(next.brand){next.collection='collaborations';if(!partners.some(p=>p.id===next.brand))next.brand='';}
  state=model.normalize(next);return q.get('work');
}
if(items.length){
  filters.hidden=false;document.querySelector('.gallery-selectors').hidden=false;
  const workId=readURL();render();
  if(workId){const resolved=model.resolveWork(items,workId,new URLSearchParams(location.search).get('variant'));if(resolved){const {item,variant}=resolved;if(!triggers.has(item.id)){state=model.normalize({collection:item.collections[0]});render();}openWork(item,triggers.get(item.id),variant);}}
}else{count.textContent='The gallery could not load. Please refresh or explore the channels below.';}
window.addEventListener('popstate',()=>{if(dialog.open){skipCloseSync=true;dialog.close();}readURL();render();});
})();

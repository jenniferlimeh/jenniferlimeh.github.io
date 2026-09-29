/* Shared, DOM-free collection rules. A piece can belong to multiple collections. */
(function(root){
  'use strict';
  const collections=['apr','collaborations','carousels','personal','reels'];
  const formats=['all','video','image','carousel'];
  const platforms=['all','Instagram','YouTube','Paid social','Meta Ads','Snapchat Ads','TikTok','NAVER Clip'];
  function normalize(input={}){
    return {collection:collections.includes(input.collection)?input.collection:'apr',format:formats.includes(input.format)?input.format:'all',platform:platforms.includes(input.platform)?input.platform:'all',brand:typeof input.brand==='string'?input.brand:''};
  }
  function filter(items,input){
    const state=normalize(input);
    const selected=items.filter(item=>(state.collection==='all'||(item.collections||[]).includes(state.collection))&&filterParts(item).some(part=>matchesPart(part,state))&&(!state.brand||item.partner===state.brand));
    if(state.collection==='all')selected.sort((a,b)=>(a.allWorkOrder??Number.MAX_SAFE_INTEGER)-(b.allWorkOrder??Number.MAX_SAFE_INTEGER));
    if(state.collection==='apr')selected.sort((a,b)=>(a.aprOrder??Number.MAX_SAFE_INTEGER)-(b.aprOrder??Number.MAX_SAFE_INTEGER));
    if(state.collection==='reels')selected.sort((a,b)=>(a.reelsOrder??Number.MAX_SAFE_INTEGER)-(b.reelsOrder??Number.MAX_SAFE_INTEGER));
    selected.sort((a,b)=>Number(Boolean(a.galleryLast))-Number(Boolean(b.galleryLast)));
    return selected;
  }
  function videoSources(item){
    const videos=Array.isArray(item.videos)?item.videos.filter(video=>video&&((typeof video.src==='string'&&video.src)||(typeof video.youtube==='string'&&/^[\w-]{11}$/.test(video.youtube)))):[];
    if(videos.length)return videos;
    return item.video?[{id:item.id,title:item.title,src:item.video,poster:item.image,width:item.videoWidth||item.imageWidth,height:item.videoHeight||item.imageHeight}]:[];
  }
  function videoDetails(item,video){
    const details={};
    for(const key of ['role','description','metric','process','languageContext','tools','conversionValue'])details[key]=Object.prototype.hasOwnProperty.call(video,key)?video[key]:item[key];
    return details;
  }
  function mediaSources(item){return [...videoSources(item),...(item.stills||[])];}
  function filterParts(item){
    const parts=[...(item.carousels||[]),...(item.imageSets||[]),...videoSources(item).map(video=>({...video,medium:'video',platform:video.platform??item.platform})),...(item.stills||[]).map(still=>({...still,medium:still.preview?'video':'image',platform:still.platform??item.platform}))];
    return parts.length?parts:[item];
  }
  function platformNames(item){return item.platforms?.length?item.platforms:item.platform?[item.platform]:[];}
  function matchesPart(part,state){
    const names=platformNames(part);
    return (state.format==='all'||part.medium===state.format)&&(state.platform==='all'||names.includes(state.platform)||(state.platform==='Paid social'&&names.some(name=>['Paid social','Meta Ads','Snapchat Ads'].includes(name))));
  }
  function resolveWork(items,id,variant){
    const item=items.find(item=>item.id===id||item.legacyLinks?.some(link=>link.id===id));
    if(!item)return null;
    return {item,variant:variant||item.legacyLinks?.find(link=>link.id===id)?.variant};
  }
  function canPlay(item){return item.medium==='video'&&Boolean(item.youtube||videoSources(item).length||item.instagram);}
  function slideIndex(current,delta,length){return length?Math.max(0,Math.min(length-1,current+delta)):0;}
  const api={normalize,filter,canPlay,slideIndex,videoSources,videoDetails,mediaSources,resolveWork,filterParts,matchesPart,platformNames};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WorkGalleryModel=api;
})(typeof window!=='undefined'?window:globalThis);

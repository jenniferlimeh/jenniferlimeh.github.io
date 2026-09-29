/* Clip the original portfolio stills to their photo edges, preserving the full creative. */
(() => {
  'use strict';
  const shapes = {
    'kiehls-routine': [459,564,[[0,0,312,563,14],[243,140,207,370,10]]],
    'apr-story': [456,564,[[1,1,452,560,58]]],
    'birthday': [453,258,[[1,1,449,255,53]]],
    'apr-explainer': [459,564,[[1,1,455,560,58]]],
    'kiehls-everyday': [450,564,[[0,0,317,562,13],[242,139,208,372,9]]],
    'kiehls-floral': [462,564,[[5,0,317,564,13],[253,140,207,372,10]]],
    'apr-myth': [459,561,[[1,1,455,558,58]]],
    'apr-routine': [459,561,[[1,1,455,558,58]]],
    'apr-review': [456,564,[[1,1,451,560,58]]],
    'apr-promo': [465,561,[[1,1,463,559,18]]],
    'hanbok': [468,528,[[0,1,313,526,12],[259,93,208,373,12]]],
    'english-cafe': [453,528,[[0,1,314,526,14],[241,96,205,373,12]]],
    'mongolia': [459,528,[[0,1,312,524,10],[240,97,205,372,12]]],
    'tiktok-room': [399,516,[[0,1,389,513,58]]],
    'edinburgh': [453,258,[[1,1,450,254,53]]],
    'english-youtube': [456,258,[[1,1,450,255,53]]]
  };
  const ns='http://www.w3.org/2000/svg';
  let defs;
  function prepare(image,id) {
    const shape=shapes[id];
    if(!shape)return;
    const [width,height,rects]=shape,clipId='photo-edge-'+id;
    if(!defs){
      const svg=document.createElementNS(ns,'svg');
      svg.setAttribute('class','thumbnail-definitions');svg.setAttribute('width','0');svg.setAttribute('height','0');
      svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
      defs=document.createElementNS(ns,'defs');svg.appendChild(defs);document.body.appendChild(svg);
    }
    if(!document.getElementById(clipId)){
      const clip=document.createElementNS(ns,'clipPath');clip.id=clipId;clip.setAttribute('clipPathUnits','objectBoundingBox');
      rects.forEach(([x,y,w,h,r])=>{
        const rect=document.createElementNS(ns,'rect');
        for(const [key,value] of Object.entries({x:x/width,y:y/height,width:w/width,height:h/height,rx:r/width,ry:r/height}))rect.setAttribute(key,String(value));
        clip.appendChild(rect);
      });
      defs.appendChild(clip);
    }
    image.width=width;image.height=height;image.style.clipPath='url(#'+clipId+')';
    return {width,height};
  }
  window.WorkThumbnails={prepare};
  document.querySelectorAll('img[data-thumbnail]').forEach(image=>prepare(image,image.dataset.thumbnail));
})();

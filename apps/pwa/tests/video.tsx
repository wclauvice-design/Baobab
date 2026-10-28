import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductVideo } from '../src/components/ProductVideo';
import { videoPoster } from '../src/lib/media';
import { BrowserRouter } from 'react-router-dom';
import { ImageSwipeGallery } from '../src/components/ImageSwipeGallery';
import '../src/index.css';

const actualPlay = HTMLMediaElement.prototype.play;
let block = true;
HTMLMediaElement.prototype.play = function () {
  if (block) return Promise.reject(new DOMException('Test: autoplay refused', 'NotAllowedError'));
  return actualPlay.call(this);
};
function Test() {
  const [src, setSrc] = useState('/tests/sample.mp4');
  const [active, setActive] = useState(true);
  const [result, setResult] = useState('Ready');
  const [gallery, setGallery] = useState(false);
  const photo='/photos/telephone.jpg';
  const check=()=>{
    const detail=document.querySelector('#detail .product-video')!;
    const card=document.querySelector('#card .product-video')!;
    const checks={
      'poster despite blocked autoplay': !!detail.querySelector('img'),
      'manual play available': !!detail.querySelector('.product-video-play'),
      'inline muted playback': !!detail.querySelector('video[playsinline]') && (detail.querySelector('video') as HTMLVideoElement).muted,
      'no nested card button': !card.querySelector('button'),
      'card has a product photo': !!card.querySelector('img'),
      'video excluded from posters': videoPoster(['a.mp4',photo])===photo,
      'video-only fallback': videoPoster(['a.webm'])==='/photos/placeholder.svg',
      'no horizontal overflow': document.documentElement.scrollWidth<=innerWidth,
    };
    setResult(JSON.stringify(checks,null,2));
  };
  return <main style={{maxWidth:600,margin:'auto',fontFamily:'sans-serif'}}>
    <h1>Video regression checks</h1>
    <button onClick={check}>Check blocked autoplay</button>
    <button onClick={()=>{block=false;setResult('Playback allowed. Use the video play button.');}}>Allow playback</button>
    <button onClick={()=>setSrc('/tests/missing-video.mp4')}>Simulate missing video</button>
    <button onClick={()=>setActive(!active)}>Toggle active</button>
    <button onClick={()=>setGallery(!gallery)}>Toggle gallery</button>
    <pre style={{whiteSpace:'pre-wrap'}}>{result}</pre>
    <div id="detail" style={{height:300}}><ProductVideo src={src} poster={photo} label="Test product" active={active}/></div>
    <a id="card" href="#detail" style={{display:'block',height:150,width:150,marginTop:20}}><ProductVideo src="/tests/sample.mp4" poster={photo} label="Card" preview/></a>
    {gallery && <section id="gallery" style={{marginTop:30,padding:16}}><ImageSwipeGallery title="Gallery test" images={['/tests/sample.mp4',photo,'/tests/sample.mp4?second']} /></section>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Test/></BrowserRouter>);

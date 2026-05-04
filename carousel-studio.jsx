import { useState, useRef, useEffect, useCallback } from "react";

const injectFonts = () => {
  if (document.getElementById("cai-gf")) return;
  const l = document.createElement("link");
  l.id = "cai-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
  document.head.appendChild(l);
};

const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

// Each template: bg, text, accent, font + layout = unique visual structure
const TEMPLATES = {
  // 1. MINIMAL — clean white, hairline rule, uppercase spaced title
  Minimal: {
    bg:"#ffffff", text:"#111111", accent:"#111111", font:"'DM Sans',sans-serif",
    layout:"minimal", label:"Minimal",
  },
  // 2. SERT (BOLD) — pure black, full-bleed left bar, heavy condensed
  Bold: {
    bg:"#0a0a0a", text:"#ffffff", accent:"#ff2d2d", font:"'Arial Black',sans-serif",
    layout:"bold", label:"Bold",
  },
  // 3. SPORTİF — dark navy, diagonal cut accent, tight tracking
  Sport: {
    bg:"#0d1b2a", text:"#ffffff", accent:"#00e5ff", font:"'Arial',sans-serif",
    layout:"sport", label:"Sport",
  },
  // 4. DELUX — deep black-gold, double frame, centered serif
  Luxury: {
    bg:"#0c0a06", text:"#e8d5a0", accent:"#c9a84c", font:"'Georgia',serif",
    layout:"luxury", label:"Luxury",
  },
  // 5. SADE — off-white, zero decoration, generous space
  Clean: {
    bg:"#f7f5f2", text:"#1a1a1a", accent:"#888888", font:"'Georgia',serif",
    layout:"clean", label:"Clean",
  },
  Rose: {
    bg:"linear-gradient(145deg,#fdf0f0 0%,#f9e0e5 100%)", text:"#3d1a24", accent:"#c4687a", font:"'Georgia',serif",
    layout:"rose", label:"Rose",
  },
  // 6. EDİTORYAL — newspaper grid, large issue number, column feel
  Editorial: {
    bg:"#faf8f3", text:"#1c1c1c", accent:"#1c1c1c", font:"'Georgia',serif",
    layout:"editorial", label:"Editorial",
  },
  // 7. NEON CLUB — black + electric glow line, chunky sans
  Neon: {
    bg:"#080808", text:"#ffffff", accent:"#b9ff4a", font:"'Arial Black',sans-serif",
    layout:"neon", label:"Neon",
  },
  // 8. RETRO — cream, bold rule top+bottom, vintage sans
  Retro: {
    bg:"#f0e8d0", text:"#2a1f0e", accent:"#c0392b", font:"'Georgia',serif",
    layout:"retro", label:"Retro",
  },
  // 9. SİNEMA — cinematic black bars, subtitle feel, wide tracking
  Cinema: {
    bg:"#000000", text:"#f0f0f0", accent:"#f0c040", font:"'Georgia',serif",
    layout:"cinema", label:"Cinema",
  },
  // 10. TECH — dark grid, monospace, terminal bracket style
  Tech: {
    bg:"#0d1117", text:"#c9d1d9", accent:"#58a6ff", font:"'Courier New',monospace",
    layout:"tech", label:"Tech",
  },
};
const TEMPLATE_NAMES = Object.keys(TEMPLATES);

const HOOK_STYLES  = ["Bold Claim","Question","Data/Stat","Contrast"];
const SLIDE_COUNTS = [6,8,10];
const BG_MODES     = ["Template","Single Picture","Per-Slide Picture"];
const FONT_STYLES  = ["Template","Modern","Serif","Display","Mono"];
const ALIGNMENTS   = ["Left","Center","Right"];
const POSITIONS    = ["Middle","Top","Bottom"];
const CATEGORIES   = ["Mindset","Wellness","Nutrition","Fitness","Philosophy","Business","Other"];

const SYSTEM_PROMPT = `You are a world-class viral content strategist creating highly addictive Instagram carousel posts using psychology, storytelling, and curiosity loops.
Every carousel must feel like a story unfolding. Use curiosity gaps, emotional triggers, and open loops to keep readers swiping.

SLIDE ROLES: HOOK(1=bold/shocking 5-10 words), RE-HOOK(2=tease without answer), PAIN(3=relatable situation), INSIGHT(middle=1 idea each), AHA(2nd-last=save-worthy revelation), ACTION(last-1=practical steps), CTA(last=engagement trigger)

PSYCHOLOGICAL TRIGGERS: Curiosity gap · Pattern interrupt · Social proof tone · FOMO · Contrarian ideas · Fast rewards

WRITING: Short sharp sentences. No fluff. Conversational slightly dramatic. ONE person. Every headline creates momentum.

RESPOND ONLY WITH VALID JSON — no markdown, no backticks.`;

const buildPrompt = (topic, category, hookStyle, slideCount, language) => {
  const hookDesc = { "Bold Claim":"controversial bold statement nobody says out loud", "Question":"powerful question creating discomfort or FOMO", "Data/Stat":"shocking statistic breaking expectations", "Contrast":"opposite of conventional wisdom" }[hookStyle] || "pattern-interrupting opener";
  const labels = ["HOOK","RE-HOOK","PAIN",...Array(Math.max(0,slideCount-5)).fill("INSIGHT"),"AHA","ACTION","CTA"];
  const slideList = labels.slice(0,slideCount).map((l,i)=>`slide_${i+1}(${l})`).join(", ");
  const isBilingual = language==="TR+EN";

  const slideSchema = isBilingual
    ? `{"label":"HOOK","headline_tr":"Türkçe başlık","headline_en":"English headline","body_tr":"Türkçe açıklama","body_en":"English body"}`
    : `{"label":"HOOK","headline":"...","body":"..."}`;

  const langInstruction = language==="TR"
    ? "Write ALL slide text in Turkish."
    : language==="EN"
    ? "Write ALL slide text in English."
    : `Write BILINGUAL slides. Each slide must have:
- headline_tr: Turkish headline (5-12 words, same meaning)
- headline_en: English headline (5-12 words, same meaning)
- body_tr: Turkish body (1-2 sentences)
- body_en: English body (1-2 sentences)
The Turkish and English versions must convey the EXACT SAME message — not different content, just the same text in both languages.`;

  return `Topic: "${topic}" | Category: ${category} | Hook: ${hookStyle} (${hookDesc}) | Slides: ${slideCount}
Needed slides: ${slideList}

${langInstruction}

Rules: headline=5-12 punchy words, body=1-2 short sentences. NEVER include label names or slide numbers in text.
Also: 3 caption versions each with turkish+english, and a music vibe sentence.

CAPTION RULES (critical):
- Each caption must be EDITORIAL and SEO-optimized — not generic, written like a real Instagram pro
- Naturally weave 4-6 relevant hashtags INSIDE the caption body as #keyword within sentences, not at the end
- Do NOT put hashtags as a separate block — embed them organically mid-sentence or at natural pause points
- Use strategic keywords that boost discoverability (niche + broad mix)
- Tone: conversational but authoritative — like a thought leader, not a brand
- Each style must feel distinctly different:
  * "Curiosity Hook": opens with a provocative question or surprising statement, makes reader stop scrolling
  * "Story-Driven": starts with "I" or a mini personal story beat, vulnerability, then insight
  * "Bold CTA": opens with a direct command or bold claim, urgency, clear action at the end
- bilingual: Turkish paragraph first, then English paragraph — same message, both with embedded hashtags

JSON only — no markdown, no backticks:
{"slides":[${slideSchema},...],
"captions":[
  {"style":"Curiosity Hook",
   "turkish":{"text":"Full Turkish caption with #hashtags naturally embedded mid-sentence. Keep writing, weave #morekeywords as you go. End strong."},
   "english":{"text":"Full English caption with #hashtags embedded organically. Strategic #keywords appear naturally. Compelling close."},
   "bilingual":{"text":"Turkish paragraph with embedded #hashtags.\n\nEnglish paragraph with embedded #hashtags."}},
  {"style":"Story-Driven",
   "turkish":{"text":"..."},"english":{"text":"..."},"bilingual":{"text":"..."}},
  {"style":"Bold CTA",
   "turkish":{"text":"..."},"english":{"text":"..."},"bilingual":{"text":"..."}}
],
"musicVibe":"..."}`;
};

// ─── SLIDE CANVAS ─────────────────────────────────────────────────────────────
function SlideCanvas({ slide, templateName, bgMode, singlePhoto, perSlidePhotos,
  overlayOn, overlayIntensity, fontStyle, fontSize, lineHeight=50, alignment, position,
  showHandle, showNumber, handle, index, total, scale=1 }) {

  const t = TEMPLATES[templateName] || TEMPLATES.Minimal;
  const layout = t.layout || "minimal";
  const fontMap = { Template:t.font, Modern:"'DM Sans',sans-serif", Serif:"'Georgia',serif", Display:"'Arial Black',sans-serif", Mono:"'Courier New',monospace" };
  const ff = fontMap[fontStyle] || t.font;

  // Font sizes — 50% = Instagram-appropriate (~72px title at 1080px)
  const titleBase = 40 + (fontSize/100)*68;
  const bodyBase  = 22 + (fontSize/100)*32;
  const titleSz = titleBase * scale;
  const bodySz  = bodyBase  * scale;
  // lineHeight: 0%=1.0 (tight), 50%=1.5 (normal), 100%=2.2 (loose)
  const lh = 1.0 + (lineHeight/100)*1.2;
  const lhBody = lh * 1.05; // body slightly looser than title

  const ta  = alignment==="Left" ? "left" : alignment==="Right" ? "right" : "center";
  const ai  = alignment==="Left" ? "flex-start" : alignment==="Right" ? "flex-end" : "center";
  const padL = alignment==="Left" ? 80*scale : 60*scale;
  const padR = alignment==="Right" ? 80*scale : 60*scale;
  const posStyle = position==="Top"
    ? {justifyContent:"flex-start", paddingTop:100*scale, paddingBottom:60*scale, paddingLeft:padL, paddingRight:padR}
    : position==="Bottom"
    ? {justifyContent:"flex-end",   paddingBottom:100*scale, paddingTop:60*scale, paddingLeft:padL, paddingRight:padR}
    : {justifyContent:"center",     paddingTop:60*scale, paddingBottom:60*scale, paddingLeft:padL, paddingRight:padR};

  const bgImg = bgMode==="Per-Slide Picture" ? (perSlidePhotos?.[index]??perSlidePhotos?.[String(index)]??null)
              : bgMode==="Single Picture"     ? (singlePhoto||null) : null;
  const bgStyle = bgImg
    ? {backgroundImage:`url(${bgImg})`,backgroundSize:"cover",backgroundPosition:"center"}
    : {background:t.bg};
  const olAlpha = overlayOn ? overlayIntensity/100 : 0;

  // ── Shared: headline + body text renderer ──────────────────
  // Overlay vertical padding scales with lineHeight so it always wraps text tightly
  const olPadV = (10 + lineHeight*0.12) * scale;
  const olPadH = 20 * scale;

  const renderText = (titleColor, bodyColor, titleWeight=800, gap=10*scale) => (
    <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
      {olAlpha>0 && (
        <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,
          backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:8*scale,zIndex:0}} />
      )}
      {slide?.headline_tr ? (
        <>
          <div style={{position:"relative",zIndex:1,color:titleColor,fontSize:titleSz,fontFamily:ff,fontWeight:titleWeight,lineHeight:lh,textAlign:ta,marginBottom:5*scale,letterSpacing:"-0.01em"}}>
            {slide.headline_tr}
          </div>
          <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.72,fontFamily:ff,fontWeight:600,lineHeight:lh,textAlign:ta,marginBottom:gap,letterSpacing:"-0.005em",opacity:0.85}}>
            {slide.headline_en}
          </div>
          {slide.body_tr && <div style={{position:"relative",zIndex:1,color:bodyColor,fontSize:bodySz,fontFamily:ff,fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.9,maxWidth:820*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
          {slide.body_en && <div style={{position:"relative",zIndex:1,color:bodyColor,fontSize:bodySz*0.88,fontFamily:ff,fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.55,maxWidth:820*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
        </>
      ) : (
        <>
          <div style={{position:"relative",zIndex:1,color:titleColor,fontSize:titleSz,fontFamily:ff,fontWeight:titleWeight,lineHeight:lh,textAlign:ta,marginBottom:gap,letterSpacing:"-0.01em"}}>
            {slide?.headline||"Headline"}
          </div>
          {slide?.body && <div style={{position:"relative",zIndex:1,color:bodyColor,fontSize:bodySz,fontFamily:ff,fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.85,maxWidth:820*scale}}>{slide.body}</div>}
        </>
      )}
    </div>
  );

  const W = 1080*scale;
  const H = 1080*scale;

  // ── HANDLE & SLIDE NUMBER (shared across all layouts) ──────
  // Handle & number: always visible — white text + dark shadow works on any background
  const handleEl = showHandle && handle
    ? <div style={{position:"absolute",bottom:24*scale,left:32*scale,zIndex:20,
        color:"#ffffff",fontSize:Math.max(8,12*scale),fontFamily:"'DM Sans',sans-serif",
        fontWeight:600,letterSpacing:"0.04em",
        textShadow:`0 1px ${4*scale}px rgba(0,0,0,0.8),0 0 ${8*scale}px rgba(0,0,0,0.6)`}}>
        @{handle.replace(/^@/,"")}
      </div>
    : null;
  const numEl = showNumber
    ? <div style={{position:"absolute",bottom:24*scale,right:32*scale,zIndex:20,
        color:"#ffffff",fontSize:Math.max(8,12*scale),fontFamily:"'DM Sans',sans-serif",
        fontWeight:500,
        textShadow:`0 1px ${4*scale}px rgba(0,0,0,0.8),0 0 ${8*scale}px rgba(0,0,0,0.6)`}}>
        {index+1}/{total}
      </div>
    : null;

  // ══════════════════════════════════════════════════════════════
  // LAYOUT RENDERERS
  // ══════════════════════════════════════════════════════════════

  // 1. MINIMAL — white, single hairline below title, lots of space
  if (layout==="minimal") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Top hairline */}
      <div style={{position:"absolute",top:52*scale,left:60*scale,right:60*scale,height:1*scale,backgroundColor:t.accent,zIndex:2,opacity:0.5}} />
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {/* Slide number as top label - only if showNumber */}
        {showNumber && (
          <div style={{fontSize:10*scale,letterSpacing:"0.25em",textTransform:"uppercase",color:t.accent,marginBottom:18*scale,fontFamily:ff,fontWeight:500,opacity:0.7}}>
            {index+1} / {total}
          </div>
        )}
        {renderText(t.text, t.text, 300, 14*scale)}
      </div>
      {/* Bottom hairline */}
      <div style={{position:"absolute",bottom:52*scale,left:60*scale,right:60*scale,height:1*scale,backgroundColor:t.accent,zIndex:2,opacity:0.5}} />
      {handleEl}{numEl}
    </div>
  );

  // 2. SERT (BOLD) — black, thick left vertical red bar, left-aligned giant text
  if (layout==="bold") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Thick left bar */}
      <div style={{position:"absolute",top:0,left:0,width:14*scale,height:"100%",backgroundColor:t.accent,zIndex:2}} />
      {/* Content — force left align regardless of alignment setting */}
      <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle,paddingLeft:alignment==="Left"?50*scale:posStyle.paddingLeft,paddingRight:alignment==="Right"?50*scale:posStyle.paddingRight}}>
        <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz*1.05,fontFamily:ff,fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:4*scale,textTransform:"uppercase",letterSpacing:"-0.02em"}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.65,fontFamily:ff,fontWeight:700,lineHeight:lh,textAlign:ta,marginBottom:16*scale,letterSpacing:"-0.01em"}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,opacity:0.75,maxWidth:820*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz*0.85,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,opacity:0.4,maxWidth:820*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz*1.05,fontFamily:ff,fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:14*scale,textTransform:"uppercase",letterSpacing:"-0.02em"}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,opacity:0.75}}>{slide.body}</div>}
            </>
          )}
        </div>
      </div>
      {/* Slide number top-right */}
      {showNumber && <div style={{position:"absolute",top:30*scale,right:30*scale,zIndex:4,color:t.accent,fontSize:11*scale,fontFamily:"'Courier New',monospace",opacity:0.5}}>{String(index+1).padStart(2,"0")}</div>}
      {handleEl}{numEl}
    </div>
  );

  // 3. SPORTİF — diagonal accent slash, tight tracking, athletic
  if (layout==="sport") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Diagonal top-left accent */}
      <div style={{position:"absolute",top:0,left:0,width:"100%",height:8*scale,background:`linear-gradient(90deg,${t.accent} 0%,transparent 70%)`,zIndex:2}} />
      {/* Bold corner number */}
      <div style={{position:"absolute",top:24*scale,right:30*scale,zIndex:3,color:t.accent,fontSize:48*scale,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:1,opacity:0.18,letterSpacing:"-0.04em"}}>{index+1}</div>
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:4,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {/* Accent tag */}
        <div style={{fontSize:9*scale,letterSpacing:"0.3em",textTransform:"uppercase",color:t.accent,marginBottom:12*scale,fontFamily:"'Arial',sans-serif",fontWeight:700}}>
          ● SLIDE {index+1}
        </div>
        <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:"#ffffff",fontSize:titleSz,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:4*scale,textTransform:"uppercase",letterSpacing:"-0.01em"}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.6,fontFamily:"'Arial',sans-serif",fontWeight:600,lineHeight:lh,textAlign:ta,marginBottom:14*scale,textTransform:"uppercase",letterSpacing:"0.05em"}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.8)",fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale,marginBottom:3*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.4)",fontSize:bodySz*0.85,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:"#ffffff",fontSize:titleSz,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:14*scale,textTransform:"uppercase",letterSpacing:"-0.01em"}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.8)",fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale}}>{slide.body}</div>}
            </>
          )}
        </div>
      </div>
      {/* Bottom bar */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:6*scale,backgroundColor:t.accent,zIndex:2}} />
      {handleEl}{numEl}
    </div>
  );

  // 4. DELUX — double border frame, centered gold serif, elegant
  if (layout==="luxury") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Outer frame */}
      <div style={{position:"absolute",inset:24*scale,border:`1px solid rgba(201,168,76,0.3)`,zIndex:2,pointerEvents:"none"}} />
      {/* Inner frame */}
      <div style={{position:"absolute",inset:34*scale,border:`1px solid rgba(201,168,76,0.15)`,zIndex:2,pointerEvents:"none"}} />
      {/* Corner diamonds */}
      {[[28*scale,28*scale],[W-28*scale,28*scale],[28*scale,H-28*scale],[W-28*scale,H-28*scale]].map(([x,y],ci)=>(
        <div key={ci} style={{position:"absolute",left:x,top:y,width:5*scale,height:5*scale,backgroundColor:t.accent,transform:"translate(-50%,-50%) rotate(45deg)",zIndex:3,opacity:0.7}} />
      ))}
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:4,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",justifyContent:posStyle.justifyContent,paddingTop:Math.max(posStyle.paddingTop,80*scale),paddingBottom:Math.max(posStyle.paddingBottom,80*scale),paddingLeft:Math.max(posStyle.paddingLeft,90*scale),paddingRight:Math.max(posStyle.paddingRight,90*scale)}}>
        {/* Divider top */}
        <div style={{width:60*scale,height:1*scale,backgroundColor:t.accent,marginBottom:20*scale,opacity:0.6}} />
        <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:6*scale,fontStyle:"italic",letterSpacing:"0.01em"}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.65,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:18*scale,opacity:0.75,fontStyle:"italic"}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.75,maxWidth:700*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz*0.85,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.4,maxWidth:700*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:18*scale,fontStyle:"italic"}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:t.text,fontSize:bodySz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,opacity:0.75,maxWidth:700*scale}}>{slide.body}</div>}
            </>
          )}
        </div>
        {/* Divider bottom */}
        <div style={{width:60*scale,height:1*scale,backgroundColor:t.accent,marginTop:20*scale,opacity:0.6}} />
      </div>
      {handleEl}{numEl}
    </div>
  );

  // 5. SADE — minimal, no decoration, just beautiful type on space
  if (layout==="clean") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      <div style={{position:"absolute",inset:0,zIndex:2,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {renderText(t.text, "#666666", 300, 16*scale)}
      </div>
      {/* Subtle slide counter bottom-center */}
      {showNumber && (
        <div style={{position:"absolute",bottom:40*scale,left:0,right:0,textAlign:"center",zIndex:3,color:"#cccccc",fontSize:9*scale,letterSpacing:"0.2em",fontFamily:"'DM Sans',sans-serif"}}>
          {"—".repeat(index+1)}
        </div>
      )}
      {handleEl}{numEl}
    </div>
  );

  // 6. EDİTORYAL — newspaper feel, giant faint number, strict columns
  if (layout==="editorial") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(255,255,255,${olAlpha*0.5})`,zIndex:1}} />}
      {/* Giant background number */}
      <div style={{position:"absolute",top:-20*scale,right:30*scale,fontSize:420*scale,fontFamily:"'Georgia',serif",fontWeight:900,color:"rgba(0,0,0,0.05)",lineHeight:1,zIndex:1,userSelect:"none"}}>
        {index+1}
      </div>
      {/* Top rule */}
      <div style={{position:"absolute",top:50*scale,left:50*scale,right:50*scale,height:3*scale,backgroundColor:t.accent,zIndex:2}} />
      {/* Section label */}
      {showNumber && <div style={{position:"absolute",top:64*scale,left:54*scale,fontSize:9*scale,letterSpacing:"0.2em",textTransform:"uppercase",color:t.accent,fontFamily:"'Georgia',serif",fontWeight:700,zIndex:3}}>
        Section {index+1}
      </div>}
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:4,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle,paddingLeft:Math.max(posStyle.paddingLeft,54*scale),paddingRight:Math.max(posStyle.paddingRight,54*scale)}}>
        {renderText(t.text, "#444444", 700, 14*scale)}
      </div>
      {/* Bottom rule */}
      <div style={{position:"absolute",bottom:50*scale,left:50*scale,right:50*scale,height:1*scale,backgroundColor:"rgba(0,0,0,0.25)",zIndex:2}} />
      {handleEl}{numEl}
    </div>
  );

  // 7. NEON — dark, bright lime accent line, chunky text
  if (layout==="neon") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Glow line left */}
      <div style={{position:"absolute",top:80*scale,left:50*scale,width:4*scale,height:`calc(100% - ${160*scale}px)`,backgroundColor:t.accent,boxShadow:`0 0 ${20*scale}px ${t.accent},0 0 ${40*scale}px ${t.accent}40`,zIndex:2}} />
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle,paddingLeft:80*scale,paddingRight:60*scale}}>
        <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:"#ffffff",fontSize:titleSz,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:4*scale,textTransform:"uppercase"}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.62,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:16*scale,textTransform:"uppercase",textShadow:`0 0 ${12*scale}px ${t.accent}80`}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.75)",fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:300,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.35)",fontSize:bodySz*0.85,fontFamily:"'DM Sans',sans-serif",fontWeight:300,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:"#ffffff",fontSize:titleSz,fontFamily:"'Arial Black',sans-serif",fontWeight:900,lineHeight:lh,textAlign:ta,marginBottom:16*scale,textTransform:"uppercase"}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:"rgba(255,255,255,0.75)",fontSize:bodySz,fontFamily:"'DM Sans',sans-serif",fontWeight:300,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale}}>{slide.body}</div>}
            </>
          )}
        </div>
      </div>
      {showNumber && <div style={{position:"absolute",bottom:30*scale,right:30*scale,zIndex:4,color:t.accent,fontSize:9*scale,fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>{String(index+1).padStart(2,"0")}/{String(total).padStart(2,"0")}</div>}
      {handleEl}{numEl}
    </div>
  );

  // 8. RETRO — cream, thick rules top+bottom, vintage
  if (layout==="retro") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Top double rule */}
      <div style={{position:"absolute",top:44*scale,left:0,right:0,height:5*scale,backgroundColor:t.accent,zIndex:2}} />
      <div style={{position:"absolute",top:54*scale,left:0,right:0,height:2*scale,backgroundColor:t.accent,zIndex:2,opacity:0.4}} />
      {/* Header text */}
      {showNumber && <div style={{position:"absolute",top:68*scale,left:0,right:0,textAlign:"center",zIndex:3,color:t.accent,fontSize:10*scale,letterSpacing:"0.25em",fontFamily:"'Georgia',serif",fontWeight:700,textTransform:"uppercase"}}>
        No. {index+1}
      </div>}
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:4,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle,paddingTop:Math.max(posStyle.paddingTop,100*scale)}}>
        {renderText(t.text, "#5a4030", 700, 14*scale)}
      </div>
      {/* Bottom double rule */}
      <div style={{position:"absolute",bottom:54*scale,left:0,right:0,height:2*scale,backgroundColor:t.accent,zIndex:2,opacity:0.4}} />
      <div style={{position:"absolute",bottom:44*scale,left:0,right:0,height:5*scale,backgroundColor:t.accent,zIndex:2}} />
      {handleEl}{numEl}
    </div>
  );

  // 9. SİNEMA — cinematic black bars, subtitle-style text, film feel
  if (layout==="cinema") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,backgroundColor:"#000"}}>
      {/* Background image if present */}
      {bgImg && <img src={bgImg} alt="" crossOrigin="anonymous" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />}
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Cinematic black bars */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:145*scale,backgroundColor:"#000000",zIndex:2}} />
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:145*scale,backgroundColor:"#000000",zIndex:2}} />
      {/* Content in visible middle zone */}
      <div style={{position:"absolute",top:145*scale,bottom:145*scale,left:0,right:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:ai,justifyContent:posStyle.justifyContent,paddingLeft:Math.max(70*scale,posStyle.paddingLeft),paddingRight:Math.max(70*scale,posStyle.paddingRight),paddingTop:posStyle.paddingTop,paddingBottom:posStyle.paddingBottom,boxSizing:"border-box"}}>
        <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:"#f0f0f0",fontSize:titleSz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:6*scale,fontStyle:"italic"}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.6,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:18*scale,fontStyle:"italic",opacity:0.85}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:"rgba(240,240,240,0.8)",fontSize:bodySz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:800*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:"rgba(240,240,240,0.4)",fontSize:bodySz*0.85,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:800*scale,fontStyle:"italic"}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:"#f0f0f0",fontSize:titleSz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lh,textAlign:ta,marginBottom:18*scale,fontStyle:"italic"}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:"rgba(240,240,240,0.8)",fontSize:bodySz,fontFamily:"'Georgia',serif",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:800*scale}}>{slide.body}</div>}
            </>
          )}
        </div>
      </div>
      {/* Film info top bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:145*scale,zIndex:4,display:"flex",alignItems:"center",justifyContent:"space-between",padding:`0 ${40*scale}px`,boxSizing:"border-box"}}>
        <div style={{color:"rgba(255,255,255,0.25)",fontSize:8*scale,fontFamily:"'Courier New',monospace",letterSpacing:"0.15em"}}>FRAME</div>
        <div style={{color:"rgba(255,255,255,0.25)",fontSize:8*scale,fontFamily:"'Courier New',monospace",letterSpacing:"0.15em"}}>◈</div>
      </div>
      {/* Bottom bar */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:145*scale,zIndex:4}} />
      {/* Handle & number — consistent with all layouts */}
      {handleEl}{numEl}
    </div>
  );

  // 10. TECH — dot grid bg, monospace, bracket style
  if (layout==="tech") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,backgroundColor:t.bg}}>
      {/* Dot grid pattern */}
      {!bgImg && (
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:1,opacity:0.12}} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotg" x="0" y="0" width={28*scale} height={28*scale} patternUnits="userSpaceOnUse">
              <circle cx={14*scale} cy={14*scale} r={1.2*scale} fill={t.accent} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotg)" />
        </svg>
      )}
      {bgImg && <img src={bgImg} alt="" crossOrigin="anonymous" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1}} />}
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:2}} />}
      {/* Top status bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:44*scale,backgroundColor:"rgba(0,0,0,0.6)",borderBottom:`1px solid rgba(88,166,255,0.2)`,zIndex:3,display:"flex",alignItems:"center",padding:`0 ${30*scale}px`,boxSizing:"border-box",gap:8*scale}}>
        <div style={{width:8*scale,height:8*scale,borderRadius:"50%",backgroundColor:"#ff5f56"}} />
        <div style={{width:8*scale,height:8*scale,borderRadius:"50%",backgroundColor:"#ffbd2e"}} />
        <div style={{width:8*scale,height:8*scale,borderRadius:"50%",backgroundColor:"#27c93f"}} />
        <div style={{flex:1,textAlign:"center",color:"rgba(201,209,217,0.5)",fontSize:8*scale,fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>slide_{String(index+1).padStart(2,"0")}.png</div>
      </div>
      {/* Content */}
      <div style={{position:"absolute",inset:0,paddingTop:44*scale,zIndex:4,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {/* Bracket prefix */}
        <div style={{fontSize:11*scale,color:t.accent,fontFamily:"'Courier New',monospace",marginBottom:10*scale,opacity:0.7}}>{">"} _</div>
        <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:ai,maxWidth:"100%"}}>
          {olAlpha>0 && <div style={{position:"absolute",inset:`${-olPadV}px ${-olPadH}px`,backgroundColor:`rgba(0,0,0,${olAlpha})`,borderRadius:4*scale,zIndex:0}} />}
          {slide?.headline_tr ? (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz,fontFamily:"'Courier New',monospace",fontWeight:700,lineHeight:lh,textAlign:ta,marginBottom:4*scale}}>{slide.headline_tr}</div>
              <div style={{position:"relative",zIndex:1,color:t.accent,fontSize:titleSz*0.65,fontFamily:"'Courier New',monospace",fontWeight:700,lineHeight:lh,textAlign:ta,marginBottom:16*scale,opacity:0.8}}>{slide.headline_en}</div>
              {slide.body_tr && <div style={{position:"relative",zIndex:1,color:"rgba(201,209,217,0.8)",fontSize:bodySz,fontFamily:"'Courier New',monospace",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale,marginBottom:4*scale}}>{slide.body_tr}</div>}
              {slide.body_en && <div style={{position:"relative",zIndex:1,color:"rgba(201,209,217,0.4)",fontSize:bodySz*0.85,fontFamily:"'Courier New',monospace",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale}}>{slide.body_en}</div>}
            </>
          ) : (
            <>
              <div style={{position:"relative",zIndex:1,color:t.text,fontSize:titleSz,fontFamily:"'Courier New',monospace",fontWeight:700,lineHeight:lh,textAlign:ta,marginBottom:16*scale}}>{slide?.headline||"Headline"}</div>
              {slide?.body && <div style={{position:"relative",zIndex:1,color:"rgba(201,209,217,0.8)",fontSize:bodySz,fontFamily:"'Courier New',monospace",fontWeight:400,lineHeight:lhBody,textAlign:ta,maxWidth:820*scale}}>{slide.body}</div>}
            </>
          )}
        </div>
      </div>
      {handleEl}{numEl}
    </div>
  );

  // 11. ROSE — feminine, soft gradient, flowing curves, serif
  if (layout==="rose") return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      {bgImg && olAlpha>0 && <div style={{position:"absolute",inset:0,backgroundColor:`rgba(0,0,0,${olAlpha})`,zIndex:1}} />}
      {/* Soft curved accent — top right petal */}
      <div style={{position:"absolute",top:-60*scale,right:-60*scale,width:280*scale,height:280*scale,borderRadius:"50%",backgroundColor:"rgba(196,104,122,0.12)",zIndex:1}} />
      <div style={{position:"absolute",bottom:-40*scale,left:-40*scale,width:200*scale,height:200*scale,borderRadius:"50%",backgroundColor:"rgba(196,104,122,0.08)",zIndex:1}} />
      {/* Thin top border line */}
      <div style={{position:"absolute",top:36*scale,left:52*scale,right:52*scale,height:1*scale,backgroundColor:t.accent,zIndex:2,opacity:0.35}} />
      {/* Content */}
      <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {renderText(t.text, "#7a4050", 400, 16*scale)}
      </div>
      {/* Thin bottom border */}
      <div style={{position:"absolute",bottom:36*scale,left:52*scale,right:52*scale,height:1*scale,backgroundColor:t.accent,zIndex:2,opacity:0.35}} />
      {handleEl}{numEl}
    </div>
  );

  // Fallback (should not reach)
  return (
    <div style={{position:"relative",width:W,height:H,overflow:"hidden",flexShrink:0,...bgStyle}}>
      <div style={{position:"absolute",inset:0,zIndex:2,display:"flex",flexDirection:"column",alignItems:ai,boxSizing:"border-box",...posStyle}}>
        {renderText(t.text, t.text)}
      </div>
      {handleEl}{numEl}
    </div>
  );
}

// ─── PILL ROW ─────────────────────────────────────────────────────────────────
function PillRow({ options, active, onChange, small }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)} style={{
          padding:small?"5px 11px":"7px 14px", borderRadius:20, fontSize:small?11:12,
          fontFamily:"'DM Sans',sans-serif", fontWeight:500, cursor:"pointer", border:"1px solid",
          borderColor:active===o?"#d4a843":"#2a2a2a",
          backgroundColor:active===o?"rgba(212,168,67,0.12)":"transparent",
          color:active===o?"#d4a843":"#666", transition:"all 0.15s",
        }}>{o}</button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>onChange(!on)}>
      <div style={{width:36,height:20,borderRadius:10,transition:"all 0.2s",backgroundColor:on?"#d4a843":"#2a2a2a",position:"relative"}}>
        <div style={{width:14,height:14,borderRadius:"50%",backgroundColor:"#fff",position:"absolute",top:3,left:on?19:3,transition:"left 0.2s"}} />
      </div>
      <span style={{fontSize:12,color:on?"#d4a843":"#555",fontFamily:"'DM Sans',sans-serif"}}>{label}</span>
    </div>
  );
}

// ─── PHOTO GRID with drag-reorder + delete + drop ────────────────────────────
function PhotoGrid({ count, photos, onChange }) {
  const [dragOver, setDragOver] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const handleFilePick = (e, idx) => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => onChange(idx, ev.target.result);
    r.readAsDataURL(f);
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault(); setDragOver(null);
    if (e.dataTransfer.files.length>0) {
      const f=e.dataTransfer.files[0];
      if (f.type.startsWith("image/")) {
        const r=new FileReader(); r.onload=ev=>onChange(toIdx,ev.target.result); r.readAsDataURL(f);
      }
      setDraggingIdx(null); return;
    }
    if (draggingIdx!==null && draggingIdx!==toIdx) {
      const next={...photos};
      const tmp=next[draggingIdx]||null;
      next[draggingIdx]=next[toIdx]||null;
      next[toIdx]=tmp;
      // clean nulls
      const cleaned={};
      Object.entries(next).forEach(([k,v])=>{ if(v) cleaned[Number(k)]=v; });
      onChange("_bulk", cleaned);
    }
    setDraggingIdx(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {Array.from({length:count},(_,i)=>(
        <div key={i}
          draggable={!!photos[i]}
          onDragStart={()=>setDraggingIdx(i)}
          onDragEnd={()=>{setDraggingIdx(null);setDragOver(null);}}
          onDragOver={e=>{e.preventDefault();setDragOver(i);}}
          onDragLeave={()=>setDragOver(null)}
          onDrop={e=>handleDrop(e,i)}
          style={{
            display:"flex",alignItems:"center",gap:9,
            padding:"7px 10px",borderRadius:9,
            border:`1px solid ${dragOver===i?"#d4a843":"#222"}`,
            backgroundColor:dragOver===i?"rgba(212,168,67,0.06)":"#080808",
            transition:"all 0.15s",
          }}
        >
          <span style={{color:photos[i]?"#444":"#222",fontSize:13,cursor:photos[i]?"grab":"default",userSelect:"none"}}>⠿</span>
          <span style={{fontSize:10,color:"#555",fontWeight:700,minWidth:48,fontFamily:"'DM Sans',sans-serif"}}>Slide {i+1}</span>
          {photos[i]
            ? <img src={photos[i]} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",flexShrink:0}} />
            : <div style={{width:40,height:40,borderRadius:6,backgroundColor:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#333",flexShrink:0}}>+</div>
          }
          <label style={{flex:1,cursor:"pointer"}}>
            <span style={{fontSize:11,color:photos[i]?"#555":"#666",fontFamily:"'DM Sans',sans-serif"}}>{photos[i]?"Change":"Upload"}</span>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFilePick(e,i)} />
          </label>
          {photos[i] && (
            <button onClick={()=>onChange(i,null)} style={{padding:"2px 7px",borderRadius:5,border:"1px solid #3a1010",backgroundColor:"rgba(255,50,50,0.08)",color:"#ff5555",fontSize:11,cursor:"pointer",flexShrink:0}}>✕</button>
          )}
        </div>
      ))}
      <p style={{fontSize:10,color:"#2a2a2a",margin:"2px 0 0",fontStyle:"italic"}}>Drag rows to reorder · Drop images directly</p>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(()=>{injectFonts();},[]);

  const [topic,       setTopic]       = useState("");
  const [category,    setCategory]    = useState("Mindset");
  const [hookStyle,   setHookStyle]   = useState("Bold Claim");
  const [slideCount,  setSlideCount]  = useState(10);
  const [language,    setLanguage]    = useState("TR+EN");
  const [template,    setTemplate]    = useState("Minimal");
  const [bgMode,      setBgMode]      = useState("Template");
  const [fontStyle,   setFontStyle]   = useState("Template");
  const [fontSize,    setFontSize]    = useState(50);
  const [alignment,   setAlignment]   = useState("Center");
  const [position,    setPosition]    = useState("Middle");
  const [handle,      setHandle]      = useState("");
  const [showHandle,  setShowHandle]  = useState(true);
  const [showNumber,  setShowNumber]  = useState(true);
  const [overlayOn,   setOverlayOn]   = useState(false);
  const [overlayIntensity,setOverlayIntensity] = useState(50);
  const [lineHeight,   setLineHeight]   = useState(50); // 0=tight(1.0) 50=normal(1.5) 100=loose(2.2)
  const [singlePhoto, setSinglePhoto] = useState(null);
  const [perSlidePhotos,setPerSlidePhotos] = useState({});

  const [slides,      setSlides]      = useState([]);
  const [captions,    setCaptions]    = useState([]);
  const [musicVibe,   setMusicVibe]   = useState("");
  const [currentSlide,setCurrentSlide]= useState(0);

  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [capLoading,  setCapLoading]  = useState(false);
  const [error,       setError]       = useState("");
  const [capLang,     setCapLang]     = useState("turkish"); // "turkish" | "english" | "bilingual"
  const [copiedIdx,   setCopiedIdx]   = useState(null);
  const [exporting,   setExporting]   = useState(false);
  const [previewIdx,  setPreviewIdx]  = useState(0);

  const slideRefs = useRef([]);

  const updatePhoto = useCallback((idxOrBulk, val) => {
    if (idxOrBulk==="_bulk") { setPerSlidePhotos(val); return; }
    setPerSlidePhotos(prev=>{
      const next={...prev};
      if(val===null) delete next[idxOrBulk]; else next[idxOrBulk]=val;
      return next;
    });
  },[]);

  const C = {bg:"#080808",surface:"#0f0f0f",border:"rgba(255,255,255,0.07)",accent:"#d4a843",accentDim:"rgba(212,168,67,0.1)",text:"#e8e4dc",muted:"#444",dim:"#2a2a2a"};

  const slideProps = { templateName:template, bgMode, singlePhoto, perSlidePhotos, overlayOn, overlayIntensity, fontStyle, fontSize, lineHeight, alignment, position, showHandle, showNumber, handle, total:slides.length };

  // ── API ───────────────────────────────────────────────
  const callClaude = async (system, user, maxTokens=3000) => {
    const res = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:maxTokens,system,messages:[{role:"user",content:user}]}),
    });
    if(!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const raw = data.content.map(b=>b.text||"").join("");
    const match = raw.match(/\{[\s\S]*\}/);
    if(!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  };

  const generate = async () => {
    if(!topic.trim()){setError("Please enter a topic.");return;}
    setLoading(true);setError("");
    try {
      const parsed = await callClaude(SYSTEM_PROMPT,buildPrompt(topic,category,hookStyle,slideCount,language),3500);
      setSlides((parsed.slides||[]).slice(0,slideCount));
      setCaptions(parsed.captions||[]);
      setMusicVibe(parsed.musicVibe||"");
      setCurrentSlide(0);setStep(2);
    } catch(e){setError("Generation failed. Try again.");console.error(e);}
    finally{setLoading(false);}
  };

  const regenerateCaptions = async () => {
    setCapLoading(true);
    try {
      const parsed = await callClaude(SYSTEM_PROMPT,
        `Topic:"${topic}",Category:${category}.Generate 3 editorial SEO-optimized Instagram captions.
RULES: embed 4-6 #hashtags naturally inside sentences (NOT as separate block). Each style distinct.
Styles: Curiosity Hook (provocative opener), Story-Driven (personal "I" story), Bold CTA (command + urgency).
Include bilingual version: TR paragraph + EN paragraph, each with embedded hashtags.
JSON only: {"captions":[{"style":"Curiosity Hook","turkish":{"text":"...with #embedded #tags"},"english":{"text":"...with #embedded #tags"},"bilingual":{"text":"TR paragraph with #tags.\\n\\nEN paragraph with #tags."}},...]}`,2000);
      setCaptions(parsed.captions||[]);
    } catch(e){console.error(e);} finally{setCapLoading(false);}
  };

  const regenerateSingle = async (idx) => {
    setCapLoading(true);
    try {
      const styles=["Curiosity Hook","Story-Driven","Bold CTA"];
      const parsed = await callClaude(SYSTEM_PROMPT,
        `Topic:"${topic}",Category:${category}.1 editorial SEO caption style "${styles[idx]}". Embed 4-6 #hashtags naturally inside sentences (NOT separate block). Include bilingual.
JSON only: {"captions":[{"style":"${styles[idx]}","turkish":{"text":"...with #embedded #tags"},"english":{"text":"...with #embedded #tags"},"bilingual":{"text":"TR paragraph with #tags.\\n\\nEN paragraph with #tags."}}]}`,1200);
      if(parsed.captions?.[0]) setCaptions(p=>{const n=[...p];n[idx]=parsed.captions[0];return n;});
    } catch(e){console.error(e);} finally{setCapLoading(false);}
  };

  const exportPNG = async (idx) => {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    const el=slideRefs.current[idx];if(!el)return;
    const canvas=await window.html2canvas(el,{scale:3,useCORS:true,backgroundColor:null});
    const a=document.createElement("a");a.download=`slide-${idx+1}.png`;a.href=canvas.toDataURL("image/png");a.click();
  };

  const exportZIP = async () => {
    setExporting(true);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      const zip=new window.JSZip();
      for(let i=0;i<slides.length;i++){
        const el=slideRefs.current[i];if(!el)continue;
        const canvas=await window.html2canvas(el,{scale:3,useCORS:true,backgroundColor:null});
        const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));
        zip.file(`slide-${i+1}.png`,blob);
      }
      const content=await zip.generateAsync({type:"blob"});
      const a=document.createElement("a");a.href=URL.createObjectURL(content);a.download=`carousel-${topic.slice(0,20).replace(/\s/g,"-")}.zip`;a.click();
    } catch(e){alert("ZIP error: "+e.message);}
    finally{setExporting(false);}
  };

  const copyCaption=(cap,idx)=>{
    const c = capLang==="bilingual"
      ? (cap.bilingual || {text:(cap.turkish?.text||"")+"\n\n"+(cap.english?.text||"")})
      : (cap[capLang]||{});
    if(!c.text)return;
    navigator.clipboard.writeText(c.text);
    setCopiedIdx(idx);setTimeout(()=>setCopiedIdx(null),2000);
  };

  const lbl = txt => <div style={{fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>{txt}</div>;

  const PREVIEW_W = 460;
  const prevScale = PREVIEW_W/1080;

  // ══════════════ STEP 1 ═══════════════════════════════
  const renderStep1 = () => (
    <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
      <div style={{flex:1,backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:C.text,margin:"0 0 4px"}}>Create Carousel</h2>
        <p style={{fontSize:12,color:C.muted,margin:"0 0 24px"}}>Viral storytelling framework</p>

        <div style={{marginBottom:20}}>
          {lbl("Topic *")}
          <textarea rows={3} style={{width:"100%",backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"12px 14px",color:C.text,fontSize:14,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}
            placeholder="e.g. Why your morning routine is silently destroying your potential"
            value={topic} onChange={e=>setTopic(e.target.value)} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div>
            {lbl("Category")}
            <select style={{width:"100%",backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",appearance:"none"}}
              value={category} onChange={e=>setCategory(e.target.value)}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {lbl("Hook Style")}
            <select style={{width:"100%",backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",appearance:"none"}}
              value={hookStyle} onChange={e=>setHookStyle(e.target.value)}>
              {HOOK_STYLES.map(h=><option key={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div>
            {lbl("Slides")}
            <PillRow options={SLIDE_COUNTS.map(String)} active={String(slideCount)} onChange={v=>setSlideCount(Number(v))} />
          </div>
          <div>
            {lbl("Content Language")}
            <div style={{display:"flex",gap:6}}>
              {["TR","EN","TR+EN"].map(lang=>{
                const on=language===lang;
                return <button key={lang} onClick={()=>setLanguage(lang)} style={{padding:"7px 12px",borderRadius:20,fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:on?C.accent:C.dim,backgroundColor:on?C.accentDim:"transparent",color:on?C.accent:"#666"}}>{lang}</button>;
              })}
            </div>
            <p style={{fontSize:10,color:"#383838",margin:"5px 0 0",fontStyle:"italic"}}>TR+EN = her slide'da hem Türkçe hem İngilizce</p>
          </div>
        </div>

        <div style={{marginBottom:20}}>
          {lbl("Instagram Handle")}
          <input style={{width:"100%",backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
            placeholder="yourhandle (without @)" value={handle} onChange={e=>setHandle(e.target.value)} />
        </div>

        <div style={{display:"flex",gap:20,marginBottom:24}}>
          <Toggle on={showHandle} onChange={setShowHandle} label="Show handle" />
          <Toggle on={showNumber} onChange={setShowNumber} label="Slide numbers" />
        </div>

        {error && <p style={{color:"#ff4d6d",fontSize:13,marginBottom:12}}>{error}</p>}

        <button onClick={generate} disabled={loading||!topic.trim()} style={{width:"100%",padding:"14px 24px",borderRadius:10,backgroundColor:C.accent,color:"#0a0a0a",fontWeight:800,fontSize:15,border:"none",cursor:loading||!topic.trim()?"not-allowed":"pointer",opacity:loading||!topic.trim()?0.5:1,fontFamily:"'Syne',sans-serif"}}>
          {loading?"Generating…":"✦ Generate Carousel"}
        </button>
      </div>

      {/* Right: design */}
      <div style={{width:320,backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
        {lbl("Template")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {TEMPLATE_NAMES.map(name=>{
            const tpl=TEMPLATES[name];
            const active=template===name;
            const desc={
              Minimal:"Temiz · Zarif · Beyaz",
              Bold:"Sert · Güçlü · Sol bar",
              Sport:"Atletik · Dinamik · Slash",
              Luxury:"Lüks · Çift çerçeve · Gold",
              Clean:"Sade · Sadece yazı · Nefes",
              Editorial:"Gazete · Grid · Numara",
              Neon:"Gece · Glow çizgi · Lime",
              Retro:"Vintage · Kural · Klasik",
              Cinema:"Film · Bar · Dramatik",
              Rose:"Feminine · Soft · Serif",
              Tech:"Kod · Grid · Monospace",
            }[name]||"";
            return (
              <div key={name} onClick={()=>setTemplate(name)} style={{
                cursor:"pointer",borderRadius:10,overflow:"hidden",
                border:`2px solid ${active?C.accent:C.dim}`,
                position:"relative",transition:"all 0.15s",
                backgroundColor:active?"rgba(212,168,67,0.04)":C.bg,
              }}>
                {/* Mini slide preview */}
                <div style={{height:72,overflow:"hidden",position:"relative"}}>
                  <SlideCanvas
                    slide={{headline:"Carousel AI",body:"Design preview."}}
                    index={0} total={1} scale={72/1080}
                    templateName={name} bgMode="Template" singlePhoto={null} perSlidePhotos={{}}
                    overlayOn={false} overlayIntensity={50} fontStyle="Template" fontSize={50}
                    alignment="Center" position="Middle" showHandle={false} showNumber={false} handle=""
                  />
                </div>
                {/* Label */}
                <div style={{padding:"7px 9px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:active?C.accent:C.text,fontFamily:"'DM Sans',sans-serif"}}>{name}</div>
                    <div style={{fontSize:9,color:"#444",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>{desc}</div>
                  </div>
                  {active && <div style={{width:16,height:16,borderRadius:"50%",backgroundColor:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#000",flexShrink:0}}>✓</div>}
                </div>
              </div>
            );
          })}
        </div>

        {lbl("Background")}
        <PillRow options={BG_MODES} active={bgMode} onChange={setBgMode} small />
        {bgMode==="Single Picture" && (
          <div style={{marginTop:10}}>
            <label style={{display:"inline-block",padding:"6px 12px",borderRadius:7,border:`1px dashed ${C.dim}`,color:"#666",fontSize:12,cursor:"pointer",backgroundColor:C.bg}}>
              🖼 Upload picture
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                const f=e.target.files[0]; if(!f) return;
                const r=new FileReader(); r.onload=ev=>setSinglePhoto(ev.target.result); r.readAsDataURL(f);
              }} />
            </label>
            {singlePhoto && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                <img src={singlePhoto} alt="" style={{width:56,height:56,borderRadius:6,objectFit:"cover"}} />
                <button onClick={()=>setSinglePhoto(null)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #3a1a1a",backgroundColor:"rgba(255,50,50,0.08)",color:"#ff5555",fontSize:11,cursor:"pointer"}}>✕ Remove</button>
              </div>
            )}
          </div>
        )}
        {bgMode==="Per-Slide Picture" && (
          <div style={{marginTop:10}}>
            <PhotoGrid count={slideCount} photos={perSlidePhotos} onChange={updatePhoto} />
          </div>
        )}

        <div style={{marginTop:18}}>
          {lbl("Typography")}
          <PillRow options={FONT_STYLES} active={fontStyle} onChange={setFontStyle} small />
          <div style={{marginTop:11,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"#555",width:68}}>Size {fontSize}%</span>
            <input type="range" min={0} max={100} value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} style={{flex:1,accentColor:C.accent}} />
          </div>
        </div>

        <div style={{marginTop:18}}>
          {lbl("Layout")}
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"#555",marginBottom:6}}>Align</div>
              <div style={{display:"flex",gap:5}}>
                {[["Left","◀ Left"],["Center","● Mid"],["Right","Right ▶"]].map(([val,icon])=>(
                  <button key={val} onClick={()=>setAlignment(val)} title={val} style={{
                    flex:1,padding:"6px 4px",borderRadius:7,border:"1px solid",fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",
                    borderColor:alignment===val?C.accent:C.dim,
                    backgroundColor:alignment===val?C.accentDim:"transparent",
                    color:alignment===val?C.accent:"#666",textAlign:"center",
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"#555",marginBottom:6}}>Position</div>
              <PillRow options={POSITIONS} active={position} onChange={setPosition} small />
            </div>
          </div>
          <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"#555",width:88,flexShrink:0}}>Line spacing {lineHeight}%</span>
            <input type="range" min={0} max={100} value={lineHeight} onChange={e=>setLineHeight(Number(e.target.value))} style={{flex:1,accentColor:C.accent}} />
          </div>
        </div>

        <div style={{marginTop:18}}>
          {lbl("Text Overlay (behind text only)")}
          <Toggle on={overlayOn} onChange={setOverlayOn} label="Enable" />
          {overlayOn && (
            <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:11,color:"#555",width:68}}>Opacity {overlayIntensity}%</span>
              <input type="range" min={10} max={90} value={overlayIntensity} onChange={e=>setOverlayIntensity(Number(e.target.value))} style={{flex:1,accentColor:C.accent}} />
            </div>
          )}
        </div>

        <div style={{marginTop:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            {lbl("Live Preview")}
            {bgMode==="Per-Slide Picture" && (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={()=>setPreviewIdx(Math.max(0,previewIdx-1))} disabled={previewIdx===0}
                  style={{padding:"2px 8px",borderRadius:5,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:previewIdx===0?"#2a2a2a":"#888",cursor:previewIdx===0?"default":"pointer",fontSize:12}}>‹</button>
                <span style={{fontSize:10,color:"#555",fontFamily:"'DM Sans',sans-serif"}}>Slide {previewIdx+1}/{slideCount}</span>
                <button onClick={()=>setPreviewIdx(Math.min(slideCount-1,previewIdx+1))} disabled={previewIdx===slideCount-1}
                  style={{padding:"2px 8px",borderRadius:5,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:previewIdx===slideCount-1?"#2a2a2a":"#888",cursor:previewIdx===slideCount-1?"default":"pointer",fontSize:12}}>›</button>
              </div>
            )}
          </div>
          <div style={{width:"100%",aspectRatio:"1",borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
            <SlideCanvas
              slide={{label:"HOOK",headline:topic.slice(0,60)||"Your hook headline here",body:"Body copy goes here."}}
              index={previewIdx} total={slideCount} scale={272/1080}
              {...{templateName:template,bgMode,singlePhoto,perSlidePhotos,overlayOn,overlayIntensity,fontStyle,fontSize,lineHeight,alignment,position,showHandle,showNumber,handle}}
            />
          </div>
          {bgMode==="Per-Slide Picture" && (
            <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
              {Array.from({length:slideCount},(_,i)=>(
                <div key={i} onClick={()=>setPreviewIdx(i)}
                  style={{width:16,height:16,borderRadius:4,cursor:"pointer",border:`1px solid ${perSlidePhotos[i]?C.accent:C.dim}`,backgroundColor:previewIdx===i?C.accentDim:perSlidePhotos[i]?"rgba(212,168,67,0.06)":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:perSlidePhotos[i]?C.accent:"#444"}}>
                  {i+1}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ══════════════ STEP 2 ═══════════════════════════════
  const renderStep2 = () => (
    <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
      <div style={{flex:1,backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:C.text,margin:0}}>Slide Content</h2>
          <div style={{display:"flex",gap:8}}>
            <button style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:"#666",fontSize:12,cursor:"pointer"}} onClick={()=>setStep(1)}>← Back</button>
            <button style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${C.accent}`,backgroundColor:C.accentDim,color:C.accent,fontSize:12,cursor:"pointer"}} onClick={()=>setStep(3)}>Preview & Export →</button>
          </div>
        </div>
        {slides.map((sl,i)=>(
          <div key={i} style={{marginBottom:13,backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:10,padding:"13px 15px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
              <span style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em"}}>Slide {i+1}</span>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,backgroundColor:C.dim,color:"#666",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{sl.label}</span>
            </div>
            {sl.headline_tr!==undefined ? (
              <>
                <div style={{fontSize:10,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>🇹🇷 Başlık</div>
                <input style={{width:"100%",backgroundColor:"transparent",border:"none",borderBottom:`1px solid ${C.dim}`,padding:"5px 0",color:C.text,fontSize:14,fontWeight:700,outline:"none",marginBottom:6,boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                  value={sl.headline_tr||""} placeholder="Türkçe başlık"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],headline_tr:e.target.value};setSlides(n);}} />
                <div style={{fontSize:10,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>🇬🇧 Headline</div>
                <input style={{width:"100%",backgroundColor:"transparent",border:"none",borderBottom:`1px solid ${C.dim}`,padding:"5px 0",color:C.accent,fontSize:13,fontWeight:600,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",opacity:0.85}}
                  value={sl.headline_en||""} placeholder="English headline"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],headline_en:e.target.value};setSlides(n);}} />
                <div style={{fontSize:10,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>🇹🇷 Açıklama</div>
                <textarea rows={2} style={{width:"100%",backgroundColor:"transparent",border:"none",borderBottom:`1px solid #1a1a1a`,padding:"4px 0",color:"#aaa",fontSize:12,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,marginBottom:6}}
                  value={sl.body_tr||""} placeholder="Türkçe açıklama"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],body_tr:e.target.value};setSlides(n);}} />
                <div style={{fontSize:10,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>🇬🇧 Body</div>
                <textarea rows={2} style={{width:"100%",backgroundColor:"transparent",border:"none",padding:"4px 0",color:"#666",fontSize:12,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,fontStyle:"italic"}}
                  value={sl.body_en||""} placeholder="English body"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],body_en:e.target.value};setSlides(n);}} />
              </>
            ) : (
              <>
                <input style={{width:"100%",backgroundColor:"transparent",border:"none",borderBottom:`1px solid ${C.dim}`,padding:"6px 0",color:C.text,fontSize:14,fontWeight:700,outline:"none",marginBottom:7,boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                  value={sl.headline||""} placeholder="Headline"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],headline:e.target.value};setSlides(n);}} />
                <textarea rows={2} style={{width:"100%",backgroundColor:"transparent",border:"none",padding:"4px 0",color:"#aaa",fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}
                  value={sl.body||""} placeholder="Body (optional)"
                  onChange={e=>{const n=[...slides];n[i]={...n[i],body:e.target.value};setSlides(n);}} />
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{width:360,backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.text,margin:0}}>Caption</h2>
          <button onClick={regenerateCaptions} disabled={capLoading} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:"#666",fontSize:11,cursor:"pointer"}}>
            {capLoading?"…":"↺ All"}
          </button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[["turkish","🇹🇷 TR"],["english","🇬🇧 EN"],["bilingual","🇹🇷+🇬🇧"]].map(([val,label])=>(
            <button key={val} onClick={()=>setCapLang(val)} style={{padding:"6px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${capLang===val?C.accent:C.dim}`,backgroundColor:capLang===val?C.accentDim:"transparent",color:capLang===val?C.accent:"#666",fontFamily:"'DM Sans',sans-serif"}}>{label}</button>
          ))}
        </div>
        {capLoading ? <div style={{textAlign:"center",padding:"32px 0",color:"#555"}}>Generating…</div>
        : captions.length===0 ? <div style={{textAlign:"center",padding:"32px 0",color:"#444",fontSize:13}}>Captions appear after generation.</div>
        : captions.map((cap,i)=>{
          const c = capLang==="bilingual"
            ? (cap.bilingual || {text:(cap.turkish?.text||"")+"\n\n"+(cap.english?.text||"")})
            : (cap[capLang]||{});
          return (
            <div key={i} style={{backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:10,padding:13,marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em"}}>v{i+1} · {cap.style}</span>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>regenerateSingle(i)} style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:"#666",fontSize:11,cursor:"pointer"}}>↺</button>
                  <button onClick={()=>copyCaption(cap,i)} style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:copiedIdx===i?"#4ade80":"#666",fontSize:11,cursor:"pointer"}}>{copiedIdx===i?"✓":"⎘"}</button>
                </div>
              </div>
              <p style={{fontSize:12,color:"#ccc",lineHeight:1.65,margin:0,whiteSpace:"pre-line"}}>{c.text}</p>
            </div>
          );
        })}
        {musicVibe && (
          <div style={{marginTop:14,padding:13,backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>🎵 Music Vibe</div>
            <p style={{fontSize:12,color:"#888",fontStyle:"italic",margin:0,lineHeight:1.5}}>{musicVibe}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════ STEP 3 ═══════════════════════════════
  const renderStep3 = () => (
    <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
      {/* Left panel */}
      <div style={{width:290,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
        <button style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:"#666",fontSize:12,cursor:"pointer",alignSelf:"flex-start"}} onClick={()=>setStep(2)}>← Edit Content</button>

        {/* Photo panel — always visible in step 3 */}
        <div style={{backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
          {lbl("Background Pictures")}
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {["Template","Single Picture","Per-Slide Picture"].map(m=>(
              <button key={m} onClick={()=>setBgMode(m)} style={{padding:"4px 10px",borderRadius:16,fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:"pointer",border:"1px solid",borderColor:bgMode===m?C.accent:C.dim,backgroundColor:bgMode===m?C.accentDim:"transparent",color:bgMode===m?C.accent:"#666"}}>{m}</button>
            ))}
          </div>
          {bgMode==="Single Picture" && (
            <div>
              <label style={{display:"inline-block",padding:"6px 12px",borderRadius:7,border:`1px dashed ${C.dim}`,color:"#666",fontSize:12,cursor:"pointer",backgroundColor:C.bg}}>
                🖼 Upload picture
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                  const f=e.target.files[0]; if(!f) return;
                  const r=new FileReader(); r.onload=ev=>setSinglePhoto(ev.target.result); r.readAsDataURL(f);
                }} />
              </label>
              {singlePhoto && (
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                  <img src={singlePhoto} alt="" style={{width:56,height:56,borderRadius:6,objectFit:"cover"}} />
                  <button onClick={()=>setSinglePhoto(null)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #3a1a1a",backgroundColor:"rgba(255,50,50,0.08)",color:"#ff5555",fontSize:11,cursor:"pointer"}}>✕ Remove</button>
                </div>
              )}
            </div>
          )}
          {bgMode==="Per-Slide Picture" && (
            <PhotoGrid count={slides.length} photos={perSlidePhotos} onChange={updatePhoto} />
          )}
          {bgMode==="Template" && (
            <p style={{fontSize:11,color:"#444",margin:0}}>Using template background. Switch to Single or Per-Slide Picture to add images.</p>
          )}
        </div>

        {/* Export */}
        <div style={{backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
          {lbl("Export")}
          <button onClick={()=>exportPNG(currentSlide)} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${C.accent}`,backgroundColor:C.accentDim,color:C.accent,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:8}}>
            ↓ PNG — Slide {currentSlide+1}
          </button>
          <button onClick={exportZIP} disabled={exporting} style={{width:"100%",padding:"11px",borderRadius:8,border:"none",backgroundColor:C.accent,color:"#000",fontSize:13,fontWeight:800,cursor:exporting?"not-allowed":"pointer",fontFamily:"'Syne',sans-serif",opacity:exporting?0.6:1}}>
            {exporting?"Preparing ZIP…":`↓ ZIP (${slides.length} slides)`}
          </button>
        </div>

        {/* Quick design */}
        <div style={{backgroundColor:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
          {lbl("Quick Design")}
          <PillRow options={TEMPLATE_NAMES} active={template} onChange={setTemplate} small />
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            <Toggle on={overlayOn} onChange={setOverlayOn} label="Text overlay" />
            {overlayOn && <input type="range" min={10} max={90} value={overlayIntensity} onChange={e=>setOverlayIntensity(Number(e.target.value))} style={{width:"100%",accentColor:C.accent}} />}
            <Toggle on={showNumber} onChange={setShowNumber} label="Slide numarası" />
            <Toggle on={showHandle} onChange={setShowHandle} label="Handle göster" />
            {showHandle && (
              <input
                style={{width:"100%",backgroundColor:C.bg,border:`1px solid ${C.dim}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                placeholder="yourhandle (without @)"
                value={handle} onChange={e=>setHandle(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main preview area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
        {/* Nav header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:C.muted}}>{slides[currentSlide]?.label} · {currentSlide+1}/{slides.length}</span>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setCurrentSlide(Math.max(0,currentSlide-1))} disabled={currentSlide===0} style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:currentSlide===0?"#2a2a2a":"#888",cursor:currentSlide===0?"default":"pointer",fontSize:14}}>‹</button>
            <button onClick={()=>setCurrentSlide(Math.min(slides.length-1,currentSlide+1))} disabled={currentSlide===slides.length-1} style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${C.dim}`,backgroundColor:"transparent",color:currentSlide===slides.length-1?"#2a2a2a":"#888",cursor:currentSlide===slides.length-1?"default":"pointer",fontSize:14}}>›</button>
          </div>
        </div>

        {/* Big preview */}
        <div style={{width:PREVIEW_W,height:PREVIEW_W,borderRadius:14,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.7)",border:`1px solid ${C.border}`,alignSelf:"center"}}
          ref={el=>(slideRefs.current[currentSlide]=el)}>
          <SlideCanvas slide={slides[currentSlide]} index={currentSlide} {...slideProps} scale={prevScale} />
        </div>

        {/* Dots */}
        <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
          {slides.map((_,i)=>(
            <div key={i} onClick={()=>setCurrentSlide(i)} style={{width:currentSlide===i?18:6,height:6,borderRadius:3,backgroundColor:currentSlide===i?C.accent:C.dim,cursor:"pointer",transition:"all 0.2s"}} />
          ))}
        </div>

        {/* Scrollable all-slides strip */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"#2a2a2a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>All Slides</div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
            {slides.map((sl,i)=>(
              <div key={i} onClick={()=>setCurrentSlide(i)}
                style={{borderRadius:9,overflow:"hidden",border:`2px solid ${currentSlide===i?C.accent:C.dim}`,cursor:"pointer",flexShrink:0,width:110,height:110,transition:"border-color 0.15s"}}>
                <SlideCanvas slide={sl} index={i} {...slideProps} scale={110/1080} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden full-res for ZIP */}
      <div style={{position:"absolute",left:-9999,top:0,pointerEvents:"none"}}>
        {slides.map((sl,i)=>
          i!==currentSlide ? (
            <div key={i} style={{width:1080,height:1080}} ref={el=>(slideRefs.current[i]=el)}>
              <SlideCanvas slide={sl} index={i} {...slideProps} scale={1} />
            </div>
          ):null
        )}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",backgroundColor:C.bg,color:C.text,fontFamily:"'DM Sans',sans-serif"}}>
      <header style={{borderBottom:`1px solid ${C.border}`,backgroundColor:C.bg,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1400,margin:"0 auto",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20,color:C.accent}}>◈</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:17,color:"#f0e6c8",letterSpacing:"-0.02em"}}>Carousel AI Studio</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {["Config","Content","Export"].map((label,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,border:"1px solid",borderColor:step===i+1?C.accent:step>i+1?"#4ade80":C.dim,color:step===i+1?C.accent:step>i+1?"#4ade80":"#555",backgroundColor:step===i+1?C.accentDim:"transparent"}}>
                  {step>i+1?"✓":i+1}
                </div>
                <span style={{fontSize:12,color:step===i+1?"#ddd":"#444"}}>{label}</span>
                {i<2&&<span style={{color:C.dim,fontSize:16,margin:"0 4px"}}>›</span>}
              </div>
            ))}
          </div>
        </div>
      </header>
      <main style={{maxWidth:1400,margin:"0 auto",padding:"32px 28px"}}>
        {step===1 && renderStep1()}
        {step===2 && (loading?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:80,gap:20}}>
            <div style={{width:48,height:48,border:`3px solid ${C.dim}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
            <p style={{color:"#555",fontSize:15}}>Crafting your viral carousel…</p>
          </div>
        ):renderStep2())}
        {step===3 && renderStep3()}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{scrollbar-width:thin;scrollbar-color:#222 #080808}`}</style>
    </div>
  );
}

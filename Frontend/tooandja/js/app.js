/* ------------------------------------------------------------------ */
/* Olek                                                                */
/* ------------------------------------------------------------------ */
var S = {
  lang:"et",
  posting:"all",          /* millise kuulutuse kandidaate näidatakse */
  seen:[], matched:[], saved:[], history:[], threads:{},
  tab:"cands", thread:null, view:"web",
  added:[], poDraft:null   /* tööandja enda lisatud kuulutused */
};

/* Koodis olevad kuulutused + need, mille tööandja ise on lisanud */
function allPostings(){ return POSTINGS.concat(S.added); }
function t(){ return T[S.lang]; }
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function nowHM(){
  var d = new Date();
  return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
}
function L(c){ return c[S.lang]; }
function posting(id){
  var p = allPostings().filter(function(x){ return x.id === id; })[0];
  return p || allPostings()[0];
}
function postingName(id){ var p = posting(id); return S.lang === "et" ? p.et : p.en; }
function num(n,d){
  var s = n.toFixed(d === undefined ? 2 : d);
  return S.lang === "et" ? s.replace(".",",") : s;
}

/* ------------------------------------------------------------------ */
/* Pakk                                                                */
/* ------------------------------------------------------------------ */
function forPosting(){
  return CANDIDATES.filter(function(c){
    return S.posting === "all" || c.posting === S.posting;
  });
}
function deck(){
  return forPosting().filter(function(c){ return S.seen.indexOf(c.id) === -1; });
}

function photoBG(c, i){
  var h = (c.id * 61 + i * 53) % 360;
  return "radial-gradient(120% 80% at 70% 15%, hsl("+((h+30)%360)+" 34% 32%), transparent 70%),"
       + "linear-gradient(155deg, hsl("+h+" 30% 28%), hsl("+((h+45)%360)+" 36% 13%))";
}

function cardHTML(c){
  var k = t(), d = L(c);
  var chips = c.accom.slice(0,3).map(function(a){ return "<li>"+tag(a)+"</li>"; }).join("");
  if(c.accom.length > 3) chips += '<li class="plus">+'+(c.accom.length-3)+"</li>";
  return ''
   + '<div class="photo">'
   +   '<span class="glyph" aria-hidden="true">'+c.ini+'</span>'
   +   '<span class="segs" aria-hidden="true"><span class="on"></span><span></span><span></span></span>'
   +   '<span class="pill km">'+num(c.km,1)+' km</span>'
   +   '<span class="pill fitp">100%</span>'
   +   '<span class="phmark">'+k.photoMark+' 1/3</span>'
   +   '<span class="scrim">'
   +     '<h2 class="crole">'+esc(c.name)+'</h2>'
   +     '<span class="csub">'+esc(postingName(c.posting))+' · '+k.applied(c.at)
   +       '<span class="cpay">'+esc(d.wants)+'</span></span>'
   +   '</span>'
   +   '<button type="button" class="infobtn" aria-label="'+k.more+'">i</button>'
   + '</div>'
   + '<div class="under"><ul class="chips accom">'+chips+'</ul></div>'
   + '<span class="stamp pass">'+k.pass+'</span>'
   + '<span class="stamp like">'+k.like+'</span>'
   + '<span class="stamp keep">'+k.save+'</span>';
}

function renderStack(){
  var k = t(), d = deck(), all = forPosting(), stack = $("stack");
  $("fCount").innerHTML = k.count(all.length, CANDIDATES.length);
  $("fWhy").textContent = k.why;
  stack.innerHTML = "";

  if(d.length === 0){
    var none = all.length === 0;
    var box = document.createElement("div");
    box.className = "empty";
    box.innerHTML = '<h2>'+(none ? k.noneH : k.emptyH)+'</h2><p>'+(none ? k.noneP : k.emptyP)+'</p>';
    var b = document.createElement("button");
    b.type = "button"; b.className = "linkbtn";
    b.textContent = none ? k.noneBtn : k.emptyBtn;
    b.onclick = none
      ? function(){ S.posting = "all"; renderFilter(); renderStack(); }
      : function(){ S.seen = S.matched.concat(S.saved); renderStack(); };
    box.appendChild(b);
    stack.appendChild(box);
    ["btnPass","btnLike","btnSave"].forEach(function(id){ $(id).disabled = true; });
    $("btnUndo").disabled = S.history.length === 0;
    syncDesk();
    return;
  }

  ["btnPass","btnLike","btnSave"].forEach(function(id){ $(id).disabled = false; });
  $("btnUndo").disabled = S.history.length === 0;

  d.slice(0,3).reverse().forEach(function(c, i, arr){
    var depth = arr.length - 1 - i;
    var el = document.createElement("article");
    el.className = "card";
    el.dataset.id = c.id;
    el.style.transform = "translateY("+(depth*-7)+"px) scale("+(1 - depth*0.035)+")";
    el.style.zIndex = String(10 - depth);
    el.innerHTML = cardHTML(c);
    el.querySelector(".photo").style.background = photoBG(c, 0);
    if(depth === 0){ el.setAttribute("aria-label", c.name); armDrag(el, c); }
    else { el.setAttribute("aria-hidden","true"); el.style.cursor = "default"; }
    stack.appendChild(el);
  });
  syncDesk();
}

function armDrag(el, c){
  var x0 = 0, y0 = 0, dx = 0, dy = 0, dragging = false, pid = null, t0 = 0, downT = null;
  var like = el.querySelector(".stamp.like"), pass = el.querySelector(".stamp.pass");
  var keep = el.querySelector(".stamp.keep");
  var photo = el.querySelector(".photo"), segs = el.querySelectorAll(".segs span");
  var mark = el.querySelector(".phmark"), shot = 0;
  function upward(){ return dy < 0 && Math.abs(dy) > Math.abs(dx) * 1.2; }

  function showPhoto(i){
    shot = (i + 3) % 3;
    photo.style.background = photoBG(c, shot);
    for(var n=0;n<segs.length;n++){ segs[n].className = n === shot ? "on" : ""; }
    mark.textContent = t().photoMark + " " + (shot+1) + "/3";
  }

  var info = el.querySelector(".infobtn");
  info.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
  info.addEventListener("click", function(e){ e.stopPropagation(); openDetail(c); });

  el.addEventListener("pointerdown", function(e){
    if(e.button !== undefined && e.button !== 0) return;
    dragging = true; pid = e.pointerId; t0 = Date.now(); downT = e.target;
    x0 = e.clientX; y0 = e.clientY; dx = 0; dy = 0;
    el.classList.add("drag"); el.classList.remove("anim");
    try{ el.setPointerCapture(pid); }catch(err){}
  });
  el.addEventListener("pointermove", function(e){
    if(!dragging || e.pointerId !== pid) return;
    dx = e.clientX - x0; dy = e.clientY - y0;
    var up = upward();
    el.style.transform = "translate("+dx+"px,"+dy+"px) rotate("+(up ? 0 : dx*0.055)+"deg)";
    if(up){
      keep.style.opacity = Math.min(Math.abs(dy)/95, 1);
      like.style.opacity = 0; pass.style.opacity = 0;
    } else {
      var kk = Math.min(Math.abs(dx)/95, 1);
      like.style.opacity = dx > 0 ? kk : 0;
      pass.style.opacity = dx < 0 ? kk : 0;
      keep.style.opacity = 0;
    }
  });
  function end(e){
    if(!dragging || (e.pointerId !== undefined && e.pointerId !== pid)) return;
    dragging = false; el.classList.remove("drag");
    try{ el.releasePointerCapture(pid); }catch(err){}
    if(upward() && dy < -95){ keep.style.opacity = 1; doSave(el, c); return; }
    if(Math.abs(dx) > 95){ fly(el, c, dx > 0); return; }
    el.classList.add("anim");
    el.style.transform = "translate(0,0) rotate(0deg)";
    like.style.opacity = 0; pass.style.opacity = 0; keep.style.opacity = 0;
    if(Math.abs(dx) < 7 && Math.abs(dy) < 7 && Date.now() - t0 < 500){
      var onInfo = downT && downT.closest && downT.closest(".scrim, .under");
      if(onInfo){ openDetail(c); return; }
      var r = photo.getBoundingClientRect();
      showPhoto(shot + (e.clientX - r.left < r.width * 0.33 ? -1 : 1));
    }
  }
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function fly(el, c, liked){
  var dir = liked ? 1 : -1;
  el.classList.add("anim");
  el.style.transform = "translate("+(dir*520)+"px,60px) rotate("+(dir*26)+"deg)";
  el.style.opacity = "0";
  el.querySelector(liked ? ".stamp.like" : ".stamp.pass").style.opacity = "1";
  setTimeout(function(){ decide(c, liked); }, 260);
}

function decide(c, liked){
  var k = t();
  if(S.seen.indexOf(c.id) === -1) S.seen.push(c.id);
  S.history.push({id:c.id, act:liked ? "like" : "pass"});
  if(liked){
    /* Kandidaat on juba paremale swipe'inud — tööandja "jah" teeb match'i
       ja avab vestluse mõlemale poolele. */
    if(S.matched.indexOf(c.id) === -1) S.matched.push(c.id);
    /* Vestlus algab tühjalt — esimese sõnumi kirjutab tööandja. */
    if(!S.threads[c.id]) S.threads[c.id] = [];
    $("live").textContent = k.matched(c.name);
    showMatch(c);
  } else {
    $("live").textContent = k.passed(c.name);
  }
  renderStack(); renderBadge();
}

function topCard(){
  var top = $("stack").querySelector('.card[data-id]:last-child');
  if(!top) return null;
  return {el:top, c:CANDIDATES.filter(function(x){ return String(x.id) === top.dataset.id; })[0]};
}
function swipeTop(liked){ var o = topCard(); if(o && o.c) fly(o.el, o.c, liked); }
function doSave(el, c){
  if(S.seen.indexOf(c.id) === -1) S.seen.push(c.id);
  if(S.saved.indexOf(c.id) === -1) S.saved.push(c.id);
  S.history.push({id:c.id, act:"save"});
  $("live").textContent = t().saved(c.name);
  el.classList.add("anim");
  el.style.transform = "translateY(-560px) scale(.92)";
  el.style.opacity = "0";
  setTimeout(function(){ renderStack(); renderBadge(); }, 260);
}
function saveTop(){ var o = topCard(); if(o && o.c) doSave(o.el, o.c); }
function undo(){
  var last = S.history.pop();
  if(!last) return;
  var i = S.seen.indexOf(last.id);
  if(i !== -1) S.seen.splice(i,1);
  if(last.act === "like"){
    var m = S.matched.indexOf(last.id);
    if(m !== -1) S.matched.splice(m,1);
    delete S.threads[last.id];
  }
  if(last.act === "save"){
    var s = S.saved.indexOf(last.id);
    if(s !== -1) S.saved.splice(s,1);
  }
  $("live").textContent = t().undone;
  renderStack(); renderBadge();
}

/* ------------------------------------------------------------------ */
/* CV täisvaade                                                        */
/* ------------------------------------------------------------------ */
var openCand = null;
function deskVisible(){ return window.innerWidth >= 900 && S.view === "web"; }

function openDetail(c){
  var o = topCard();
  if(deskVisible() && o && o.c && o.c.id === c.id){ $("deskBody").scrollTop = 0; return; }
  openCand = c;
  renderDetail();
  $("detail").hidden = false;
  $("dBody").scrollTop = 0;
  $("dBack").focus();
}
function renderDetail(){
  if(!openCand) return;
  var k = t();
  $("dCo").textContent = openCand.name;
  $("dPass").textContent = k.pass;
  $("dLike").textContent = k.like;
  $("dBody").innerHTML = cvHTML(openCand);
}
function syncDesk(){
  if(!deskVisible()) return;
  var o = topCard();
  if(!o || !o.c){
    $("deskCo").textContent = ""; $("deskIni").textContent = ""; $("deskBody").innerHTML = "";
    return;
  }
  $("deskCo").textContent = o.c.name;
  $("deskIni").textContent = o.c.ini;
  $("deskBody").innerHTML = cvHTML(o.c);
  $("deskBody").scrollTop = 0;
}
function closeDetail(){ $("detail").hidden = true; openCand = null; $("stack").focus(); }

function cvHTML(c){
  var k = t(), d = L(c), p = posting(c.posting);
  return ''
   + '<p class="cvfor">'+k.appliedFor+': '+esc(postingName(c.posting))
   +   ' · '+num(p.pay)+' €/h · '+esc(p.place)+'</p>'
   + '<p class="cvfile">'+k.applied(c.at)+'</p>'
   + '<div class="cvdoc">'
   +   '<h3>'+esc(c.name)+'</h3>'
   +   '<p class="cvmeta">'+num(c.km,1)+' km · '+esc(d.wants)+'</p>'
   +   '<h4>'+k.cvSummary+'</h4><p>'+esc(d.summary)+'</p>'
   +   '<h4>'+k.cvExp+'</h4>'
   +   d.exp.map(function(e){
         return '<p class="cvexpline"><b>'+esc(e.role)+'</b>, '+esc(e.org)
              + ' <span class="cvper">'+esc(e.period)+'</span><br>'+esc(e.text)+'</p>';
       }).join("")
   +   '<h4>'+k.cvSkills+'</h4><ul class="bullets">'
   +     d.skills.map(function(s){ return "<li>"+esc(s)+"</li>"; }).join("")+'</ul>'
   +   '<h4>'+k.cvAvail+'</h4><p>'+esc(d.availability)+'</p>'
   +   '<h4>'+k.conditions+'</h4><p>'+esc(d.conditions)+'</p>'
   +   '<ul class="chips accom cvchips">'
   +     c.accom.map(function(a){ return "<li>"+tag(a)+"</li>"; }).join("")+'</ul>'
   + '</div>';
}

/* ------------------------------------------------------------------ */
/* Match ja vestlus                                                    */
/* ------------------------------------------------------------------ */
var pending = null;
function showMatch(c){
  var k = t();
  pending = c.id;
  $("matchBig").textContent = k.matchBig;
  $("matchCo").textContent = c.name + " · " + postingName(c.posting);
  $("matchTxt").textContent = k.matchTxt;
  var box = $("matchBtns");
  box.innerHTML = "";
  [{label:k.matchChat, go:function(){ $("matchpop").hidden = true; openChat(c.id); }},
   {label:k.matchMore, ghost:true, go:function(){ $("matchpop").hidden = true; $("stack").focus(); }}
  ].forEach(function(b){
    var el = document.createElement("button");
    el.type = "button";
    el.className = "bigbtn" + (b.ghost ? " ghost" : "");
    el.textContent = b.label;
    el.onclick = b.go;
    box.appendChild(el);
  });
  $("matchpop").hidden = false;
  box.querySelector("button").focus();
}

function msgText(m){ return m.text; }
function openChat(id){
  S.thread = id;
  var c = CANDIDATES.filter(function(x){ return x.id === id; })[0];
  $("chatTitle").textContent = c.name;
  renderMsgs(); renderQuick();
  $("chat").hidden = false;
  $("msgInput").focus();
}
function renderMsgs(){
  var box = $("msgs"), msgs = S.threads[S.thread] || [];
  box.innerHTML = '<span class="sysmsg">'+t().sys+'</span>';
  if(msgs.length === 0){
    box.innerHTML += '<span class="sysmsg">'+t().startChat+'</span>';
  }
  msgs.forEach(function(m){
    var d = document.createElement("div");
    d.className = "msg " + (m.who === "me" ? "me" : "them");
    d.innerHTML = esc(msgText(m)) + '<span class="time">'+m.time+'</span>';
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
}
function renderQuick(){
  var q = $("quick");
  q.innerHTML = "";
  t().quick.forEach(function(text){
    var b = document.createElement("button");
    b.type = "button"; b.textContent = text;
    b.onclick = function(){ send(text); };
    q.appendChild(b);
  });
}
function send(text){
  if(!text.trim() || S.thread === null) return;
  var c = CANDIDATES.filter(function(x){ return x.id === S.thread; })[0];
  var firstReply = !S.threads[S.thread].some(function(m){ return m.who === "them"; });
  S.threads[S.thread].push({who:"me", text:text, time:nowHM()});
  renderMsgs();
  var pool = t().reply;
  /* Kandidaadi esimene vastus on tema enda, ülejäänud tulevad üldisest hulgast */
  var pick = firstReply ? L(c).first : pool[S.threads[S.thread].length % pool.length];
  setTimeout(function(){
    if(S.thread === null) return;
    S.threads[S.thread].push({who:"them", text:pick, time:nowHM()});
    renderMsgs(); renderMatches();
  }, 1100);
}

/* ------------------------------------------------------------------ */
/* Loendid                                                             */
/* ------------------------------------------------------------------ */
function renderMatches(){
  var k = t();
  $("mTitle").textContent = k.mTitle;
  $("mNote").textContent = S.matched.length ? k.mNote : k.mEmpty;

  var list = $("mList");
  list.innerHTML = "";
  S.matched.slice().reverse().forEach(function(id){
    var c = CANDIDATES.filter(function(x){ return x.id === id; })[0];
    var msgs = S.threads[id] || [];
    var last = msgs[msgs.length-1];
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button"; b.className = "mrow";
    var prev = last ? esc(last.text) : k.startChat;
    b.innerHTML = '<span class="logo" aria-hidden="true">'+c.ini+'</span>'
      + '<span class="who"><span class="co">'+esc(c.name)+'</span>'
      + '<span class="prev">'+prev+'</span></span>'
      + (last && last.who === "them" ? '<span class="dot" aria-hidden="true"></span>' : '');
    b.onclick = function(){ openChat(id); };
    li.appendChild(b); list.appendChild(li);
  });

  var sl = $("sList");
  sl.innerHTML = "";
  $("sTitle").hidden = S.saved.length === 0;
  $("sTitle").textContent = k.savedTitle;
  S.saved.slice().reverse().forEach(function(id){
    var c = CANDIDATES.filter(function(x){ return x.id === id; })[0];
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button"; b.className = "mrow";
    b.innerHTML = '<span class="logo" aria-hidden="true">'+c.ini+'</span>'
      + '<span class="who"><span class="co">'+esc(c.name)+'</span>'
      + '<span class="prev">'+esc(postingName(c.posting))+' · '+k.applied(c.at)+'</span></span>';
    b.onclick = function(){ openDetail(c); };
    li.appendChild(b); sl.appendChild(li);
  });
}
function renderBadge(){
  var n = S.matched.length;
  var b = $("navBadge");
  b.textContent = String(n);
  b.hidden = n === 0;
}

function renderProfile(){
  var k = t(), e = L(EMPLOYER);
  $("pTitle").textContent = EMPLOYER.co;
  $("pNote").textContent = e.about;
  $("pStatA").textContent = allPostings().length;
  $("pStatAL").textContent = k.statA;
  $("pStatB").textContent = CANDIDATES.length - S.seen.length;
  $("pStatBL").textContent = k.statB;
  $("pStatC").textContent = S.matched.length;
  $("pStatCL").textContent = k.statC;
  $("btnNewPosting").textContent = k.newPosting;
  $("btnReset").textContent = k.reset;

  $("pTags").innerHTML = '<div class="pgroup"><h3>'+k.postings+'</h3>'
    + '<ul class="mlist">'
    + allPostings().map(function(p){
        var n = CANDIDATES.filter(function(c){ return c.posting === p.id; }).length;
        return '<li><span class="mrow flat"><span class="who">'
             + '<span class="co">'+esc(S.lang === "et" ? p.et : p.en)+'</span>'
             + '<span class="prev">'+num(p.pay)+' €/h · '+esc(p.place)+'</span></span>'
             + '<span class="status wait">'+n+'</span></span></li>';
      }).join("")
    + '</ul></div>'
    + '<div class="pgroup"><h3>'+k.contact+'</h3><p class="sectnote">'+esc(e.contact)+'</p></div>';
}

/* ------------------------------------------------------------------ */
/* Uue kuulutuse lisamine                                              */
/*                                                                      */
/* Ligipääsetavuse tingimused on siin kõige olulisem väli: neid ei ole  */
/* üheski tööportaalis ja ainult tööandja saab need kinnitada. Seetõttu  */
/* näidatakse kohe, mitu juba süsteemis olevat inimest neile vastaks —   */
/* mida rohkem tööandja kinnitab, seda rohkem kandidaate ta näeb.        */
/* ------------------------------------------------------------------ */
function openPostEdit(){
  S.poDraft = {
    et:"", en:"", pay:"", place:"",
    shifts:[], accom:[],
    reqs:"", desc:"", hours:"", start:"", offers:""
  };
  renderPostEdit();
  $("postedit").hidden = false;
  $("poBody").scrollTop = 0;
}

function poField(label, key, multi, hint){
  var tag = multi ? "textarea" : "input";
  return '<label class="cvf"><span>'+label+(hint ? ' <em>'+hint+'</em>' : '')+'</span>'
       + '<'+tag+' data-p="'+key+'"'+(multi ? ' rows="'+multi+'"' : ' type="text"')+'></'+tag+'>'
       + '</label>';
}

function poChips(group, key){
  return '<div class="taggrid" data-group="'+key+'">'
    + Object.keys(TAGS).filter(function(id){ return TAGS[id].g === group; })
        .map(function(id){
          var on = S.poDraft[key].indexOf(id) !== -1;
          return '<button type="button" class="tag" data-tag="'+id+'" aria-pressed="'+(on?"true":"false")+'">'
               + tag(id)+'</button>';
        }).join("")
    + '</div>';
}

function renderPostEdit(err){
  var k = t(), d = S.poDraft;
  $("poHead").textContent = k.poTitle;
  $("poCancel").textContent = k.poCancel;
  $("poSave").textContent = k.poSave;

  $("poBody").innerHTML = ''
    + '<p class="cvfor">'+k.poIntro+'</p>'
    + (err ? '<p class="poerr">'+err+'</p>' : '')
    + poField(k.poRole, "et")
    + poField(k.poRoleEn, "en", 0, k.poOptional)
    + '<div class="cvgrid">'+poField(k.poPay, "pay")+poField(k.poPlace, "place")+'</div>'
    + '<h4 class="glabel cvsec">'+k.poShifts+'</h4>'
    + poChips("sched", "shifts")
    + '<h4 class="glabel cvsec">'+k.poAccom+'</h4>'
    + '<p class="pohint">'+k.poAccomHint+'</p>'
    + poChips("access", "accom")
    + '<h4 class="glabel cvsec">'+k.poRest+'</h4>'
    + poField(k.poDesc, "desc", 4)
    + poField(k.poReqs, "reqs", 3, k.poPerLine)
    + '<div class="cvgrid">'+poField(k.poHours, "hours")+poField(k.poStart, "start")+'</div>'
    + poField(k.poOffers, "offers", 3, k.poPerLine);

  ["et","en","pay","place","desc","reqs","hours","start","offers"].forEach(function(key){
    var el = $("poBody").querySelector('[data-p="'+key+'"]');
    if(el) el.value = d[key];
  });
  $("poBody").addEventListener("input", readPostDraft);
  $("poBody").querySelectorAll(".tag").forEach(function(b){
    b.onclick = function(){
      var key = b.closest(".taggrid").dataset.group, id = b.dataset.tag;
      var arr = S.poDraft[key], i = arr.indexOf(id);
      if(i === -1) arr.push(id); else arr.splice(i,1);
      b.setAttribute("aria-pressed", i === -1 ? "true" : "false");
      poCount();
    };
  });
  poCount();
}

function readPostDraft(){
  var d = S.poDraft, root = $("poBody");
  ["et","en","pay","place","desc","reqs","hours","start","offers"].forEach(function(key){
    var el = root.querySelector('[data-p="'+key+'"]');
    if(el) d[key] = el.value;
  });
}

/* Mitu juba süsteemis olevat inimest saaks seda tööd teha: kõik nende
   tingimused peavad kuulutusel kinnitatud olema. */
function poMatchCount(){
  return CANDIDATES.filter(function(c){
    return c.accom.every(function(a){ return S.poDraft.accom.indexOf(a) !== -1; });
  }).length;
}
function poCount(){
  $("poCount").innerHTML = t().poCount(poMatchCount(), CANDIDATES.length);
}

function savePosting(){
  var k = t();
  readPostDraft();
  var d = S.poDraft;
  if(!d.et.trim()) return renderPostEdit(k.poNeedRole);
  var pay = parseFloat(String(d.pay).replace(",", "."));
  if(!pay || pay <= 0) return renderPostEdit(k.poNeedPay);

  var lines = function(s){ return s.split("\n").map(function(x){ return x.trim(); }).filter(Boolean); };
  var p = {
    id:"uus"+(S.added.length+1),
    et:d.et.trim(), en:(d.en.trim() || d.et.trim()),
    pay:pay, place:d.place.trim() || "—",
    shifts:d.shifts.slice(), accom:d.accom.slice(),
    reqs:lines(d.reqs), desc:d.desc.trim(),
    hours:d.hours.trim(), start:d.start.trim(), offers:lines(d.offers),
    own:true
  };
  S.added.push(p);
  $("postedit").hidden = true;
  S.poDraft = null;
  S.posting = p.id;
  renderFilter(); renderStack(); renderProfile();
  go("cands");
  $("live").textContent = k.poSaved(p.et, poMatchCountFor(p));
}
function poMatchCountFor(p){
  return CANDIDATES.filter(function(c){
    return c.accom.every(function(a){ return p.accom.indexOf(a) !== -1; });
  }).length;
}

function renderFilter(){
  var k = t(), bar = $("postings");
  bar.innerHTML = "";
  [{id:"all", name:k.allPostings}].concat(allPostings().map(function(p){
    return {id:p.id, name:S.lang === "et" ? p.et : p.en};
  })).forEach(function(p){
    var b = document.createElement("button");
    b.type = "button"; b.className = "tag";
    b.textContent = p.name;
    b.setAttribute("aria-pressed", S.posting === p.id ? "true" : "false");
    b.onclick = function(){ S.posting = p.id; renderFilter(); renderStack(); };
    bar.appendChild(b);
  });
}

/* ------------------------------------------------------------------ */
/* Navigatsioon, vaade, keel                                           */
/* ------------------------------------------------------------------ */
function go(tab){
  S.tab = tab;
  $("viewCands").hidden = tab !== "cands";
  $("viewMatches").hidden = tab !== "matches";
  $("viewProfile").hidden = tab !== "profile";
  [["navJobs","cands"],["navMatches","matches"],["navProfile","profile"]].forEach(function(p){
    if(tab === p[1]) $(p[0]).setAttribute("aria-current","page");
    else $(p[0]).removeAttribute("aria-current");
  });
  if(tab === "matches") renderMatches();
  if(tab === "profile") renderProfile();
}

function setView(v, remember){
  S.view = v;
  var shell = $("shell");
  shell.classList.toggle("web", v === "web");
  shell.classList.toggle("framed", v === "phone");
  $("viewWeb").setAttribute("aria-pressed", v === "web" ? "true" : "false");
  $("viewPhone").setAttribute("aria-pressed", v === "phone" ? "true" : "false");
  if(remember !== false){
    try{ localStorage.setItem("sobib-vaade-tooandja", v); }catch(err){}
  }
  renderStack();
}

function applyLang(){
  var k = t();
  $("demochip").textContent = k.demo;
  $("langEt").setAttribute("aria-pressed", S.lang === "et" ? "true" : "false");
  $("langEn").setAttribute("aria-pressed", S.lang === "en" ? "true" : "false");
  $("viewWeb").title = k.viewWeb; $("viewPhone").title = k.viewPhone;
  $("viewWeb").setAttribute("aria-label", k.viewWeb);
  $("viewPhone").setAttribute("aria-label", k.viewPhone);
  $("toSeeker").textContent = k.toSeeker;
  $("labPass").textContent = k.pass;
  $("labLike").textContent = k.like;
  $("labUndo").textContent = k.undo;
  $("labSave").textContent = k.save;
  $("btnPass").setAttribute("aria-label", k.pass);
  $("btnLike").setAttribute("aria-label", k.like);
  $("btnUndo").setAttribute("aria-label", k.undo);
  $("btnSave").setAttribute("aria-label", k.save);
  $("hint").textContent = k.hint;
  $("navJobsL").textContent = k.navJobs;
  $("navMatchesL").textContent = k.navMatches;
  $("navProfileL").textContent = k.navProfile;
  $("stack").setAttribute("aria-label", k.navJobs);
  renderFilter(); renderStack(); renderBadge();
  if(S.tab === "matches") renderMatches();
  if(S.tab === "profile") renderProfile();
  if(!$("postedit").hidden) renderPostEdit();
  if(!$("detail").hidden) renderDetail();
  if(!$("chat").hidden){ renderMsgs(); renderQuick(); }
}

/* ------------------------------------------------------------------ */
/* Sündmused                                                           */
/* ------------------------------------------------------------------ */
$("btnPass").onclick = function(){ swipeTop(false); };
$("btnLike").onclick = function(){ swipeTop(true); };
$("btnSave").onclick = saveTop;
$("btnUndo").onclick = undo;
$("btnNewPosting").onclick = openPostEdit;
$("poBack").onclick = function(){ $("postedit").hidden = true; S.poDraft = null; };
$("poCancel").onclick = function(){ $("postedit").hidden = true; S.poDraft = null; };
$("poSave").onclick = savePosting;

$("btnReset").onclick = function(){
  S.seen = []; S.matched = []; S.saved = []; S.history = []; S.threads = {};
  S.posting = "all"; S.added = []; S.poDraft = null;
  renderFilter(); renderStack(); renderBadge(); renderProfile(); go("cands");
};
$("navJobs").onclick = function(){ go("cands"); };
$("navMatches").onclick = function(){ go("matches"); };
$("navProfile").onclick = function(){ go("profile"); };
$("langEt").onclick = function(){ S.lang = "et"; applyLang(); };
$("langEn").onclick = function(){ S.lang = "en"; applyLang(); };
$("viewWeb").onclick = function(){ setView("web"); };
$("viewPhone").onclick = function(){ setView("phone"); };
$("dBack").onclick = closeDetail;
$("dPass").onclick = function(){ $("detail").hidden = true; openCand = null; swipeTop(false); };
$("dLike").onclick = function(){ $("detail").hidden = true; openCand = null; swipeTop(true); };
$("chatBack").onclick = function(){ $("chat").hidden = true; S.thread = null; renderMatches(); };
$("composer").onsubmit = function(e){
  e.preventDefault();
  var i = $("msgInput");
  send(i.value);
  i.value = "";
};

var deskWas = deskVisible();
window.addEventListener("resize", function(){
  var now = deskVisible();
  if(now !== deskWas){ deskWas = now; renderStack(); }
  else if(now) syncDesk();
});

$("stack").addEventListener("keydown", function(e){
  if(e.key === "ArrowLeft"){ e.preventDefault(); swipeTop(false); }
  if(e.key === "ArrowRight"){ e.preventDefault(); swipeTop(true); }
  if(e.key === "ArrowUp"){ e.preventDefault(); saveTop(); }
  if(e.key === "Enter"){
    var o = topCard();
    if(o && o.c){ e.preventDefault(); openDetail(o.c); }
  }
});
document.addEventListener("keydown", function(e){
  if(e.key !== "Escape") return;
  if(!$("matchpop").hidden){ $("matchpop").hidden = true; return; }
  if(!$("chat").hidden){ $("chat").hidden = true; S.thread = null; renderMatches(); return; }
  if(!$("postedit").hidden){ $("postedit").hidden = true; S.poDraft = null; return; }
  if(!$("detail").hidden){ closeDetail(); }
});

/* ------------------------------------------------------------------ */
/* Käivitus                                                            */
/* ------------------------------------------------------------------ */
(function start(){
  var hash = (location.hash || "").replace("#","").toLowerCase();
  var sv = null;
  try{ sv = localStorage.getItem("sobib-vaade-tooandja"); }catch(err){}
  if(hash === "telefon" || hash === "phone") setView("phone", false);
  else if(hash === "arvuti" || hash === "desktop") setView("web", false);
  else setView(sv === "phone" ? "phone" : "web");
  applyLang();
  go("cands");
})();

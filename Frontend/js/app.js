/* ------------------------------------------------------------------ */
/* Olek                                                                */
/* ------------------------------------------------------------------ */
var DEFAULTS = {
  skills:["commercial","floor"],
  access:["max10","stepfree"],
  sched:["evening","parttime"],
  pay:7
};
var S = {
  lang:"et",
  profile:{skills:DEFAULTS.skills.slice(),access:DEFAULTS.access.slice(),sched:DEFAULTS.sched.slice(),pay:DEFAULTS.pay},
  seen:[], saved:[], history:[], tab:"jobs", thread:null, step:0, draft:null,
  applied:[],   /* tööd, kuhu CV on saadetud — ootavad tööandja vastust */
  sent:{},      /* id -> {at, tailored, cv, file} */
  matched:[],   /* tööandja vastas samamoodi — alles siis avaneb vestlus */
  threads:{},
  cv:null,      /* täidetakse käivitusel CV põhjal */
  cvDraft:null, cvJob:null, cvLetter:null,
  view:"web"    /* laial ekraanil: "web" = täisekraan, "phone" = telefoniraam */
};
function t(){ return T[S.lang]; }
function $(id){ return document.getElementById(id); }

/* ------------------------------------------------------------------ */
/* Sobivusloogika — töö peab vastama KÕIGILE tingimustele              */
/* ------------------------------------------------------------------ */
function fits(job,p){
  // Kui tegemist on välise kuulutusega (CV Keskus või Töötukassa), lubame seda kaardipakki
  if(!job.isExternal && p.skills && p.skills.length > 0 && p.skills.indexOf(job.skill) === -1) return false;
  for(var i=0;i<p.access.length;i++){ if(job.accom.indexOf(p.access[i]) === -1) return false; }
  var okShift = false;
  if(!p.sched || p.sched.length === 0 || job.isExternal){
    okShift = true;
  } else {
    for(var j=0;j<p.sched.length;j++){ if(job.shifts.indexOf(p.sched[j]) !== -1) okShift = true; }
  }
  if(!okShift) return false;
  if(!job.isExternal && job.pay < p.pay) return false;
  return true;
}
function matching(p){ return JOBS.filter(function(j){ return fits(j,p||S.profile); }); }
function deck(){ return matching().filter(function(j){ return S.seen.indexOf(j.id) === -1; }); }

function num(n,d){
  var s = n.toFixed(d===undefined?2:d);
  return S.lang === "et" ? s.replace(".",",") : s;
}

/* ------------------------------------------------------------------ */
/* Kaardipakk                                                          */
/* ------------------------------------------------------------------ */
/* fotode asemel on prototüübis värvitaustad — päris pildid käivad siia samasse kohta */
function getJobHash(id){
  if(typeof id === "number") return id;
  var str = String(id || ""), hash = 0;
  for(var i = 0; i < str.length; i++){
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function photoBG(job, i){
  var numId = getJobHash(job.id);
  var h = (numId * 47 + i * 53) % 360;
  if(job.source === "tootukassa"){
    // Deep Estonia navy blue & royal sapphire/azure gradient for Töötukassa postings
    return "radial-gradient(120% 80% at 75% 15%, hsl("+((h+180)%360)+" 75% 36%), transparent 70%),"
         + "linear-gradient(155deg, hsl("+((h+210)%360)+" 65% 24%), hsl("+((h+230)%360)+" 75% 12%))";
  }
  if(job.isExternal){
    // Beautiful sunset / amber & violet gradient for external CV Keskus postings
    return "radial-gradient(120% 80% at 75% 15%, hsl("+((h+35)%360)+" 55% 36%), transparent 70%),"
         + "linear-gradient(155deg, hsl("+h+" 45% 26%), hsl("+((h+50)%360)+" 52% 14%))";
  }
  return "radial-gradient(120% 80% at 70% 15%, hsl("+((h+30)%360)+" 42% 34%), transparent 70%),"
       + "linear-gradient(155deg, hsl("+h+" 38% 30%), hsl("+((h+45)%360)+" 44% 14%))";
}

function cardHTML(job){
  var L = t();
  /* kaardil ainult kõige olulisem — terve kuulutus avaneb ⓘ nupust */
  var chips = [];
  job.shifts.forEach(function(s){
    if(S.profile.sched.indexOf(s) !== -1 && chips.length < 1) chips.push(tag(s));
  });
  S.profile.access.forEach(function(a){
    if(job.accom.indexOf(a) !== -1 && chips.length < 3) chips.push(tag(a));
  });
  job.accom.forEach(function(a){
    if(chips.indexOf(tag(a)) === -1 && chips.length < 3) chips.push(tag(a));
  });
  var rest = job.accom.length + 1 - chips.length;

  var sourcePill, sourceTag, redirectPill = "";
  if(job.source === "tootukassa"){
    sourcePill = '<span class="pill source-pill tootukassa">🇪🇪 Töötukassa</span>';
    sourceTag = '<span class="src-tag tootukassa">Töötukassa</span>';
    redirectPill = '<button type="button" class="pill redirect-pill" onclick="event.stopPropagation(); askRedirect(\'' + job.id + '\');">Töötukassasse ↗</button>';
  } else if(job.isExternal){
    sourcePill = '<span class="pill source-pill cvkeskus">🌐 CV Keskus</span>';
    sourceTag = '<span class="src-tag ext">CV Keskus</span>';
    redirectPill = '<button type="button" class="pill redirect-pill" onclick="event.stopPropagation(); askRedirect(\'' + job.id + '\');">CV Keskusesse ↗</button>';
  } else {
    sourcePill = '<span class="pill source-pill internal">⚡ Otsetöö</span>';
    sourceTag = '<span class="src-tag int">Otse tööandjalt</span>';
  }

  return ''
   + '<div class="photo' + (job.isExternal ? ' is-ext' : '') + '">'
   +   '<span class="glyph" aria-hidden="true">'+job.ini+'</span>'
   +   '<span class="segs" aria-hidden="true"><span class="on"></span><span></span><span></span></span>'
   +   '<span class="pill km">'+num(job.km,1)+' km</span>'
   +   sourcePill
   +   redirectPill
   +   '<span class="pill fitp">100%</span>'
   +   '<span class="phmark">'+L.photoMark+' 1/3</span>'
   +   '<span class="scrim">'
   +     '<h2 class="crole">'+(S.lang === "et" ? job.et : job.en)+'</h2>'
   +     '<span class="csub">'+job.co+' · '+sourceTag+' · '+L.posted(job.days)
   +       '<span class="cpay">'+num(job.pay)+' €/h</span></span>'
   +   '</span>'
   +   '<button type="button" class="infobtn" aria-label="'+L.more+'">i</button>'
   + '</div>'
   + '<div class="under"><ul class="chips accom">'
   +   chips.map(function(c){ return "<li>"+c+"</li>"; }).join("")
   +   (rest > 0 ? '<li class="plus">+'+rest+"</li>" : "")
   + '</ul></div>'
   + '<span class="stamp pass">'+L.pass+'</span>'
   + '<span class="stamp like">'+L.like+'</span>'
   + '<span class="stamp keep">'+L.save+'</span>';
}

function renderStack(){
  var L = t(), d = deck(), all = matching(), stack = $("stack");
  $("fCount").innerHTML = L.count(all.length, JOBS.length);
  $("fWhy").textContent = L.why;
  stack.innerHTML = "";

  if(d.length === 0){
    var none = all.length === 0;
    var box = document.createElement("div");
    box.className = "empty";
    box.innerHTML = '<h2>'+(none?L.noneH:L.emptyH)+'</h2><p>'+(none?L.noneP:L.emptyP)+'</p>';
    var b = document.createElement("button");
    b.type = "button"; b.className = "linkbtn";
    b.textContent = none ? L.noneBtn : L.emptyBtn;
    b.onclick = none ? openSetup : function(){ S.seen = []; renderStack(); };
    box.appendChild(b);

    if(none && JOBS.length > 0){
      var bAll = document.createElement("button");
      bAll.type = "button"; bAll.className = "linkbtn";
      bAll.style.display = "block";
      bAll.style.marginTop = "12px";
      bAll.style.fontWeight = "600";
      bAll.textContent = "🔓 Näita kõiki " + JOBS.length + " pakkumist (luba kõik valdkonnad)";
      bAll.onclick = function(){
        S.profile.skills = Object.keys(TAGS).filter(function(k){ return TAGS[k].g === "skills"; });
        S.profile.pay = 0;
        S.profile.access = [];
        S.profile.sched = [];
        S.seen = [];
        renderStack();
        renderProfile();
      };
      box.appendChild(bAll);
    }

    stack.appendChild(box);
    $("btnPass").disabled = true; $("btnLike").disabled = true; $("btnSave").disabled = true;
    $("btnUndo").disabled = S.history.length === 0;
    syncDesk();
    return;
  }

  $("btnPass").disabled = false; $("btnLike").disabled = false; $("btnSave").disabled = false;
  $("btnUndo").disabled = S.history.length === 0;
  d.slice(0,3).reverse().forEach(function(job,i,arr){
    var depth = arr.length - 1 - i;
    var el = document.createElement("article");
    el.className = "card";
    el.dataset.id = job.id;
    el.style.transform = "translateY("+(depth*-7)+"px) scale("+(1 - depth*0.035)+")";
    el.style.zIndex = String(10 - depth);
    el.innerHTML = cardHTML(job);
    el.querySelector(".photo").style.background = photoBG(job, 0);
    if(depth === 0){ el.setAttribute("aria-label", job.co+", "+(S.lang==="et"?job.et:job.en)); armDrag(el, job); }
    else { el.setAttribute("aria-hidden","true"); el.style.cursor = "default"; }
    stack.appendChild(el);
  });
  syncDesk();
}

function armDrag(el, job){
  var x0 = 0, y0 = 0, dx = 0, dy = 0, dragging = false, pid = null, t0 = 0;
  var like = el.querySelector(".stamp.like"), pass = el.querySelector(".stamp.pass");
  var keep = el.querySelector(".stamp.keep");
  function upward(){ return dy < 0 && Math.abs(dy) > Math.abs(dx) * 1.2; }

  var photo = el.querySelector(".photo"), segs = el.querySelectorAll(".segs span");
  var mark = el.querySelector(".phmark"), shot = 0, downT = null;

  function showPhoto(i){
    shot = (i + 3) % 3;
    photo.style.background = photoBG(job, shot);
    for(var k=0;k<segs.length;k++){ segs[k].className = k === shot ? "on" : ""; }
    mark.textContent = t().photoMark + " " + (shot+1) + "/3";
  }

  var infoBtn = el.querySelector(".infobtn");
  infoBtn.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
  infoBtn.addEventListener("click", function(e){ e.stopPropagation(); openDetail(job); });

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
      var k = Math.min(Math.abs(dx)/95, 1);
      like.style.opacity = dx > 0 ? k : 0;
      pass.style.opacity = dx < 0 ? k : 0;
      keep.style.opacity = 0;
    }
  });
  function end(e){
    if(!dragging || (e.pointerId !== undefined && e.pointerId !== pid)) return;
    dragging = false; el.classList.remove("drag");
    try{ el.releasePointerCapture(pid); }catch(err){}
    if(upward() && dy < -95){ keep.style.opacity = 1; doSave(el, job); return; }
    if(Math.abs(dx) > 95){ fly(el, job, dx > 0); return; }
    el.classList.add("anim");
    el.style.transform = "translate(0,0) rotate(0deg)";
    like.style.opacity = 0; pass.style.opacity = 0; keep.style.opacity = 0;
    /* lühike liikumatu puudutus: fotol = järgmine pilt, info peal = terve kuulutus */
    if(Math.abs(dx) < 7 && Math.abs(dy) < 7 && Date.now() - t0 < 500){
      var onInfo = downT && downT.closest && downT.closest(".scrim, .under");
      if(onInfo){ openDetail(job); return; }
      var r = photo.getBoundingClientRect();
      showPhoto(shot + (e.clientX - r.left < r.width * 0.33 ? -1 : 1));
    }
  }
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function fly(el, job, liked){
  var dir = liked ? 1 : -1;
  el.classList.add("anim");
  el.style.transform = "translate("+(dir*520)+"px,60px) rotate("+(dir*26)+"deg)";
  el.style.opacity = "0";
  el.querySelector(liked ? ".stamp.like" : ".stamp.pass").style.opacity = "1";
  setTimeout(function(){ decide(job, liked); }, 260);
}

function decide(job, liked){
  var L = t(), role = S.lang === "et" ? job.et : job.en;
  if(S.seen.indexOf(job.id) === -1) S.seen.push(job.id);
  S.history.push({id:job.id, act:liked ? "like" : "pass"});
  if(liked){
    if(S.applied.indexOf(job.id) === -1) S.applied.push(job.id);
    $("live").textContent = L.matched(role);
    showMatch(job);
  } else {
    $("live").textContent = L.passed(role);
    if(window.Api) Api.passJob(job.id);
  }
  renderStack(); renderBadge();
}

function topJob(){
  var top = $("stack").querySelector('.card[data-id]:last-child');
  if(!top) return null;
  return {el:top, job:JOBS.filter(function(j){ return String(j.id) === top.dataset.id; })[0]};
}
function swipeTop(liked){
  var t2 = topJob();
  if(t2 && t2.job) fly(t2.el, t2.job, liked);
}
function doSave(el, job){
  if(S.seen.indexOf(job.id) === -1) S.seen.push(job.id);
  if(S.saved.indexOf(job.id) === -1) S.saved.push(job.id);
  S.history.push({id:job.id, act:"save"});
  if(window.Api) Api.saveJob(job.id);
  $("live").textContent = t().saved(S.lang === "et" ? job.et : job.en);
  el.classList.add("anim");
  el.style.transform = "translateY(-560px) scale(.92)";
  el.style.opacity = "0";
  setTimeout(function(){ renderStack(); renderBadge(); }, 260);
}
function saveTop(){
  var t2 = topJob();
  if(t2 && t2.job) doSave(t2.el, t2.job);
}
function undo(){
  var last = S.history.pop();
  if(!last) return;
  var k = S.seen.indexOf(last.id);
  if(k !== -1) S.seen.splice(k,1);
  if(last.act === "like"){
    var m = S.applied.indexOf(last.id);
    if(m !== -1) S.applied.splice(m,1);
    var mm = S.matched.indexOf(last.id);
    if(mm !== -1) S.matched.splice(mm,1);
    delete S.sent[last.id];
    delete S.threads[last.id];
  }
  if(last.act === "save"){
    var s = S.saved.indexOf(last.id);
    if(s !== -1) S.saved.splice(s,1);
  }
  $("live").textContent = t().undone;
  renderStack(); renderBadge();
}

function nowHM(){
  var d = new Date();
  return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
}

/* ------------------------------------------------------------------ */
/* Kuulutuse täisvaade                                                 */
/* ------------------------------------------------------------------ */
var openJob = null;
/* kõrvalpaneel on ainult täisekraani arvutivaates — telefoniraamis mitte */
function deskVisible(){ return window.innerWidth >= 900 && S.view === "web"; }

function openDetail(job){
  /* laial ekraanil on kuulutus juba kõrvalpaneelis — ära ava sama asja uuesti */
  var t2 = topJob();
  if(deskVisible() && t2 && t2.job && t2.job.id === job.id){
    $("deskBody").scrollTop = 0;
    return;
  }
  openJob = job;
  renderDetail();
  $("detail").hidden = false;
  $("dBody").scrollTop = 0;
  $("dBack").focus();
}
function renderDetail(){
  if(!openJob) return;
  var L = t();
  $("dCo").textContent = openJob.co;
  $("dPass").textContent = L.pass;
  $("dLike").textContent = L.like;
  $("dBody").innerHTML = detailHTML(openJob);
}
function syncDesk(){
  if(!deskVisible()) return;
  var t2 = topJob();
  if(!t2 || !t2.job){
    $("deskCo").textContent = ""; $("deskIni").textContent = ""; $("deskBody").innerHTML = "";
    return;
  }
  var job = t2.job;
  $("deskCo").textContent = job.co;
  $("deskIni").textContent = job.ini;
  $("deskBody").innerHTML = '<h3 class="deskrole">'+(S.lang === "et" ? job.et : job.en)+'</h3>'
                          + detailHTML(job);
  $("deskBody").scrollTop = 0;
}
function detailHTML(job){
  var L = t(), D = DETAILS[job.id][S.lang];
  var role = S.lang === "et" ? job.et : job.en;

  var load = job.shifts.filter(function(s){ return s === "parttime" || s === "fulltime"; })
                       .map(function(s){ return tag(s); }).join(" · ") || L.noLoad;
  var facts = [
    [L.lPay, num(job.pay)+" €/h"],
    [L.lHours, D.hours],
    [L.lLoad, load],
    [L.lPlace, D.place+" · "+num(job.km,1)+" km"],
    [L.lStart, D.start]
  ];
  var mine = S.profile.access.filter(function(a){ return job.accom.indexOf(a) !== -1; });
  var other = job.accom.filter(function(a){ return mine.indexOf(a) === -1; });
  var reqs = S.lang === "et" ? job.reqEt : job.reqEn;

  var srcBadgeDetail;
  if(job.source === "tootukassa"){
    srcBadgeDetail = '<div class="dsource tootukassa"><span style="font-size:18px;">🇪🇪</span> <div style="flex:1;"><strong>Eesti Töötukassa kuulutus</strong><span>Ametlik riiklik tööpakkumine</span></div> <button type="button" class="dext-btn" onclick="askRedirect(\''+job.id+'\')">Ava kuulutus ↗</button></div>';
  } else if(job.isExternal){
    srcBadgeDetail = '<div class="dsource ext"><span style="font-size:18px;">🌐</span> <div style="flex:1;"><strong>CV Keskus / CV.ee kuulutus</strong><span>Automaatselt imporditud tööpakkumine</span></div> <button type="button" class="dext-btn" onclick="askRedirect(\''+job.id+'\')">Ava kuulutus ↗</button></div>';
  } else {
    srcBadgeDetail = '<div class="dsource int"><span style="font-size:18px;">⚡</span> <div><strong>Otse tööandjalt</strong><span>Sobib platvormi partner-ettevõtte pakkumine</span></div></div>';
  }

  return ''
   + '<div class="dhero">'
   +   '<span class="logo" aria-hidden="true">'+job.ini+'</span>'
   +   "<h3>"+role+"</h3>"
   +   '<span class="fit">100%</span>'
   + '</div>'
   + srcBadgeDetail
   + '<div class="dsect"><h4 class="glabel">'+L.dAbout+'</h4>'
   +   D.desc.map(function(p){ return "<p>"+p+"</p>"; }).join("")+'</div>'
   + '<div class="dsect"><h4 class="glabel">'+L.dPractical+'</h4>'
   +   '<dl class="facts">'+facts.map(function(f){
          return "<dt>"+f[0]+"</dt><dd>"+f[1]+"</dd>"; }).join("")+'</dl></div>'
   + '<div class="dsect"><h4 class="glabel">'+L.reqs+'</h4>'
   +   '<ul class="chips">'+reqs.map(function(r){ return "<li>"+r+"</li>"; }).join("")+'</ul></div>'
   + (mine.length ? '<div class="dsect"><h4 class="glabel">'+L.dYours+'</h4>'
   +   '<ul class="checks">'+mine.map(function(a){
          return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" '
               + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>'
               + tag(a)+"</li>"; }).join("")+'</ul></div>' : '')
   + (other.length ? '<div class="dsect"><h4 class="glabel">'+L.dOther+'</h4>'
   +   '<ul class="chips accom">'+other.map(function(a){ return "<li>"+tag(a)+"</li>"; }).join("")+'</ul></div>' : '')
   + '<div class="dsect"><h4 class="glabel">'+L.dOffers+'</h4>'
   +   '<ul class="bullets">'+D.offers.map(function(o){ return "<li>"+o+"</li>"; }).join("")+'</ul></div>'
   + '<p class="dnote">'+L.note+'</p>';
}
function closeDetail(){ $("detail").hidden = true; openJob = null; $("stack").focus(); }

/* ------------------------------------------------------------------ */
/* CV toimeti                                                          */
/* ------------------------------------------------------------------ */
function openCvEdit(job){
  S.cvJob = job;
  S.cvDraft = cloneCV();
  S.cvLetter = null;
  renderCvEdit();
  $("cvedit").hidden = false;
  $("cvBody").scrollTop = 0;
}

function field(label, key, value, multi){
  var tag = multi ? "textarea" : "input";
  return '<label class="cvf"><span>'+label+'</span>'
       + '<'+tag+' data-k="'+key+'"'+(multi ? ' rows="'+multi+'"' : ' type="text"')+'>'
       + (multi ? escapeHTML(value) : '')+'</'+tag+'>'
       + '</label>';
}

function renderCvEdit(){
  var L = t(), job = S.cvJob, d = S.cvDraft;
  var role = S.lang === "et" ? job.et : job.en;
  var wants = (S.lang === "et" ? job.reqEt : job.reqEn)
                .concat(job.accom.map(function(a){ return tag(a); }));

  $("cvHead").textContent = L.cvTitle;
  $("cvCancel").textContent = L.cvCancel;
  $("cvSend").textContent = L.cvSend;

  var html = ''
    + '<p class="cvfor">'+L.cvFor(job.co+" · "+role)+'</p>'
    + '<div class="cvhint"><h4>'+L.cvHintH+'</h4>'
    +   '<ul class="chips">'+wants.map(function(w){ return "<li>"+w+"</li>"; }).join("")+'</ul>'
    +   '<p>'+L.cvHintP+'</p></div>'
    + '<div class="cvgrid">'
    +   field(L.cvName,"name") + field(L.cvPhone,"phone")
    +   field(L.cvEmail,"email") + field(L.cvCity,"city")
    + '</div>'
    + field(L.cvSummary,"summary",d.summary,4)
    + '<h4 class="glabel cvsec">'+L.cvExp+'</h4><div id="cvExp"></div>'
    + '<button type="button" class="linkbtn cvadd" id="cvAddExp">+ '+L.cvAddExp+'</button>'
    + '<label class="cvf"><span>'+L.cvSkills+' <em>'+L.cvSkillsHint+'</em></span>'
    +   '<textarea data-k="skills" rows="4">'+escapeHTML(d.skills.join("\n"))+'</textarea></label>'
    + field(L.cvAvail,"availability",d.availability,3)
    + field(L.cvCond,"conditions",d.conditions,3)
    /* Kiri on CV kohandamise loogiline jätk, seega kõige lõpus */
    + '<h4 class="glabel cvsec">'+L.letterSection+'</h4>'
    + '<div class="letterbox" id="cvLetterBox"></div>';

  $("cvBody").innerHTML = html;
  renderCvLetter();

  /* lihtväljade väärtused paneme JS-iga, et jutumärgid ei lõhuks märgendit */
  ["name","phone","email","city"].forEach(function(k){
    var el = $("cvBody").querySelector('[data-k="'+k+'"]');
    if(el) el.value = d[k];
  });
  $("cvBody").addEventListener("input", readCvDraft);
  $("cvAddExp").onclick = function(){
    d.exp.push({role:"", org:"", period:"", text:""});
    renderCvExp();
  };
  renderCvExp();
}

function renderCvLetter(err){
  var L = t(), box = $("cvLetterBox");
  if(!box) return;
  var l = S.cvLetter;
  box.innerHTML = l
    ? '<p class="letterfile"><span class="lname">'+escapeHTML(l.name)+'</span>'
      + '<span class="lsize">'+fmtSize(l.size)+'</span></p>'
    : '<p class="letternone">'+L.letterNone+'</p>';

  var add = document.createElement("button");
  add.type = "button"; add.className = "linkbtn";
  add.textContent = l ? L.letterReplace : L.letterAdd;
  add.onclick = function(){
    pickLetter(function(picked, e){
      if(picked) S.cvLetter = picked;
      renderCvLetter(e);
    });
  };
  box.appendChild(add);

  if(l){
    var rm = document.createElement("button");
    rm.type = "button"; rm.className = "linkbtn";
    rm.textContent = L.letterRemove;
    rm.onclick = function(){ S.cvLetter = null; renderCvLetter(); };
    box.appendChild(rm);
  }

  var hint = document.createElement("p");
  hint.className = err ? "lerr" : "lhint";
  hint.textContent = err || L.letterHint;
  box.appendChild(hint);
}

function renderCvExp(){
  var L = t(), d = S.cvDraft, box = $("cvExp");
  box.innerHTML = "";
  d.exp.forEach(function(e, i){
    var card = document.createElement("div");
    card.className = "cvexp";
    card.innerHTML = '<div class="cvgrid">'
      + '<label class="cvf"><span>'+L.cvRole+'</span><input type="text" data-e="'+i+'" data-k="role"></label>'
      + '<label class="cvf"><span>'+L.cvOrg+'</span><input type="text" data-e="'+i+'" data-k="org"></label>'
      + '</div>'
      + '<label class="cvf"><span>'+L.cvPeriod+'</span><input type="text" data-e="'+i+'" data-k="period"></label>'
      + '<label class="cvf"><span>'+L.cvText+'</span><textarea rows="3" data-e="'+i+'" data-k="text">'+escapeHTML(e.text)+'</textarea></label>';
    var del = document.createElement("button");
    del.type = "button"; del.className = "cvdel"; del.textContent = L.cvDelExp;
    del.onclick = function(){ d.exp.splice(i,1); renderCvExp(); };
    card.appendChild(del);
    box.appendChild(card);
    ["role","org","period"].forEach(function(k){
      card.querySelector('[data-e="'+i+'"][data-k="'+k+'"]').value = e[k];
    });
  });
}

function readCvDraft(){
  var d = S.cvDraft, root = $("cvBody");
  ["name","phone","email","city","summary","availability","conditions"].forEach(function(k){
    var el = root.querySelector('[data-k="'+k+'"]:not([data-e])');
    if(el) d[k] = el.value;
  });
  var sk = root.querySelector('[data-k="skills"]');
  if(sk) d.skills = sk.value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean);
  d.exp.forEach(function(e, i){
    ["role","org","period","text"].forEach(function(k){
      var el = root.querySelector('[data-e="'+i+'"][data-k="'+k+'"]');
      if(el) e[k] = el.value;
    });
  });
}

function cvPreviewHTML(cv){
  var L = t();
  return ''
   + '<div class="cvdoc">'
   +   '<h3>'+escapeHTML(cv.name)+'</h3>'
   +   '<p class="cvmeta">'+escapeHTML(cv.phone)+' · '+escapeHTML(cv.email)+' · '+escapeHTML(cv.city)+'</p>'
   +   '<h4>'+L.cvSummary+'</h4><p>'+escapeHTML(cv.summary)+'</p>'
   +   '<h4>'+L.cvExp+'</h4>'
   +   cv.exp.map(function(e){
         return '<p class="cvexpline"><b>'+escapeHTML(e.role)+'</b>, '+escapeHTML(e.org)
              + ' <span class="cvper">'+escapeHTML(e.period)+'</span><br>'+escapeHTML(e.text)+'</p>';
       }).join("")
   +   '<h4>'+L.cvSkills+'</h4><ul class="bullets">'
   +     cv.skills.map(function(s){ return "<li>"+escapeHTML(s)+"</li>"; }).join("")+'</ul>'
   +   '<h4>'+L.cvAvail+'</h4><p>'+escapeHTML(cv.availability)+'</p>'
   +   '<h4>'+L.cvCond+'</h4><p>'+escapeHTML(cv.conditions)+'</p>'
   + '</div>';
}

function openCvView(id){
  var L = t(), rec = S.sent[id];
  if(!rec) return;
  var job = JOBS.filter(function(j){ return j.id === id; })[0];
  $("cvvHead").textContent = L.cvSentTitle;
  $("cvvBody").innerHTML = '<p class="cvfor">'+job.co+' · '+(S.lang === "et" ? job.et : job.en)+'</p>'
    + '<p class="cvfile"><span>'+L.cvFile+'</span>'+rec.file+'</p>'
    + (rec.letter ? '<p class="cvfile"><span>'+L.letterLabel+'</span>'+escapeHTML(rec.letter.name)+'</p>' : "")
    + cvPreviewHTML(rec.cv);
  $("cvview").hidden = false;
  $("cvvBody").scrollTop = 0;
}

/* ------------------------------------------------------------------ */
/* Match-ülekate                                                       */
/* ------------------------------------------------------------------ */
/* Swipe paremale ei ava vestlust, vaid küsib CV saatmise kohta.
   Vestlus avaneb alles siis, kui tööandja omalt poolt vastab. */
var pendingMatch = null;

function popup(big, txt, co, buttons){
  $("matchBig").textContent = big;
  $("matchCo").textContent = co || "";
  $("matchTxt").textContent = txt;
  var box = $("matchBtns");
  box.innerHTML = "";
  buttons.forEach(function(b){
    var el = document.createElement("button");
    el.type = "button";
    el.className = "bigbtn" + (b.ghost ? " ghost" : "");
    el.textContent = b.label;
    el.onclick = b.go;
    box.appendChild(el);
  });
  $("matchpop").hidden = false;
  var first = box.querySelector("button");
  if(first) first.focus();
}

function askRedirect(jobId){
  var job = JOBS.filter(function(j){ return String(j.id) === String(jobId); })[0];
  if(!job) return;
  var isTk = job.source === "tootukassa";
  var portalName = isTk ? "Töötukassa" : "CV Keskus";
  var portalIcon = isTk ? "🇪🇪" : "🌐";
  var targetUrl = job.externalUrl || (isTk ? "https://www.tootukassa.ee/et/toopakkumised" : "https://www.cvkeskus.ee");

  var bigText = portalIcon + " " + (S.lang === "et" ? (portalName + " tööpakkumine") : (portalName + " Job Offer"));
  var msgText = S.lang === "et"
    ? ("Kas soovid suunduda portaali " + portalName + " algsele kuulutuse lehele?")
    : ("Would you like to be redirected to the original job offer page on " + portalName + "?");

  popup(
    bigText,
    msgText,
    job.co + " · " + (S.lang === "et" ? job.et : job.en),
    [
      {
        label: S.lang === "et" ? ("Ava " + portalName + "s ↗") : ("Open in " + portalName + " ↗"),
        go: function(){
          $("matchpop").hidden = true;
          window.open(targetUrl, "_blank", "noopener,noreferrer");
          $("stack").focus();
        }
      },
      {
        label: S.lang === "et" ? "Loobu" : "Cancel",
        ghost: true,
        go: function(){
          $("matchpop").hidden = true;
          $("stack").focus();
        }
      }
    ]
  );
}

function showMatch(job){
  var L = t();
  pendingMatch = job.id;

  if (job.isExternal) {
    var isTk = job.source === "tootukassa";
    var portalName = isTk ? "Töötukassa" : "CV Keskus";
    var portalIcon = isTk ? "🇪🇪" : "🌐";
    var targetUrl = job.externalUrl || (isTk ? "https://www.tootukassa.ee/et/toopakkumised" : "https://www.cvkeskus.ee");

    var bigText = portalIcon + " " + (S.lang === "et" ? (portalName + " tööpakkumine") : (portalName + " Job Offer"));
    var msgText = S.lang === "et"
      ? ("See tööpakkumine pärineb portaalist " + portalName + ". Kas soovid suunduda otse " + portalName + " lehele sellele tööpakkumisele kandideerima?")
      : ("This job offer is hosted on " + portalName + ". Would you like to be redirected directly to " + portalName + " to view and apply for this job?");

    popup(
      bigText,
      msgText,
      job.co + " · " + (S.lang === "et" ? job.et : job.en),
      [
        {
          label: S.lang === "et" ? ("Ava " + portalName + "s ↗") : ("Open in " + portalName + " ↗"),
          go: function(){
            $("matchpop").hidden = true;
            if(window.Api) Api.applyJob(job.id, false, null);
            var file = portalName + "_veebilink";
            S.sent[job.id] = { at: nowHM(), tailored: false, cv: null, file: file, externalUrl: targetUrl };
            renderBadge();
            window.open(targetUrl, "_blank", "noopener,noreferrer");
            $("stack").focus();
          }
        },
        {
          label: S.lang === "et" ? "Salvesta töölauale ja jää äppi" : "Save and stay in app",
          ghost: true,
          go: function(){
            $("matchpop").hidden = true;
            if(window.Api) Api.saveJob(job.id);
            if(S.saved.indexOf(job.id) === -1) S.saved.push(job.id);
            renderBadge();
            $("stack").focus();
          }
        }
      ]
    );
    return;
  }

  popup(L.askBig, L.askTxt(job.co), job.co + " · " + (S.lang === "et" ? job.et : job.en), [
    {label:L.askYes, go:function(){ pendingLetter = null; askLetter(job, cloneCV(), false, null); }},
    {label:L.askEdit, ghost:true, go:function(){ $("matchpop").hidden = true; openCvEdit(job); }}
  ]);
}

/* ------------------------------------------------------------------ */
/* Motivatsioonikiri                                                   */
/*                                                                      */
/* Kiri on valikuline ja käib eraldi PDF-ina CV kõrval — kahe faili     */
/* üheks liitmine ei ole brauseris mõistlik ja kandideerimisel käivadki  */
/* need tavaliselt eraldi. Prototüüp hoiab failist ainult nime ja        */
/* suurust; päris üleslaadimine käiks api.js kaudu.                      */
/* ------------------------------------------------------------------ */
var MAX_LETTER = 10 * 1024 * 1024;

function fmtSize(bytes){
  var mb = bytes / (1024*1024);
  if(mb >= 1) return (S.lang === "et" ? mb.toFixed(1).replace(".",",") : mb.toFixed(1)) + " MB";
  var kb = Math.max(1, Math.round(bytes / 1024));
  return kb + " KB";
}

/* Avab seadme failivalija. done(letter|null, viga|null) */
function pickLetter(done){
  var L = t(), inp = $("letterFile");
  inp.value = "";
  inp.onchange = function(){
    var f = inp.files && inp.files[0];
    if(!f){ done(null, null); return; }
    if(f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)){ done(null, L.letterNotPdf); return; }
    if(f.size > MAX_LETTER){ done(null, L.letterTooBig); return; }
    done({name:f.name, size:f.size, file:f}, null);
  };
  inp.click();
}

/* Kiire tee: pärast „saada praegune" küsitakse kirja kohta */
var pendingLetter = null;

function askLetter(job, cv, tailored, err){
  var L = t(), btns = [];
  if(pendingLetter){
    btns.push({label:L.letterSend, go:function(){
      $("matchpop").hidden = true;
      sendCV(job, cv, tailored, pendingLetter);
    }});
    btns.push({label:L.letterReplace, ghost:true, go:function(){
      pickLetter(function(l, e){ if(l) pendingLetter = l; askLetter(job, cv, tailored, e); });
    }});
    btns.push({label:L.letterRemove, ghost:true, go:function(){
      pendingLetter = null; askLetter(job, cv, tailored, null);
    }});
  } else {
    btns.push({label:L.letterAdd, go:function(){
      pickLetter(function(l, e){ if(l) pendingLetter = l; askLetter(job, cv, tailored, e); });
    }});
    btns.push({label:L.letterSkip, ghost:true, go:function(){
      $("matchpop").hidden = true;
      sendCV(job, cv, tailored, null);
    }});
  }
  popup(
    L.letterBig,
    err || (pendingLetter ? L.letterChosen : L.letterTxt),
    pendingLetter ? pendingLetter.name + " · " + fmtSize(pendingLetter.size) : job.co,
    btns
  );
}

function cloneCV(){
  var src = S.cv[S.lang];
  return {
    name:S.cv.name, phone:S.cv.phone, email:S.cv.email, city:S.cv.city,
    summary:src.summary, availability:src.availability, conditions:src.conditions,
    skills:src.skills.slice(),
    exp:src.exp.map(function(e){ return {role:e.role, org:e.org, period:e.period, text:e.text}; })
  };
}

function slug(s){
  var from = "äöüõšžÄÖÜÕŠŽ", to = "aouoszAOUOSZ", out = "";
  for(var i=0;i<s.length;i++){
    var k = from.indexOf(s[i]);
    out += k === -1 ? s[i] : to[k];
  }
  return out.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sendCV(job, cv, tailored, letter){
  var L = t();
  popup(L.sendingBig, L.sendingTxt, job.co, []);
  var file = "CV_" + slug(cv.name) + "_" + slug(S.lang === "et" ? job.et : job.en) + ".pdf";
  /* Kiri läheb eraldi failina CV kõrval. Päris üleslaadimine kuulub api.js alla. */
  var shown = letter ? file + "  +  " + letter.name : file;
  if(window.Api) Api.applyJob(job.id, tailored, cv);
  setTimeout(function(){
    S.sent[job.id] = {
      at:nowHM(), tailored:tailored, cv:cv, file:file,
      letter: letter ? {name:letter.name, size:letter.size} : null
    };
    pendingLetter = null;
    renderBadge();
    popup(L.sentBig, L.sentTxt, shown, [
      {label:L.sentMore, go:function(){ $("matchpop").hidden = true; $("stack").focus(); }}
    ]);
  }, 1100);
}

/* ------------------------------------------------------------------ */
/* Sobivuste loend                                                     */
/* ------------------------------------------------------------------ */
function renderMatches(){
  var L = t();
  $("mTitle").textContent = L.mTitle;
  var any = S.applied.length || S.matched.length;
  $("mNote").textContent = any ? L.mNote : L.mEmpty;

  /* 1. Ootavad tööandja vastust — vestlust ei saa ise alustada */
  var waiting = S.applied.filter(function(id){ return S.matched.indexOf(id) === -1; });
  var al = $("aList");
  al.innerHTML = "";
  $("aTitle").hidden = waiting.length === 0;
  $("aTitle").textContent = L.sentTitle;
  waiting.slice().reverse().forEach(function(id){
    var job = JOBS.filter(function(j){ return j.id === id; })[0];
    if(!job) return;
    var rec = S.sent[id] || {};
    var li = document.createElement("li");
    li.className = "appcard";
    var portalName = job.source === "tootukassa" ? "Töötukassa" : (job.isExternal ? "CV Keskus" : "");
    var subText = job.isExternal ? (portalName + " veebikuulutus") : (rec.tailored ? L.cvTailored : L.cvOrig);
    li.innerHTML = '<div class="mrow flat">'
      + '<span class="logo" aria-hidden="true">'+job.ini+'</span>'
      + '<span class="who"><span class="co">'+job.co+' · '+(S.lang === "et" ? job.et : job.en)+'</span>'
      + '<span class="prev">'+L.sentAt(rec.at || "", subText)+'</span></span>'
      + '<span class="status wait">'+(job.isExternal ? portalName : L.statusWait)+'</span></div>';
    var row = document.createElement("div");
    row.className = "approw";
    if (job.isExternal) {
      var extBtn = document.createElement("button");
      extBtn.type = "button"; extBtn.className = "linkbtn";
      extBtn.textContent = "Ava " + portalName + "s ↗";
      extBtn.onclick = function(){ askRedirect(id); };
      row.appendChild(extBtn);
    } else {
      var view = document.createElement("button");
      view.type = "button"; view.className = "linkbtn"; view.textContent = L.viewSent;
      view.onclick = function(){ openCvView(id); };
      var sim = document.createElement("button");
      sim.type = "button"; sim.className = "linkbtn demo"; sim.textContent = L.simulate;
      sim.onclick = function(){ employerMatch(id); };
      row.appendChild(view); row.appendChild(sim);
    }
    li.appendChild(row);
    al.appendChild(li);
  });

  /* 2. Avatud vestlused — alles pärast tööandja vastust */
  var list = $("mList");
  list.innerHTML = "";
  $("cTitle").hidden = false;
  $("cTitle").textContent = L.chatTitle;
  if(S.matched.length === 0){
    var none = document.createElement("li");
    none.className = "emptyrow";
    none.textContent = L.chatEmpty;
    list.appendChild(none);
  }
  S.matched.slice().reverse().forEach(function(id){
    var job = JOBS.filter(function(j){ return j.id === id; })[0];
    var msgs = S.threads[id] || [];
    var last = msgs[msgs.length-1];
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button"; b.className = "mrow";
    b.innerHTML = '<span class="logo" aria-hidden="true">'+job.ini+'</span>'
      + '<span class="who"><span class="co">'+job.co+'</span>'
      + '<span class="prev">'+(last ? escapeHTML(S.lang==="et" ? (last.et||last.text) : (last.en||last.text)) : "")+'</span></span>'
      + (last && last.who === "them" ? '<span class="dot" aria-hidden="true"></span>' : '');
    b.onclick = function(){ openChat(id); };
    li.appendChild(b); list.appendChild(li);
  });

  var sl = $("sList");
  $("sTitle").hidden = S.saved.length === 0;
  sl.innerHTML = "";
  $("sTitle").textContent = L.savedTitle;
  S.saved.slice().reverse().forEach(function(id){
    var job = JOBS.filter(function(j){ return j.id === id; })[0];
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button"; b.className = "mrow";
    b.innerHTML = '<span class="logo" aria-hidden="true">'+job.ini+'</span>'
      + '<span class="who"><span class="co">'+(S.lang==="et"?job.et:job.en)+'</span>'
      + '<span class="prev">'+job.co+' · '+num(job.pay)+' €/h</span></span>';
    b.onclick = function(){ openDetail(job); };
    li.appendChild(b); sl.appendChild(li);
  });
}
function renderBadge(){
  var n = S.applied.length;
  var b = $("navBadge");
  b.textContent = String(n);
  b.hidden = n === 0;
}

/* ------------------------------------------------------------------ */
/* Vestlus                                                             */
/* ------------------------------------------------------------------ */
/* Kuni tööandja vaadet pole, saab tema vastust demo jaoks siit käivitada.
   Päris versioonis tuleb see tööandja enda swipe'ist. */
function employerMatch(id){
  if(S.matched.indexOf(id) === -1) S.matched.push(id);
  var job = JOBS.filter(function(j){ return j.id === id; })[0];
  if(!S.threads[id]){
    S.threads[id] = [{who:"them", et:job.firstEt, en:job.firstEn, time:nowHM()}];
  }
  if(window.Api) Api.simulateMatch(id);
  renderMatches(); renderBadge();
  openChat(id);
}

function openChat(id){
  S.thread = id;
  var job = JOBS.filter(function(j){ return j.id === id; })[0];
  $("chatTitle").textContent = job ? job.co : "Vestlus";
  renderMsgs();
  renderQuick();
  $("chat").hidden = false;
  $("msgInput").focus();
  loadChatMessages(id);
}

async function loadChatMessages(id){
  if(!window.Api) return;
  try {
    var conv = await Api.getConversation(id);
    if(conv && Array.isArray(conv.messages) && conv.messages.length > 0){
      S.threads[id] = conv.messages.map(function(m){
        return {
          who: m.isMe ? "me" : "them",
          text: m.content,
          time: m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : nowHM()
        };
      });
      if(S.thread === id) renderMsgs();
    }
  } catch(e) {
    console.warn("Could not fetch messages for chat:", e);
  }
}
function msgText(m){ return m.text !== undefined ? m.text : (S.lang === "et" ? m.et : m.en); }
function renderMsgs(){
  var box = $("msgs");
  box.innerHTML = '<span class="sysmsg">'+t().sys+'</span>';
  (S.threads[S.thread] || []).forEach(function(m){
    var d = document.createElement("div");
    d.className = "msg " + (m.who === "me" ? "me" : "them");
    d.innerHTML = escapeHTML(msgText(m)) + '<span class="time">'+m.time+'</span>';
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
function escapeHTML(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function send(text){
  if(!text.trim() || S.thread === null) return;
  var id = S.thread;
  S.threads[id].push({who:"me", text:text, time:nowHM()});
  renderMsgs();
  if(window.Api) Api.sendMessage(id, text);
  var pool = t().reply;
  var pick = pool[S.threads[id].length % pool.length];
  setTimeout(function(){
    if(S.thread === null) return;
    S.threads[id].push({who:"them", text:pick, time:nowHM()});
    renderMsgs(); renderMatches();
  }, 1100);
}

/* ------------------------------------------------------------------ */
/* Profiil                                                             */
/* ------------------------------------------------------------------ */
function renderProfile(){
  var L = t();
  $("pTitle").textContent = (S.cv && S.cv.name) ? S.cv.name : L.pTitle;
  $("pNote").textContent = (S.cv && S.cv.name) ? (L.pTitle + " · " + L.pNote) : L.pNote;
  $("pStatA").textContent = matching().length;
  $("pStatAL").textContent = L.statA;
  $("pStatB").textContent = S.matched.length;
  $("pStatBL").textContent = L.statB;
  $("pStatC").textContent = num(S.profile.pay) + " €";
  $("pStatCL").textContent = L.statC;
  $("btnSetup").textContent = L.setup;
  if($("toEmployer")) $("toEmployer").textContent = L.toEmployer;
  $("btnReset").textContent = L.reset;

  var groups = [["skills",L.gSkills],["access",L.gAccess],["sched",L.gSched]];
  $("pTags").innerHTML = groups.map(function(g){
    var ids = S.profile[g[0]];
    return '<div class="pgroup"><h3>'+g[1]+'</h3><ul class="chips">'
      + (ids.length ? ids.map(function(i){ return "<li>"+tag(i)+"</li>"; }).join("") : "<li>—</li>")
      + '</ul></div>';
  }).join("");
}

/* ------------------------------------------------------------------ */
/* Seadistusviisard                                                    */
/* ------------------------------------------------------------------ */
var STEPS = [
  {key:"skills", g:"skills"},
  {key:"access", g:"access"},
  {key:"sched",  g:"sched", pay:true}
];
function openSetup(){
  S.draft = {
    skills:S.profile.skills.slice(), access:S.profile.access.slice(),
    sched:S.profile.sched.slice(), pay:S.profile.pay
  };
  S.step = 0;
  $("setup").hidden = false;
  renderStep();
}
function renderStep(){
  var L = t(), st = STEPS[S.step];
  $("setupTitle").textContent = L.setupTitle;
  var dots = $("setup").querySelectorAll(".steps span");
  for(var i=0;i<dots.length;i++){ dots[i].className = i <= S.step ? "on" : ""; }
  $("stepH").textContent = L["step"+(S.step+1)+"H"];
  $("stepP").textContent = L["step"+(S.step+1)+"P"];
  $("stepBack").textContent = L.back;
  $("stepBack").disabled = S.step === 0;
  $("stepNext").textContent = S.step === STEPS.length-1 ? L.done : L.next;

  var body = $("stepBody");
  body.innerHTML = "";
  var grid = document.createElement("div");
  grid.className = "taggrid";
  Object.keys(TAGS).forEach(function(id){
    if(TAGS[id].g !== st.g) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "tag"; b.textContent = tag(id);
    var on = S.draft[st.key].indexOf(id) !== -1;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.onclick = function(){
      var arr = S.draft[st.key], k = arr.indexOf(id);
      if(k === -1) arr.push(id); else arr.splice(k,1);
      b.setAttribute("aria-pressed", k === -1 ? "true" : "false");
      liveCount();
    };
    grid.appendChild(b);
  });
  body.appendChild(grid);

  if(st.pay){
    var wrap = document.createElement("div");
    wrap.style.marginTop = "20px";
    wrap.innerHTML = '<h3 class="glabel" style="margin:0 0 6px">'+L.minPay+'</h3>'
      + '<div class="payrow"><span class="v" id="payV">'+num(S.draft.pay)+'</span><span class="u">€/h</span></div>';
    var r = document.createElement("input");
    r.type = "range"; r.min = "5"; r.max = "12"; r.step = "0.1";
    r.value = String(S.draft.pay); r.id = "payRange";
    r.setAttribute("aria-label", L.minPay);
    r.oninput = function(){
      S.draft.pay = parseFloat(r.value);
      $("payV").textContent = num(S.draft.pay);
      liveCount();
    };
    wrap.appendChild(r);
    body.appendChild(wrap);
  }
  liveCount();
}
function liveCount(){
  $("liveCount").innerHTML = t().live(matching(S.draft).length);
}

/* ------------------------------------------------------------------ */
/* Navigatsioon ja keel                                                */
/* ------------------------------------------------------------------ */
function go(tab){
  S.tab = tab;
  $("viewJobs").hidden = tab !== "jobs";
  $("viewMatches").hidden = tab !== "matches";
  $("viewProfile").hidden = tab !== "profile";
  [["navJobs","jobs"],["navMatches","matches"],["navProfile","profile"]].forEach(function(p){
    if(tab === p[1]) $(p[0]).setAttribute("aria-current","page");
    else $(p[0]).removeAttribute("aria-current");
  });
  if(tab === "matches"){
    renderMatches();
    syncInteractionsFromDb();
  }
  if(tab === "profile") renderProfile();
}

/* remember=false: ühekordne vaade (nt lingist #telefon). Nii ei jää tavaline
   index.html hiljem telefonivaatesse kinni — eelistust muudab ainult lüliti. */
function setView(v, remember){
  S.view = v;
  var shell = $("shell");
  shell.classList.toggle("web", v === "web");
  shell.classList.toggle("framed", v === "phone");
  $("viewWeb").setAttribute("aria-pressed", v === "web" ? "true" : "false");
  $("viewPhone").setAttribute("aria-pressed", v === "phone" ? "true" : "false");
  if(remember !== false){
    try{ localStorage.setItem("sobib-vaade", v); }catch(err){}
  }
  renderStack();
}

function applyLang(){
  var L = t();
  $("viewWeb").title = L.viewWeb;
  $("viewPhone").title = L.viewPhone;
  $("viewWeb").setAttribute("aria-label", L.viewWeb);
  $("viewPhone").setAttribute("aria-label", L.viewPhone);
  $("demochip").textContent = L.demo;
  $("langEt").setAttribute("aria-pressed", S.lang === "et" ? "true" : "false");
  $("langEn").setAttribute("aria-pressed", S.lang === "en" ? "true" : "false");
  $("labPass").textContent = L.pass;
  $("labLike").textContent = L.like;
  $("labUndo").textContent = L.undo;
  $("labSave").textContent = L.save;
  $("btnPass").setAttribute("aria-label", L.pass);
  $("btnLike").setAttribute("aria-label", L.like);
  $("btnUndo").setAttribute("aria-label", L.undo);
  $("btnSave").setAttribute("aria-label", L.save);
  $("hint").textContent = L.hint;
  $("btnFilters").textContent = L.filters;
  $("navJobsL").textContent = L.navJobs;
  $("navMatchesL").textContent = L.navMatches;
  $("navProfileL").textContent = L.navProfile;
  $("stack").setAttribute("aria-label", L.navJobs);
  if($("namePopTitle")) $("namePopTitle").textContent = L.namePopTitle || "Tere tulemast!";
  if($("namePopSubtitle")) $("namePopSubtitle").textContent = L.namePopSubtitle || "Sisesta oma nimi, et alustada tööde sirvimist.";
  if($("nameInput")) $("nameInput").placeholder = L.namePopPlaceholder || "Sinu nimi / Your name";
  if($("nameSubmit")) $("nameSubmit").textContent = L.namePopBtn || "Alusta";
  renderStack(); renderBadge();
  if(S.tab === "matches") renderMatches();
  if(S.tab === "profile") renderProfile();
  if(!$("setup").hidden) renderStep();
  if(!$("detail").hidden) renderDetail();
  if(!$("cvedit").hidden) renderCvEdit();
  if(!$("chat").hidden){ renderMsgs(); renderQuick(); }
}

/* ------------------------------------------------------------------ */
/* Sündmused                                                           */
/* ------------------------------------------------------------------ */
$("btnPass").onclick = function(){ swipeTop(false); };
$("btnLike").onclick = function(){ swipeTop(true); };
$("btnSave").onclick = saveTop;
$("btnUndo").onclick = undo;
$("btnFilters").onclick = openSetup;
$("btnSetup").onclick = openSetup;
$("btnReset").onclick = function(){
  S.profile = {skills:DEFAULTS.skills.slice(),access:DEFAULTS.access.slice(),sched:DEFAULTS.sched.slice(),pay:DEFAULTS.pay};
  S.seen = []; S.applied = []; S.sent = {}; S.matched = []; S.saved = []; S.history = []; S.threads = {};
  S.cv = CV;
  renderStack(); renderBadge(); renderProfile(); go("jobs");
};
$("navJobs").onclick = function(){
  go("jobs");
  if(window.refreshJobsFromBackend) refreshJobsFromBackend();
};
if($("btnRefreshJobs")){
  $("btnRefreshJobs").onclick = async function(){
    $("btnRefreshJobs").textContent = "⏳ Laadin...";
    if(window.refreshJobsFromBackend) await refreshJobsFromBackend();
    if(window.syncInteractionsFromDb) await syncInteractionsFromDb();
    setTimeout(function(){ $("btnRefreshJobs").textContent = "🔄 Värskenda"; }, 400);
  };
}
$("navMatches").onclick = function(){ go("matches"); };
$("navProfile").onclick = function(){ go("profile"); };

$("viewWeb").onclick = function(){ setView("web"); };
$("viewPhone").onclick = function(){ setView("phone"); };

$("langEt").onclick = function(){ S.lang = "et"; applyLang(); };
$("langEn").onclick = function(){ S.lang = "en"; applyLang(); };

$("setupClose").onclick = function(){ $("setup").hidden = true; };
$("stepBack").onclick = function(){ if(S.step > 0){ S.step--; renderStep(); } };
$("stepNext").onclick = function(){
  if(S.step < STEPS.length-1){ S.step++; renderStep(); return; }
  S.profile = {skills:S.draft.skills.slice(),access:S.draft.access.slice(),sched:S.draft.sched.slice(),pay:S.draft.pay};
  /* uute filtritega saab varem vahele jäetud tööd uuesti näha; sobivused jäävad pakist välja */
  S.seen = S.applied.concat(S.saved);
  $("setup").hidden = true;
  renderStack(); renderProfile(); go("jobs");
};

$("dBack").onclick = closeDetail;
$("dPass").onclick = function(){ $("detail").hidden = true; openJob = null; swipeTop(false); };
$("dLike").onclick = function(){ $("detail").hidden = true; openJob = null; swipeTop(true); };

$("cvBack").onclick = function(){ $("cvedit").hidden = true; S.cvJob = null; };
$("cvCancel").onclick = function(){ $("cvedit").hidden = true; S.cvJob = null; };
$("cvSend").onclick = function(){
  readCvDraft();
  var job = S.cvJob;
  $("cvedit").hidden = true;
  S.cvJob = null;
  var letter = S.cvLetter;
  S.cvLetter = null;
  sendCV(job, S.cvDraft, true, letter);
};
$("cvvBack").onclick = function(){ $("cvview").hidden = true; };

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
    var top = $("stack").querySelector('.card[data-id]:last-child');
    if(!top) return;
    var job = JOBS.filter(function(j){ return String(j.id) === top.dataset.id; })[0];
    if(job){ e.preventDefault(); openDetail(job); }
  }
});
document.addEventListener("keydown", function(e){
  if(e.key !== "Escape") return;
  if(!$("namepop").hidden) return;
  if(!$("matchpop").hidden){ $("matchpop").hidden = true; return; }
  if(!$("cvview").hidden){ $("cvview").hidden = true; return; }
  if(!$("cvedit").hidden){ $("cvedit").hidden = true; S.cvJob = null; return; }
  if(!$("detail").hidden){ closeDetail(); return; }
  if(!$("chat").hidden){ $("chat").hidden = true; S.thread = null; renderMatches(); return; }
  if(!$("setup").hidden){ $("setup").hidden = true; }
});

/* ------------------------------------------------------------------ */
/* Backend-integreerimine ja sessioon                                  */
/* ------------------------------------------------------------------ */
function mapBackendJob(bj){
  var id = bj.id;
  DETAILS[id] = {
    et: {
      desc: [bj.description],
      hours: bj.workingHours || "",
      place: bj.location || "",
      start: bj.startDateText || "",
      offers: bj.offers || []
    },
    en: {
      desc: [bj.description],
      hours: bj.workingHours || "",
      place: bj.location || "",
      start: bj.startDateText || "",
      offers: bj.offers || []
    }
  };
  return {
    id: id,
    co: bj.companyName,
    ini: bj.companyInitials || (bj.companyName ? bj.companyName.substring(0,2).toUpperCase() : "JO"),
    pay: Number(bj.hourlyPay),
    km: Number(bj.distanceKm) || 2.0,
    days: 1,
    skill: bj.primarySkill,
    et: bj.title,
    en: bj.title,
    isExternal: bj.isExternal !== undefined ? !!bj.isExternal : (typeof bj.id === "string" && !bj.employerProfileId),
    source: bj.source || (bj.isExternal ? "cvkeskus" : "internal"),
    externalUrl: bj.externalUrl || (bj.source === "tootukassa" ? "https://www.tootukassa.ee/et/toopakkumised" : (bj.isExternal ? "https://www.cvkeskus.ee" : null)),
    shifts: bj.shifts || [],
    accom: bj.accommodations || [],
    reqEt: bj.requirements || [],
    reqEn: bj.requirements || [],
    firstEt: bj.firstMessage || "Tere! Nägin su profiili.",
    firstEn: bj.firstMessage || "Hi! Saw your profile."
  };
}

async function syncInteractionsFromDb(){
  if(!window.Api) return;
  try {
    var results = await Promise.all([
      Api.getApplied(),
      Api.getSaved(),
      Api.getConversations()
    ]);
    var appliedData = results[0] || [];
    var savedData = results[1] || [];
    var convs = results[2] || [];

    // 1. Process Saved Jobs
    if(Array.isArray(savedData)){
      savedData.forEach(function(item){
        var j = item.job;
        if(!j) return;
        var jId = j.id;
        if(S.saved.indexOf(jId) === -1) S.saved.push(jId);
        if(S.seen.indexOf(jId) === -1) S.seen.push(jId);

        // Tagame, et kuulutus on JOBS nimekirjas olemas
        if(!JOBS.some(function(existing){ return existing.id === jId; })){
          JOBS.push(mapBackendJob(j));
        }
      });
    }

    // 2. Process Applied Jobs
    if(Array.isArray(appliedData)){
      appliedData.forEach(function(app){
        var j = app.job;
        if(!j) return;
        var jId = j.id;
        if(S.applied.indexOf(jId) === -1) S.applied.push(jId);
        if(S.seen.indexOf(jId) === -1) S.seen.push(jId);

        if(!S.sent[jId]){
          var dateStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : nowHM();
          S.sent[jId] = {
            at: dateStr,
            tailored: !!app.isTailoredCv,
            cv: S.cv,
            file: "CV_" + slug((S.cv && S.cv.name) || "Candidate") + ".pdf"
          };
        }

        // Tööandja vastus / match
        if(app.status === "Accepted" || app.hasConversation){
          if(S.matched.indexOf(jId) === -1) S.matched.push(jId);
        }

        if(!JOBS.some(function(existing){ return existing.id === jId; })){
          JOBS.push(mapBackendJob(j));
        }
      });
    }

    // 3. Process Conversations & Messages
    if(Array.isArray(convs)){
      convs.forEach(function(c){
        var j = c.job;
        if(!j) return;
        var jId = j.id;
        if(S.matched.indexOf(jId) === -1) S.matched.push(jId);

        if(!S.threads[jId] || S.threads[jId].length === 0){
          if(c.lastMessage){
            S.threads[jId] = [{
              who: c.lastMessage.senderRole === "Employer" ? "them" : "me",
              text: c.lastMessage.content,
              time: c.lastMessage.sentAt ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : nowHM()
            }];
          } else if(j.firstMessage) {
            S.threads[jId] = [{
              who: "them",
              et: j.firstMessage,
              en: j.firstMessage,
              time: nowHM()
            }];
          }
        }
      });
    }

    renderBadge();
    renderStack();
    if(S.tab === "matches") renderMatches();
  } catch(err) {
    console.warn("Error syncing interactions from DB:", err);
  }
}

async function initBackendSession(name){
  if(!window.Api) return;
  try {
    Api.setCandidate(name);

    // 1. Kontrolli või laadi kandidaadi profiil andmebaasist
    var dbProfile = await Api.getProfile();
    if(dbProfile){
      if(dbProfile.fullName) S.cv.name = dbProfile.fullName;
      if(dbProfile.minHourlyPay) S.profile.pay = dbProfile.minHourlyPay;
      if(Array.isArray(dbProfile.skills) && dbProfile.skills.length > 0) S.profile.skills = dbProfile.skills;
      if(Array.isArray(dbProfile.accommodations) && dbProfile.accommodations.length > 0) S.profile.access = dbProfile.accommodations;
      if(Array.isArray(dbProfile.schedules) && dbProfile.schedules.length > 0) S.profile.sched = dbProfile.schedules;
      if(dbProfile.city) S.cv.city = dbProfile.city;
      if(dbProfile.phone) S.cv.phone = dbProfile.phone;
      if(dbProfile.summary){
        if(S.cv.et) S.cv.et.summary = dbProfile.summary;
        if(S.cv.en) S.cv.en.summary = dbProfile.summary;
      }
      if(Array.isArray(dbProfile.experiences) && dbProfile.experiences.length > 0){
        var mappedExp = dbProfile.experiences.map(function(e){
          return { role: e.roleTitle, org: e.organization, period: e.period, text: e.description };
        });
        if(S.cv.et) S.cv.et.exp = mappedExp;
        if(S.cv.en) S.cv.en.exp = mappedExp;
      }
    } else {
      await Api.updateProfile({
        fullName: name,
        minHourlyPay: S.profile.pay,
        skills: S.profile.skills,
        accommodations: S.profile.access,
        schedules: S.profile.sched,
        summary: S.cv && S.cv.et ? S.cv.et.summary : "",
        availability: S.cv && S.cv.et ? S.cv.et.availability : "",
        conditions: S.cv && S.cv.et ? S.cv.et.conditions : "",
        experiences: S.cv && S.cv.et ? (S.cv.et.exp || []).map(function(e){
          return { roleTitle: e.role, organization: e.org, period: e.period, description: e.text };
        }) : []
      });
    }

    var bJobs = await Api.getAllJobs();
    if(bJobs && bJobs.length > 0){
      JOBS = bJobs.map(mapBackendJob);
    }

    // Laadi selle kandidaadi salvestatud ja kandideeritud tööd andmebaasist
    await syncInteractionsFromDb();

    renderStack();
    renderBadge();
    renderProfile();
    if(deskVisible()) syncDesk();
  } catch(err) {
    console.warn("Backend session sync error:", err);
  }
}

async function refreshJobsFromBackend(){
  if(!window.Api) return;
  try {
    var bJobs = await Api.getAllJobs();
    if(bJobs && bJobs.length > 0){
      JOBS = bJobs.map(mapBackendJob);
      renderStack();
      renderBadge();
      if(deskVisible()) syncDesk();
    }
  } catch(err) {
    console.warn("refreshJobsFromBackend error:", err);
  }
}
window.refreshJobsFromBackend = refreshJobsFromBackend;

window.addEventListener("focus", function(){
  refreshJobsFromBackend();
  if(window.syncInteractionsFromDb) syncInteractionsFromDb();
});

document.addEventListener("visibilitychange", function(){
  if(!document.hidden){
    refreshJobsFromBackend();
    if(window.syncInteractionsFromDb) syncInteractionsFromDb();
  }
});

/* ------------------------------------------------------------------ */
/* Käivitus (+ oleku säilitamine uuendusel)                            */
/* ------------------------------------------------------------------ */
function start(saved){
  if(saved && saved.profile){
    S.lang = saved.lang || "et";
    S.profile = saved.profile;
    S.seen = saved.seen || [];
    S.applied = saved.applied || [];
    S.sent = saved.sent || {};
    S.matched = saved.matched || [];
    S.saved = saved.saved || [];
    S.history = saved.history || [];
    S.threads = saved.threads || {};
  }
  var hash = (location.hash || "").replace("#", "").toLowerCase();
  var sv = null;
  try{ sv = localStorage.getItem("sobib-vaade"); }catch(err){}
  if(hash === "telefon" || hash === "phone") setView("phone", false);
  else if(hash === "arvuti" || hash === "desktop") setView("web", false);
  else setView(sv === "phone" ? "phone" : "web");

  if(!S.cv) S.cv = JSON.parse(JSON.stringify(CV));
  applyLang();
  go("jobs");

  // Laadi kohe andmebaasist värsked tööpakkumised
  refreshJobsFromBackend();

  // Kuva nime pop-up uue sessiooni alguses
  var pop = $("namepop");
  if(pop){
    pop.hidden = false;
    var inp = $("nameInput");
    if(inp){
      inp.value = "";
      setTimeout(function(){ inp.focus(); }, 100);
    }
  }

  var form = $("nameForm");
  if(form){
    form.onsubmit = function(e){
      e.preventDefault();
      var val = ($("nameInput").value || "").trim();
      if(!val) return;
      if(S.cv) S.cv.name = val;
      if(window.Api) Api.setCandidate(val);
      $("namepop").hidden = true;
      initBackendSession(val);
    };
  }
}

if(window.claude && window.claude.hot){
  window.claude.hot.snapshot(function(){
    return {lang:S.lang, profile:S.profile, seen:S.seen, applied:S.applied, sent:S.sent,
            matched:S.matched, saved:S.saved, history:S.history, threads:S.threads};
  });
}
if(window.claude && window.claude.hot && window.claude.hot.ready){
  window.claude.hot.ready(start);
} else {
  start((window.claude && window.claude.hot && window.claude.hot.data) || null);
}


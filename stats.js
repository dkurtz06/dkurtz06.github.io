/* Live stats for gavinkurtzsoccer.com: reads games.json (written by the game tracker)
   and fills the club tables and adds tracked high school games to the MaxPreps totals.
   HS games before HS_CUTOFF are already in the MaxPreps numbers and are ignored here. */
(function(){
 var HS_CUTOFF = "2026-10-16";
 function n(x){return parseInt(String(x||0).replace(/[^0-9]/g,""),10)||0;}
 function fmt(x){return Number(x).toLocaleString("en-US");}
 function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
 function season(d){var y=+d.slice(0,4),m=+d.slice(5,7);return m>=8?y+"–"+String(y+1).slice(2):(y-1)+"–"+String(y).slice(2);}
 function sum(gs){var t={gp:gs.length,min:0,g:0,a:0,sh:0,sog:0};gs.forEach(function(x){t.min+=n(x.min);t.g+=n(x.g);t.a+=n(x.a);t.sh+=n(x.sh);t.sog+=n(x.sog);});t.pts=2*t.g+t.a;return t;}
 function dlabel(d){var p=d.split("-");return new Date(+p[0],p[1]-1,+p[2]).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
 function res(x){if(x.status==="live")return '<span class="live">Live</span>'+(x.us!=null?" "+esc(x.us)+"-"+esc(x.them):"");
  if(x.us==null||x.us==="")return "—";var u=n(x.us),t=n(x.them);return (u>t?"W ":u<t?"L ":"T ")+u+"-"+t;}
 var L=["Date","Opponent","Result","Min","G","A","Sh","SOG"];
 function row(c,tot){return '<tr'+(tot?' class="tot"':'')+'>'+c.map(function(v,i){return '<td data-l="'+L[i]+'"'+(i>2?' class="n"':'')+'>'+v+'</td>';}).join("")+'</tr>';}
 function strip(t,lbl){return '<div class="statstrip" aria-label="'+esc(lbl)+'"><div><b>'+t.gp+'</b><span>Games</span></div><div><b>'+t.g+'</b><span>Goals</span></div><div><b>'+t.a+'</b><span>Assists</span></div><div><b>'+fmt(t.min)+'</b><span>Minutes</span></div></div>';}
 function go(data){
  var games=(data&&data.games||[]).filter(function(x){return x&&x.date&&x.team;}).sort(function(a,b){return a.date<b.date?1:-1;});
  var club=games.filter(function(x){return x.team==="club";});
  var hs=games.filter(function(x){return x.team==="hs"&&x.date>=HS_CUTOFF;});
  // ---- club, stats page
  var box=document.getElementById("club-stats");
  if(box&&club.length){
   var bySea={};club.forEach(function(x){(bySea[season(x.date)]=bySea[season(x.date)]||[]).push(x);});
   var keys=Object.keys(bySea).sort().reverse(),h="";
   keys.forEach(function(k,i){var gs=bySea[k],t=sum(gs);
    h+=(i?'<h3 class="sea">'+k+' season</h3>':'')+(i===0?strip(t,k+" club season totals")+'<div style="height:16px"></div>':'');
    h+='<div class="tbl tbl--stack"><table><caption class="sr">FC Pride Elite '+k+' game log</caption><thead><tr>'+L.map(function(x,j){return '<th scope="col"'+(j>2?' class="n"':'')+'>'+x+'</th>';}).join("")+'</tr></thead><tbody>'+
     gs.map(function(x){return row([dlabel(x.date),esc(x.opp),res(x),x.min||0,x.g||0,x.a||0,x.sh||0,x.sog||0]);}).join("")+
     row([k+" season","",t.gp+" GP",fmt(t.min),t.g,t.a,t.sh,t.sog],true)+'</tbody></table></div>';});
   if(keys.length>1){var c=sum(club);h+='<div class="tbl"><table><tbody>'+row(["Club career","",c.gp+" GP",fmt(c.min),c.g,c.a,c.sh,c.sog],true)+'</tbody></table></div>';}
   h+='<p class="fine">Logged by the family during each game and posted automatically.</p>';
   box.innerHTML=h;
  }
  // ---- club, home page strip
  var cs=document.getElementById("club-strip");
  if(cs&&club.length){var k=season(club[0].date),t=sum(club.filter(function(x){return season(x.date)===k;}));
   cs.innerHTML=strip(t,"FC Pride Elite "+k+" totals")+'<p class="fine">FC Pride Elite ECNL RL, '+k+' season. <a href="/stats.html">Game log →</a></p>';cs.hidden=false;}
  // ---- high school: add tracked seasons to the MaxPreps table and career totals
  var tb=document.getElementById("hs-body");
  if(hs.length){
   var by={};hs.forEach(function(x){(by[season(x.date)]=by[season(x.date)]||[]).push(x);});
   var all=sum(hs);
   if(tb){var tot=tb.querySelector("tr.tot");
    Object.keys(by).sort().forEach(function(k){var t=sum(by[k]);var tr=document.createElement("tr");
     var v=[k,"",t.gp,fmt(t.min),t.g,t.a,t.pts,t.sh,t.sog],lb=["Season","Year","GP","Min","G","A","Pts","Sh","SOG"];
     tr.innerHTML=v.map(function(c,i){return '<td'+(i>1?' class="n"':'')+' data-l="'+lb[i]+'">'+c+'</td>';}).join("");tb.insertBefore(tr,tb.firstChild);});
    if(tot){var td=tot.querySelectorAll("td");var add=[null,null,all.gp,all.min,all.g,all.a,all.pts,all.sh,all.sog];
     add.forEach(function(a,i){if(a==null||!td[i])return;var keep=td[i].textContent.indexOf("*")>-1?"*":"";td[i].textContent=fmt(n(td[i].textContent)+a)+keep;});}}
   [].forEach.call(document.querySelectorAll("[data-hs]"),function(el){var k=el.getAttribute("data-hs");el.textContent=fmt(n(el.textContent)+(all[k]||0));});
  }
 }
 fetch("/games.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(go).catch(function(){});
})();

// ====== SUPABASE CONFIG ======
// Replace these two values with your Supabase project URL and anon/publishable key.
// NEVER put a Supabase service_role key here.
const SUPABASE_URL = "https://rojyugmsdwcuucegekha.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JCG1dB9G7WikDppUwZUdvQ_krw1CdvS";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let state = {patients:[], therapists:[], visits:[], payments:[], notes:[]};

const $ = id => document.getElementById(id);
const money = n => "৳" + Number(n||0).toLocaleString("en-BD");
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const today = () => new Date().toISOString().slice(0,10);

document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(tab){document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));$(tab).classList.remove("hidden");document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));renderAll();}

async function loadAll(){
  const results = await Promise.all([
    sb.from("patients").select("*").order("created_at",{ascending:false}),
    sb.from("therapists").select("*").order("name"),
    sb.from("visits").select("*").order("visit_date",{ascending:false}),
    sb.from("payments").select("*").order("payment_date",{ascending:false}),
    sb.from("treatment_notes").select("*").order("created_at",{ascending:false})
  ]);
  const [p,t,v,pay,n]=results;
  for(const r of results) if(r.error) throw r.error;
  state={patients:p.data||[],therapists:t.data||[],visits:v.data||[],payments:pay.data||[],notes:n.data||[]};
  renderAll();
}

function renderAll(){renderDashboard();renderPatients();renderTherapists();renderVisits();renderPayments();renderReports();}

function renderDashboard(){
  const todayVisits=state.visits.filter(v=>v.visit_date?.slice(0,10)===today());
  const paid=state.payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const due=state.visits.reduce((s,v)=>s+Math.max(0,Number(v.fee||0)-Number(v.paid||0)),0);
  $("stats").innerHTML=[
    ["👥","Patients",state.patients.length],["📅","Today's Visits",todayVisits.length],
    ["💰","Total Collected",money(paid)],["🔴","Total Due",money(due)]
  ].map(x=>`<div class="stat"><span>${x[0]} ${x[1]}</span><b>${x[2]}</b></div>`).join("");
  $("todayVisits").innerHTML=todayVisits.length?todayVisits.map(visitCard).join(""):`<div class="muted">No visits scheduled today.</div>`;
}
function visitCard(v){
  const p=state.patients.find(x=>x.id===v.patient_id), t=state.therapists.find(x=>x.id===v.therapist_id);
  return `<div class="item"><b>${esc(p?.name||"Unknown")}</b> — ${esc(v.visit_date?.slice(11,16)||"")}<br><span class="muted">${esc(t?.name||"")} · ${esc(v.status||"Scheduled")}</span><div class="actions"><button class="secondary small" onclick="editVisit('${v.id}')">Edit</button>${v.status!=="Completed"?`<button class="primary small" onclick="completeVisit('${v.id}')">Complete</button>`:""}</div></div>`;
}

function renderPatients(){
  const q=($("patientSearch").value||"").toLowerCase();
  const rows=state.patients.filter(p=>(p.name+" "+(p.phone||"")).toLowerCase().includes(q));
  $("patientRows").innerHTML=rows.map(p=>{
    const due=state.visits.filter(v=>v.patient_id===p.id).reduce((s,v)=>s+Math.max(0,Number(v.fee||0)-Number(v.paid||0)),0);
    return `<tr><td><b>${esc(p.name)}</b><br><small>${esc(p.address||"")}</small></td><td>${esc(p.phone||"")}</td><td>${esc(p.diagnosis||"")}</td><td class="due">${money(due)}</td><td class="actions"><button class="secondary small" onclick="editPatient('${p.id}')">Edit</button><button class="ghost small" onclick="patientHistory('${p.id}')">History</button></td></tr>`;
  }).join("")||`<tr><td colspan="5" class="muted">No patients found.</td></tr>`;
}

function renderTherapists(){
  $("therapistRows").innerHTML=state.therapists.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.phone||"")}</td><td>${esc(t.specialization||"")}</td><td><button class="secondary small" onclick="editTherapist('${t.id}')">Edit</button></td></tr>`).join("")||`<tr><td colspan="4" class="muted">No therapists yet.</td></tr>`;
}
function renderVisits(){
  const d=$("visitDateFilter").value,s=$("visitStatusFilter").value;
  let rows=state.visits.filter(v=>(!d||v.visit_date?.slice(0,10)===d)&&(!s||v.status===s));
  $("visitRows").innerHTML=rows.map(v=>{
    const p=state.patients.find(x=>x.id===v.patient_id),t=state.therapists.find(x=>x.id===v.therapist_id);
    const due=Math.max(0,Number(v.fee||0)-Number(v.paid||0));
    return `<tr><td>${esc(v.visit_date?.replace("T"," ")||"")}</td><td>${esc(p?.name||"")}</td><td>${esc(t?.name||"")}</td><td>${money(v.fee)}<br><small>Paid ${money(v.paid)} · <span class="due">Due ${money(due)}</span></small></td><td><span class="badge">${esc(v.status)}</span></td><td class="actions"><button class="secondary small" onclick="editVisit('${v.id}')">Edit</button>${due?`<button class="primary small" onclick="collectForVisit('${v.id}')">Collect</button>`:""}</td></tr>`;
  }).join("")||`<tr><td colspan="6" class="muted">No visits found.</td></tr>`;
}
function renderPayments(){
  $("paymentRows").innerHTML=state.payments.map(p=>{const pt=state.patients.find(x=>x.id===p.patient_id);return `<tr><td>${esc(p.payment_date)}</td><td>${esc(pt?.name||"")}</td><td>${money(p.amount)}</td><td>${esc(p.method||"")}</td><td>${esc(p.note||"")}</td><td><button class="secondary small" onclick="editPayment('${p.id}')">Edit</button></td></tr>`}).join("")||`<tr><td colspan="6" class="muted">No payments yet.</td></tr>`;
}
function renderReports(){
  const paid=state.payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const billed=state.visits.reduce((s,v)=>s+Number(v.fee||0),0);
  const due=Math.max(0,billed-paid);
  $("reportCards").innerHTML=[["Visits",state.visits.length],["Billed",money(billed)],["Collected",money(paid)],["Outstanding",money(due)]].map(x=>`<div class="stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
  const items=state.patients.map(p=>{const vs=state.visits.filter(v=>v.patient_id===p.id);const d=vs.reduce((s,v)=>s+Math.max(0,Number(v.fee||0)-Number(v.paid||0)),0);return {p,d}}).filter(x=>x.d>0).sort((a,b)=>b.d-a.d);
  $("dueReport").innerHTML=items.length?items.map(x=>`<div class="item"><b>${esc(x.p.name)}</b><span class="due"> ${money(x.d)}</span></div>`).join(""):"<div class='muted'>No outstanding due.</div>";
}

function openModal(title,html){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").classList.remove("hidden")}
$("closeModal").onclick=()=>$("modal").classList.add("hidden");

function patientForm(p={}){
 return `<form id="entityForm" class="form-grid">
 <input type="hidden" name="id" value="${p.id||""}">
 <label>Patient Name<input name="name" required value="${esc(p.name)}"></label>
 <label>Phone<input name="phone" value="${esc(p.phone)}"></label>
 <label>Age<input name="age" type="number" value="${p.age??""}"></label>
 <label>Gender<select name="gender"><option ${p.gender==="Male"?"selected":""}>Male</option><option ${p.gender==="Female"?"selected":""}>Female</option><option ${p.gender==="Other"?"selected":""}>Other</option></select></label>
 <label>Diagnosis<input name="diagnosis" value="${esc(p.diagnosis)}"></label>
 <label>Referred By<input name="referred_by" value="${esc(p.referred_by)}"></label>
 <label class="full">Address<textarea name="address">${esc(p.address)}</textarea></label>
 <label class="full">Emergency Contact<input name="emergency_contact" value="${esc(p.emergency_contact)}"></label>
 <label class="full">Treatment Plan<textarea name="treatment_plan">${esc(p.treatment_plan)}</textarea></label>
 <div class="full form-actions"><button type="button" class="ghost" onclick="closeModal()">Cancel</button><button class="primary">Save Patient</button></div></form>`;
}
function therapistForm(t={}){
 return `<form id="entityForm" class="form-grid"><input type="hidden" name="id" value="${t.id||""}">
 <label>Name<input name="name" required value="${esc(t.name)}"></label><label>Phone<input name="phone" value="${esc(t.phone)}"></label>
 <label class="full">Specialization<input name="specialization" value="${esc(t.specialization)}"></label>
 <div class="full form-actions"><button type="button" class="ghost" onclick="closeModal()">Cancel</button><button class="primary">Save Therapist</button></div></form>`;
}
function visitForm(v={}){
 const pt=state.patients.map(p=>`<option value="${p.id}" ${v.patient_id===p.id?"selected":""}>${esc(p.name)}</option>`).join("");
 const th=state.therapists.map(t=>`<option value="${t.id}" ${v.therapist_id===t.id?"selected":""}>${esc(t.name)}</option>`).join("");
 return `<form id="entityForm" class="form-grid"><input type="hidden" name="id" value="${v.id||""}">
 <label>Patient<select name="patient_id" required>${pt}</select></label><label>Therapist<select name="therapist_id" required>${th}</select></label>
 <label>Date & Time<input name="visit_date" type="datetime-local" required value="${v.visit_date?v.visit_date.slice(0,16):""}"></label>
 <label>Fee<input name="fee" type="number" min="0" step="1" value="${v.fee??""}" required></label>
 <label>Paid<input name="paid" type="number" min="0" step="1" value="${v.paid??0}"></label>
 <label>Status<select name="status">${["Scheduled","Completed","Cancelled","Rescheduled"].map(x=>`<option ${v.status===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <label class="full">Visit Notes<textarea name="notes">${esc(v.notes)}</textarea></label>
 <div class="full form-actions"><button type="button" class="ghost" onclick="closeModal()">Cancel</button><button class="primary">Save Visit</button></div></form>`;
}
function paymentForm(p={},visitId=""){
 const ps=state.patients.map(x=>`<option value="${x.id}" ${p.patient_id===x.id?"selected":""}>${esc(x.name)}</option>`).join("");
 return `<form id="entityForm" class="form-grid"><input type="hidden" name="id" value="${p.id||""}">
 <label>Patient<select name="patient_id" required>${ps}</select></label><label>Date<input name="payment_date" type="date" value="${p.payment_date||today()}" required></label>
 <label>Amount<input name="amount" type="number" min="1" required value="${p.amount??""}"></label>
 <label>Method<select name="method"><option>Cash</option><option>bKash</option><option>Nagad</option><option>Bank</option></select></label>
 <label class="full">Note<textarea name="note">${esc(p.note)}</textarea></label>
 <input type="hidden" name="visit_id" value="${visitId||p.visit_id||""}">
 <div class="full form-actions"><button type="button" class="ghost" onclick="closeModal()">Cancel</button><button class="primary">Save Payment</button></div></form>`;
}

function formData(form){return Object.fromEntries(new FormData(form).entries())}
function closeModal(){$("modal").classList.add("hidden")}

$("addPatientBtn").onclick=()=>{openModal("Add Patient",patientForm());$("entityForm").onsubmit=savePatient};
window.editPatient=id=>{const p=state.patients.find(x=>x.id===id);openModal("Edit Patient",patientForm(p));$("entityForm").onsubmit=savePatient};
async function savePatient(e){e.preventDefault();const d=formData(e.target);d.age=d.age?Number(d.age):null;const r=await sb.from("patients").upsert(d).select().single();if(r.error)return alert(r.error.message);closeModal();await loadAll()}

$("addTherapistBtn").onclick=()=>{openModal("Add Therapist",therapistForm());$("entityForm").onsubmit=saveTherapist};
window.editTherapist=id=>{const t=state.therapists.find(x=>x.id===id);openModal("Edit Therapist",therapistForm(t));$("entityForm").onsubmit=saveTherapist};
async function saveTherapist(e){e.preventDefault();const d=formData(e.target);const r=await sb.from("therapists").upsert(d).select().single();if(r.error)return alert(r.error.message);closeModal();await loadAll()}

function openVisit(v={}){if(!state.patients.length||!state.therapists.length)return alert("Please add at least one patient and one therapist first.");openModal(v.id?"Edit Visit":"Add Visit",visitForm(v));$("entityForm").onsubmit=saveVisit}
$("addVisitBtn").onclick=()=>openVisit();$("addVisitFromDash").onclick=()=>openVisit();
window.editVisit=id=>openVisit(state.visits.find(x=>x.id===id));
async function saveVisit(e){e.preventDefault();const d=formData(e.target);d.fee=Number(d.fee||0);d.paid=Number(d.paid||0);const r=await sb.from("visits").upsert(d).select().single();if(r.error)return alert(r.error.message);closeModal();await loadAll()}
window.completeVisit=async id=>{const r=await sb.from("visits").update({status:"Completed"}).eq("id",id);if(r.error)alert(r.error.message);else loadAll()};

$("addPaymentBtn").onclick=()=>{if(!state.patients.length)return alert("Add a patient first.");openModal("Collect Payment",paymentForm());$("entityForm").onsubmit=savePayment};
window.collectForVisit=id=>{const v=state.visits.find(x=>x.id===id), p=state.patients.find(x=>x.id===v.patient_id);const due=Math.max(0,Number(v.fee||0)-Number(v.paid||0));openModal(`Collect Payment — ${p?.name||""}`,paymentForm({patient_id:v.patient_id},id));$("entityForm").querySelector('[name="amount"]').value=due||"";$("entityForm").onsubmit=savePayment};
window.editPayment=id=>{const p=state.payments.find(x=>x.id===id);openModal("Edit Payment",paymentForm(p));$("entityForm").onsubmit=savePayment};
async function savePayment(e){
 e.preventDefault();const d=formData(e.target);d.amount=Number(d.amount);
 const r=await sb.from("payments").upsert(d).select().single();if(r.error)return alert(r.error.message);
 if(d.visit_id){const v=state.visits.find(x=>x.id===d.visit_id);if(v){const newPaid=Number(v.paid||0)+Number(d.amount);const u=await sb.from("visits").update({paid:newPaid}).eq("id",v.id);if(u.error)return alert(u.error.message)}}
 closeModal();await loadAll();
}

window.patientHistory=id=>{
 const p=state.patients.find(x=>x.id===id), vs=state.visits.filter(v=>v.patient_id===id), pays=state.payments.filter(x=>x.patient_id===id);
 const due=vs.reduce((s,v)=>s+Math.max(0,Number(v.fee||0)-Number(v.paid||0)),0);
 openModal(`${p?.name||"Patient"} — History`, `<p><b>Diagnosis:</b> ${esc(p?.diagnosis||"")}<br><b>Phone:</b> ${esc(p?.phone||"")}<br><b>Due:</b> <span class="due">${money(due)}</span></p><h4>Visits</h4>${vs.map(v=>`<div class="item">${esc(v.visit_date?.replace("T"," "))} · ${money(v.fee)} · Paid ${money(v.paid)} · ${esc(v.status)}</div>`).join("")||"<div class='muted'>No visits.</div>"}<h4>Payments</h4>${pays.map(x=>`<div class="item">${esc(x.payment_date)} · ${money(x.amount)} · ${esc(x.method)}</div>`).join("")||"<div class='muted'>No payments.</div>"}`);
};

$("patientSearch").oninput=renderPatients;$("visitDateFilter").onchange=renderVisits;$("visitStatusFilter").onchange=renderVisits;$("refreshBtn").onclick=()=>loadAll();

$("loginForm").onsubmit=async e=>{e.preventDefault();$("loginMsg").textContent="";const r=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(r.error)$("loginMsg").textContent=r.error.message;else initApp(r.data.user)};
$("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.reload()};

async function initApp(user){$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("userEmail").textContent=user?.email||"";try{await loadAll()}catch(e){alert("Database error: "+e.message)}}
sb.auth.getSession().then(({data})=>{if(data.session)initApp(data.session.user)});

if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});

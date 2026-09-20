import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,onSnapshot,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const firebaseConfig={apiKey:'AIzaSyCa3ntHg9DqV3JefcvFP9cg8xCmwm0wlLo',authDomain:'facturacion-drink.firebaseapp.com',projectId:'facturacion-drink',storageBucket:'facturacion-drink.firebasestorage.app',messagingSenderId:'1093109447685',appId:'1:1093109447685:web:a3015f3494f757a625b06c'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const deviceId='aire-principal',ref=name=>doc(db,'qpAir',deviceId,'sync',name),$=id=>document.getElementById(id);
let state={power:false,temp:24,mode:3,fan:0,swing:false,turbo:false},reported=null,unsub=null,pending=null,debounce=null,timeout=null,serverReady=false,session=0;
const names={3:'Frío',2:'Seco',7:'Ventilar',8:'Automático'};
function online(){const age=Date.now()-(reported?.lastSeenMs||0);return navigator.onLine&&serverReady&&reported&&age>=-15000&&age<90000;}
function message(s){$('status').textContent=s;}
function render(){
 $('temperature').textContent=state.temp;$('modeLabel').textContent=names[state.mode];$('powerLabel').textContent=state.power?'ENCENDIDO · AJUSTE':'APAGADO · AJUSTE';$('powerText').textContent=state.power?'Apagar aire':'Encender aire';$('power').classList.toggle('on',state.power);
 document.querySelector('.dial').style.setProperty('--sweep',`${30+(state.temp-16)/14*250}deg`);
 document.querySelectorAll('[data-mode]').forEach(b=>{const active=+b.dataset.mode===state.mode;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
 document.querySelectorAll('[data-fan]').forEach(b=>{const active=+b.dataset.fan===state.fan;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
 ['swing','turbo'].forEach(k=>document.querySelector(`[data-action=${k}]`).setAttribute('aria-pressed',state[k]));
 const ok=online();$('connection').textContent=ok?'● Disponible':'Sin conexión';$('connection').classList.toggle('online',!!ok);
 document.querySelectorAll('#dashboard button').forEach(b=>b.disabled=!ok||!!pending);
 $('lastSeen').textContent=reported?.lastSeenMs?'Última comunicación · '+new Date(reported.lastSeenMs).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'Sin comunicación todavía';
}
function cancel(){clearTimeout(debounce);clearTimeout(timeout);debounce=null;pending=null;}
function fail(text){cancel();if(reported?.state)state={...reported.state};message(text);render();}
async function send(){
 debounce=null;if(!online()||pending){fail('Tarjeta no disponible');return;}
 const id=crypto.randomUUID(),mySession=session;pending=id;render();message('Enviando ajustes…');
 timeout=setTimeout(()=>{if(pending===id)fail('Sin confirmación. Comprueba la tarjeta.');},35000);
 try {await setDoc(ref('command'),{id,bootId:reported.bootId,baseRevision:reported.revision,createdMs:Date.now(),createdAt:serverTimestamp(),state:{...state}});if(session===mySession&&pending===id)message('Esperando transmisión IR…');}
 catch(e){if(session===mySession&&pending===id)fail(e.code==='permission-denied'?'Acceso denegado. Revisa las reglas.':'No se pudo enviar. Revisa tu conexión.');}
}
document.querySelector('#dashboard').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled||!online()||pending)return;
 if(b.dataset.mode)state.mode=+b.dataset.mode;
 if(b.dataset.fan){state.fan=+b.dataset.fan;state.turbo=false;}
 switch(b.dataset.action){case 'minus':state.temp=Math.max(16,state.temp-1);break;case 'plus':state.temp=Math.min(30,state.temp+1);break;case 'power':state.power=!state.power;break;case 'swing':state.swing=!state.swing;state.turbo=false;break;case 'turbo':state.turbo=!state.turbo;if(state.turbo){state.fan=5;state.swing=true;}break;}
 render();message('Preparando ajustes…');clearTimeout(debounce);debounce=setTimeout(send,450);
});
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('enter').disabled=true;$('loginError').textContent='';try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value='';}catch(e){$('loginError').textContent=e.code==='auth/network-request-failed'?'No hay conexión. Inténtalo de nuevo.':'No se pudo iniciar sesión. Revisa correo, contraseña y configuración de Authentication.';}finally{$('enter').disabled=false;}});
$('logout').onclick=()=>signOut(auth);
onAuthStateChanged(auth,user=>{
 session++;cancel();unsub?.();reported=null;serverReady=false;$('login').hidden=!!user;$('dashboard').hidden=!user;$('logout').hidden=!user;
 if(!user)return;message('Conectando con la tarjeta…');render();
 unsub=onSnapshot(ref('reported'),{includeMetadataChanges:true},snap=>{
  serverReady=!snap.metadata.fromCache;if(!snap.exists()){message('Falta vincular o conectar la tarjeta');render();return;}
  const previous=reported;reported=snap.data();
  if(pending&&reported.ackId===pending){cancel();message('Señal IR transmitida');}
  else if(pending&&previous&&(reported.bootId!==previous.bootId||reported.revision!==previous.revision)){fail('El estado cambió en la tarjeta. Vuelve a intentarlo.');}
  else if(!pending&&!debounce)message('Ajustes sincronizados');
  if(!pending&&!debounce&&reported.state)state={...reported.state};render();
 },()=>{serverReady=false;fail('No se pudo leer el estado. Revisa acceso y reglas.');});
});
window.addEventListener('offline',()=>fail('Sin internet'));window.addEventListener('online',render);setInterval(render,5000);

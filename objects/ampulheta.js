// Ampulheta: 2 placas de 12 lados, 3 colunas, vidro e areia. É a única com areia, timer e virada.
(function(){
const PLATE_R=.62,PIN=.98,POUT=1.1,PILLAR_D=.52,NECK=.05,BULB=.36,GH=.97,SIDES=12;
const glassR=y=>{const s=clamp(Math.abs(y)/GH,0,1);return NECK+BULB*Math.pow(Math.max(Math.sin(Math.PI*Math.pow(s,.85)),0),.6)+.12*Math.pow(s,6)};
const pillarR=y=>{const u=Math.abs(y);return .032+.022*Math.exp(-(((u-.86)/.035)**2))+.016*Math.exp(-((y/.05)**2))+.008*Math.cos(y*18)**2};
function plate(ylo,yhi){const N=240;for(let j=0;j<N;j++){const a=TAU*j/N,c=(Math.floor(a/(TAU/SIDES))+.5)*TAU/SIDES,rr=PLATE_R*Math.cos(Math.PI/SIDES)/Math.cos(a-c);
 for(let i=0;i<6;i++){const y=ylo+(yhi-ylo)*i/5;add(rr*Math.cos(a),y,rr*Math.sin(a),Math.cos(c),0,Math.sin(c),a,0,0)}
 for(let i=0;i<28;i++){const f=.02+.98*i/27;add(f*rr*Math.cos(a),yhi,f*rr*Math.sin(a),0,1,0,a,0,0);add(f*rr*Math.cos(a),ylo,f*rr*Math.sin(a),0,-1,0,a,0,0)}}}
function buildHourglass(){plate(FLOOR,-PIN);plate(PIN,POUT);
 for(let k=0;k<3;k++){const phi=-Math.PI/2+k*TAU/3,ox=PILLAR_D*Math.cos(phi),oz=PILLAR_D*Math.sin(phi);
  revolve(pillarR,-PIN,PIN,150,20,(x,y,z,nx,ny,nz)=>add(x+ox,y,z+oz,nx,ny,nz,phi,1,k))}
 revolve(glassR,-GH,GH,150,200,(x,y,z,nx,ny,nz,a)=>add(x,y,z,nx,ny,nz,a,2,0))}
function sandState(t){if(t<DONE){const top=clamp((t-6.5)/1.1,0,1);return{ft:top*(1-sandF),fb:top*sandF,flow:0}}return{ft:1-sandF,fb:sandF,flow:sandF}}
function sand(t,a){
 const {ft,fb,flow}=sandState(t);
 const emit=(x,y,z,nx,ny,nz)=>{const l=Math.hypot(nx,ny,nz);prep(x,y,z,nx/l,ny/l,nz/l,a);light();
  const b=.16+.75*L.dif+.2*L.rl;put(S,letter(b,qX,qY,false,hash3(x*40,y*40,z*40)),b,0,1)};
 const heap=(base,h,rmax,pw)=>{for(let i=0;i<30;i++){const rf=i/29;for(let j=0;j<150;j++){const an=TAU*j/150,c=Math.cos(an),s=Math.sin(an);
  const y=base+h*Math.pow(1-rf,pw),sl=-h*pw*Math.pow(1-rf,pw-1+1e-6)/rmax;emit(rf*rmax*c,y,rf*rmax*s,-sl*c,1,-sl*s)}}};
 const wall=(y0,y1)=>{if(y1-y0<.01)return;revolve(y=>glassR(y)*.95,y0,y1,Math.floor(80*(y1-y0))+2,150,(x,y,z,nx,ny,nz)=>emit(x,y,z,nx,ny,nz))};
 if(ft>.01){const lv=.03+.52*ft,dip=flow>0?.1:0;heap(lv-dip,dip,glassR(lv)*.95,1);wall(.03,lv)}
 const fl=-GH+.03,base=fl+.3*fb,cone=.22*Math.min(1,fb*3);
 if(fb>.005){heap(base,cone,glassR(base)*.95,1.3);wall(fl,base)}
 if(flow>0&&flow<.85&&ft>.02)for(let i=0;i<70;i++){const y=.03+(base+cone-.03)*i/69;prep((rnd()-.5)*.02,y,(rnd()-.5)*.02,0,0,1,a);put(S,["|",":","!"].map(c=>IX[c])[Math.floor(rnd()*3)],.7,0,1)}}

(window.OBJECT_DEFS=window.OBJECT_DEFS||[]).push({id:'ampulheta',label:'ampulheta',sand:true,build:buildHourglass,draw:sand,
  retime(A){for(let i=0;i<A.x.length;i++){const a=A.a[i],y=A.y[i],k=A.k[i]; // ordem em que cada parte aparece
   if(k==0){const d=(((a-Math.PI/2)+Math.PI)%TAU+TAU)%TAU-Math.PI;A.t[i]=.3+1.5*Math.abs(d)/Math.PI+(y>0?3.2:0)}
   else if(k==1)A.t[i]=2+1.5*(y+PIN)/(2*PIN)+A.id[i]*.15;
   else A.t[i]=4.9+1.5*Math.abs(y)/GH+.12*a/TAU}}});
})();

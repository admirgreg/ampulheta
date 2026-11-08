// BMW M4 GT3 Evo (em estudo, fora do menu). Para testar: adicione <script src="_em-estudo/bmw.js"></script> antes do script.js.
(function(){
// — BMW M4 GT3 Evo: carroceria por seções (superelipses), estufa de vidro, rodas, aerofólio —
const G=-.30,CL=1.05; // G = altura do chão (topo da plataforma); CL = meio comprimento do carro
const curve=pts=>{const n=pts.length,m=pts.map((p,i)=>i==0?(pts[1][1]-p[1])/(pts[1][0]-p[0]):i==n-1?(p[1]-pts[i-1][1])/(p[0]-pts[i-1][0]):(pts[i+1][1]-pts[i-1][1])/(pts[i+1][0]-pts[i-1][0]));
 return x=>{if(x<=pts[0][0])return pts[0][1];if(x>=pts[n-1][0])return pts[n-1][1];let i=1;while(x>pts[i][0])i++;
  const x0=pts[i-1][0],h=pts[i][0]-x0,t=(x-x0)/h,t2=t*t,t3=t2*t;
  return(2*t3-3*t2+1)*pts[i-1][1]+(t3-2*t2+t)*h*m[i-1]+(-2*t3+3*t2)*pts[i][1]+(t3-t2)*h*m[i]}};
const topC=curve([[-1.05,.40],[-.95,.43],[-.8,.44],[-.5,.43],[-.2,.42],[.2,.42],[.5,.41],[.65,.39],[.8,.365],[.95,.34],[1.05,.32]]); // capô / linha da cintura / tampa
const botC=curve([[-1.05,.075],[-.9,.09],[-.7,.045],[-.2,.035],[.4,.035],[.8,.03],[1.05,.028]]);                                  // assoalho + difusor
const widC=curve([[-1.05,.40],[-.8,.44],[-.4,.43],[0,.42],[.4,.43],[.7,.44],[1.05,.40]]);                                        // meia-largura
const roofC=curve([[-.8,.44],[-.5,.5],[-.3,.545],[-.05,.555],[.1,.54],[.3,.48],[.52,.42]]);                                       // teto
const gwC=curve([[-.8,.30],[-.5,.335],[-.1,.34],[.3,.35],[.52,.37]]);                                                             // largura da cabine
const tapW=x=>1-.38*Math.pow(Math.max(0,(Math.abs(x)-.88)/.17),2); // cantos arredondados na frente e na traseira
const sgn=(a,p)=>Math.sign(a)*Math.pow(Math.abs(a),p);
function surf(fn,cy,nu,nv,k,tf,skip){const e=1e-4; // varre uma superfície paramétrica; as normais saem por diferenças finitas
 for(let i=0;i<nu;i++){const u=i/(nu-1),ue=u+e>1?u-e:u+e,sg=ue>u?1:-1;
  for(let j=0;j<nv;j++){const v=j/nv,P=fn(u,v),Pu=fn(ue,v),Pv=fn(u,v+e);if(skip&&skip(P[0],P[1],P[2]))continue;
   const du=[(Pu[0]-P[0])*sg,(Pu[1]-P[1])*sg,(Pu[2]-P[2])*sg],dv=[Pv[0]-P[0],Pv[1]-P[1],Pv[2]-P[2]];
   let nx=dv[1]*du[2]-dv[2]*du[1],ny=dv[2]*du[0]-dv[0]*du[2],nz=dv[0]*du[1]-dv[1]*du[0];const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
   const ox=Math.abs(P[0])>.9?P[0]*4:0,oy=P[1]-cy(u),oz=P[2];if(nx*ox+ny*oy+nz*oz<0){nx=-nx;ny=-ny;nz=-nz}
   add(P[0],P[1],P[2],nx,ny,nz,Math.atan2(P[2],P[0]),typeof k==='function'?k(P[0],P[1],P[2],u,v):k,0,tf(P[0],P[1],P[2],u,v))}}}
function wheel(xa,s,tb){const R=.152,yc=G+R,w=.13,zc=s*.335,zo=zc+s*w/2,T=a=>tb+.5*a/TAU;
 for(let j=0;j<110;j++){const a=TAU*j/110,c=Math.cos(a),sn=Math.sin(a);
  for(let q=0;q<7;q++)add(xa+R*c,yc+R*sn,zc+s*(q/6-.5)*w,c,sn,0,a,3,0,T(a)); // pneu (kind 3 = borracha, mais escura)
  for(let r=.1;r<=R;r+=.012)add(xa+r*c,yc+r*sn,zo,0,0,s,a,3,0,T(a));
  add(xa+.098*c,yc+.098*sn,zo+s*.004,c,sn,0,a,1,0,T(a)+.3)} // lábio do aro
 for(let k=0;k<10;k++){const a=TAU*k/10+.2,ca2=Math.cos(a),sa2=Math.sin(a); // 10 raios
  for(let r=.03;r<=.096;r+=.006)for(const o of[-.007,0,.007])add(xa+r*ca2-sa2*o,yc+r*sa2+ca2*o,zo,0,0,s,a,1,0,tb+.4+r*3)}
 for(let r=0;r<=.032;r+=.006)for(let j=0;j<14;j++){const a=TAU*j/14;add(xa+r*Math.cos(a),yc+r*Math.sin(a),zo+s*.006,0,0,s,a,1,0,tb+.4)} // cubo
 for(let r=.04;r<=.082;r+=.008)for(let j=0;j<60;j++){const a=TAU*j/60;add(xa+r*Math.cos(a),yc+r*Math.sin(a),zo-s*.035,0,0,s,a,1,0,tb+.5)}} // disco de freio
function buildBMW(){
 [[.61,1],[.61,-1],[-.61,1],[-.61,-1]].forEach(([xa,s],i)=>wheel(xa,s,1.0+.3*i));
 const xOf=u=>-CL+2*CL*u,arches=[.61,-.61];
 surf((u,v)=>{const x=xOf(u),w=widC(x)*tapW(x),y0=botC(x),y1=topC(x),th=TAU*v;
   return[x,G+(y0+y1)/2+(y1-y0)/2*sgn(Math.sin(th),.4),w*sgn(Math.cos(th),.4)]},
  u=>{const x=xOf(u);return G+(botC(x)+topC(x))/2},230,130,4,(x,y)=>2.2+3*(CL-x)/(2*CL)+.5*(y-G),
  (x,y,z)=>Math.abs(z)>.27&&arches.some(xa=>(x-xa)**2+(y-G-.152)**2<.185**2)); // carroceria (com cavas das rodas)
 const NVG=72,th=v=>Math.PI*v*NVG/(NVG-1);
 surf((u,v)=>{const x=-.8+1.32*u,yb=G+topC(x),yr=G+Math.max(roofC(x),topC(x)+.004),c=Math.cos(th(v)),s=Math.abs(Math.sin(th(v)));
   return[x,yb+(yr-yb)*Math.pow(s,.6),gwC(x)*sgn(c,.8)]},
  u=>G+topC(-.8+1.32*u),90,NVG,(x,y,z,u,v)=>{const a=Math.abs(Math.cos(th(v)));return(a<.55&&x>-.45&&x<.2)||a>.96?1:2}, // teto e colunas sólidos, vidros kind 2
  (x,y,z,u,v)=>4.6+1.2*(.52-x)/1.32+.3*v);
 const wy=G+.56; // aerofólio traseiro
 box(-1.07,-.9,wy,wy+.014,-.4,.4,.011,1,()=>5.6);
 for(const s of[-1,1]){box(-1.07,-.9,wy-.07,wy+.06,s>0?.4:-.411,s>0?.411:-.4,.011,1,()=>5.8);
  box(-1.0,-.97,G+.43,wy,s*.165-.005,s*.165+.005,.01,1,()=>5.5);
  box(.36,.42,G+.43,G+.47,s>0?.36:-.41,s>0?.41:-.36,.01,1,()=>5.9)} // espelhos
 box(.84,1.13,G+.012,G+.026,-.44,.44,.011,1,()=>5.3); // splitter
 // — frente e traseira fechadas, com os rins grandes, entradas laterais, faróis finos e lanterna —
 const faceW=s=>widC(s*CL)*tapW(s*CL),faceX=(s,z)=>{const q=z/faceW(s);return s*CL+s*.03*Math.max(0,1-q*q)};
 const hin=(h,z,y)=>{const c=Math.cos(h.r),sn=Math.sin(h.r),dz=z-h.z,dy=y-h.y,zr=dz*c+dy*sn,yr=-dz*sn+dy*c;return Math.pow(Math.abs(zr)/h.a,h.p)+Math.pow(Math.abs(yr)/h.b,h.p)<1};
 function endCap(s,carve,t){const xf=s*CL,w=faceW(s),y0=botC(xf),y1=topC(xf),yc=(y0+y1)/2,hh=(y1-y0)/2;
  for(let iy=0;iy<30;iy++){const yy=y0+(y1-y0)*iy/29,dy=Math.abs(yy-yc)/hh,zh=w*Math.pow(Math.max(1-Math.pow(dy,5),0),.2),nz=Math.max(2,Math.ceil(zh*2/.011));
   for(let iz=0;iz<=nz;iz++){const z=-zh+2*zh*iz/nz;if(carve(z,G+yy))continue;
    const q=z/w,nn=[s,(yy-yc)/hh*.25,q*.3],l=Math.hypot(...nn);add(faceX(s,z),G+yy,z,nn[0]/l,nn[1]/l,nn[2]/l,Math.atan2(z,xf),4,0,t(z))}}}
 const outline=(s,h,n,t)=>{const c=Math.cos(h.r),sn=Math.sin(h.r);for(let j=0;j<n;j++){const th=TAU*j/n,zr=h.a*sgn(Math.cos(th),2/h.p),yr=h.b*sgn(Math.sin(th),2/h.p),z=h.z+zr*c-yr*sn,y=h.y+zr*sn+yr*c;add(faceX(s,z)+s*.004,y,z,s,0,0,th,1,0,t)}};
 const slats=(s,h,k,t)=>{for(let q=1;q<=k;q++){const yy=-h.b+2*h.b*q/(k+1),span=h.a*Math.pow(Math.max(1-Math.pow(Math.abs(yy)/h.b,h.p),0),1/h.p);
  for(let zz=-span;zz<=span;zz+=.006)add(faceX(s,h.z+zz)+s*.004,h.y+yy,h.z+zz,s,0,0,0,1,0,t)}};
 const HF=[{z:-.072,y:G+.175,a:.05,b:.085,p:4,r:0},{z:.072,y:G+.175,a:.05,b:.085,p:4,r:0},   // rins
  {z:-.19,y:G+.095,a:.045,b:.035,p:3,r:0},{z:.19,y:G+.095,a:.045,b:.035,p:3,r:0},             // entradas laterais
  {z:-.17,y:G+.262,a:.065,b:.012,p:3,r:-.2},{z:.17,y:G+.262,a:.065,b:.012,p:3,r:.2}],          // faróis
  HR=[{z:0,y:G+.33,a:.2,b:.014,p:3,r:0}];                                                      // lanterna traseira
 endCap(1,(z,y)=>HF.some(h=>hin(h,z,y)),z=>2.3+.6*Math.abs(z)/.25);
 endCap(-1,(z,y)=>HR.some(h=>hin(h,z,y)),z=>4.7+.6*Math.abs(z)/.25);
 HF.forEach(h=>outline(1,h,70,2.9));slats(1,HF[0],5,3);slats(1,HF[1],5,3);slats(1,HF[2],2,3);slats(1,HF[3],2,3);
 for(const s of[-1,1]){const h=HF[s>0?5:4];outline(1,{...h,y:h.y+.022,b:.006},40,3) } // sobrancelha de LED
 HR.forEach(h=>outline(-1,h,90,5.2));
 for(const s of[-1,1])for(let q=0;q<6;q++){const x=.5+q*.045;for(let zz=0;zz<=.06;zz+=.008)add(x,G+topC(x)+.003,s*(.1+zz),0,1,0,0,1,0,5.2)} // entradas do capô
}

(window.OBJECT_DEFS=window.OBJECT_DEFS||[]).push({id:'bmw',label:'BMW M4 GT3 Evo',build:buildBMW,floor:G,scale:()=>clamp(.78*W/(2.4*SC),1,2.2)});
})();

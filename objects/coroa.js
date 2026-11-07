// Coroa.
(function(){
function buildCoroa(){
 const br=y=>.56+.14*(y+.9)/.64;
 revolve(br,-.9,-.26,90,260,(x,y,z,nx,ny,nz,a)=>add(x,y,z,nx,ny,nz,a,1,0,1.6+1.6*(y+.9)/.64+.8*sweepF(a)));
 revolve(y=>br(y)-.04,-.9,-.26,60,220,(x,y,z,nx,ny,nz,a)=>add(x,y,z,-nx,-ny,-nz,a,1,0,2+1.6*(y+.9)/.64+.8*sweepF(a)));
 for(let k=0;k<5;k++){const phi=k*TAU/5+Math.PI/2,h=k%2?.62:.92,rb=br(-.26)-.07,ox=rb*Math.cos(phi),oz=rb*Math.sin(phi);
  revolve(y=>Math.max(.15*(1-(y+.26)/h),.004),-.26,-.26+h,50,40,(x,y,z,nx,ny,nz)=>add(x+ox,y,z+oz,nx,ny,nz,phi,1,0,3.2+.35*k+1.6*(y+.26)/h));
  sphere(ox,-.26+h+.03,oz,.065,26,16,0,()=>5.2+.3*k);
  const gr=br(-.57)+.01;sphere(gr*Math.cos(phi+TAU/10),-.57,gr*Math.sin(phi+TAU/10),.075,26,16,0,()=>4.4+.25*k)}}

(window.OBJECT_DEFS=window.OBJECT_DEFS||[]).push({id:'coroa',label:'coroa',build:buildCoroa,floor:-.9});
})();

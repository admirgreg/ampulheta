// Chave antiga.
(function(){
function buildChave(){
 torus(0,.7,0,.3,.085,200,34,1,u=>.3+2.4*u/TAU);
 for(let k=0;k<3;k++){const a=Math.PI/2+k*TAU/3;sphere(.14*Math.cos(a),.7+.14*Math.sin(a),0,.055,22,14,1,()=>2.2+.3*k)}
 const sr=y=>.062+.026*Math.exp(-(((y-.36)/.03)**2))+.02*Math.exp(-(((y+.1)/.025)**2))+.018*Math.exp(-(((y+.55)/.025)**2));
 revolve(sr,-1.02,.42,200,36,(x,y,z,nx,ny,nz,a)=>add(x,y,z,nx,ny,nz,a,1,0,2.6+2.4*(y+1.02)/1.44));
 const bt=(x,y)=>5+1.3*(x-.05)/.3+(y+1.02)*.9;
 box(.05,.34,-1.02,-.92,-.035,.035,.011,1,bt);box(.05,.26,-.86,-.78,-.035,.035,.011,1,bt);
 box(.05,.34,-.72,-.62,-.035,.035,.011,1,bt);box(.05,.12,-1.02,-.62,-.035,.035,.011,1,bt);
}

(window.OBJECT_DEFS=window.OBJECT_DEFS||[]).push({id:'chave',label:'chave',build:buildChave,floor:-1.02});
})();

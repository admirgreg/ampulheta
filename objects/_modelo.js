// MODELO para criar um objeto novo. Copie este arquivo, mude o nome e o desenho, e adicione
// <script src="objects/seu-objeto.js"></script> no index.html (antes do script.js).
// O objeto aparece sozinho na lista do menu.
(function(){
function buildMeuObjeto(){
  // peças prontas (no script.js): sphere, torus, box, puck, revolve, add
  // tf = quando cada ponto aparece na construção (0 a ~6 segundos)
  sphere(0,0,0,.6,60,40,1,()=>.5+Math.random()*5);          // sphere(cx,cy,cz, raio, nu,nv, tipo, tf)
  torus(0,0,0,.9,.08,120,24,1,u=>1+4*u/TAU);                  // torus(cx,cy,cz, R,r, nu,nv, tipo, tf)
  // tipo: 0 sólido, 1 sólido, 2 vidro (brilha só nas bordas), 3 mais escuro
}
(window.OBJECT_DEFS=window.OBJECT_DEFS||[]).push({
  id:'meu-objeto', label:'meu objeto', build:buildMeuObjeto,
  floor:-.9   // altura do chão do reflexo (o ponto mais baixo do objeto)
});
})();

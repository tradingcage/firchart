(()=>{"use strict";function e(t){return e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},e(t)}function t(n){if(null===n||"object"!==e(n))return n;if(n instanceof Date)return new Date(n.getTime());if(Array.isArray(n)){for(var r=[],a=0;a<n.length;a++)r[a]=t(n[a]);return r}if(n instanceof Object){var i={};for(var o in n)n.hasOwnProperty(o)&&(i[o]=t(n[o]));return i}return n}function n(e){for(var t="",n=0;n<e;n++)t+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62*Math.random()));return"x"+t}function r(e){return[parseInt(e.slice(1,3),16)/255,parseInt(e.slice(3,5),16)/255,parseInt(e.slice(5,7),16)/255,1]}function a(e){return Math.round(100*e)/100}function i(e,t){var n=e.indexOf(t);n>-1&&e.splice(n,1)}function o(e,t,n){for(var r=0,a=0;a<t;a++){if(null==e[a][n])return;r+=e[a][n]}return r/t}function l(e,t,n){if(!(e.length<t)){for(var r=2/(t+1),a=null,i=t-1;i>=0;i--)if(null!=e[i][n])if(null===a){var l=o(e[i],t,n);a=e[i][n]*r+l*(1-r)}else a=e[i][n]*r+a*(1-r);return a}}function c(e,t){return t?Math.max(e.high-e.low,Math.abs(e.high-t),Math.abs(e.low-t)):e.high-e.low}function s(e,t){for(var n=0,r=null,a=0;a<t;a++){var i=c(e[a],r);a<t?n+=i:n=(n*(t-1)+i)/t,r=e[a].close}return n/t}function u(e,t,n){for(var r=0,a=0,i=0;i<t-1;i++){var o=e[i][n]-e[i+1][n];o>=0?r+=o:a-=o}return 100-100/(1+r/t/(a/t))}var d={sma:{name:function(e){return"SMA (".concat(e.options.length,")")},type:"line",options:{color:"#1111AA",length:20},fn:function(e,t){return a(o(e,t.length,"close"))}},ema:{name:function(e){return"EMA (".concat(e.options.length,")")},type:"line",options:{color:"#AA1111",length:20},fn:function(e,t){return a(l(e,t.length,"close"))}},atr:{name:function(e){return"ATR (".concat(e.options.length,")")},type:"line",separatePane:!0,options:{color:"#11AA11",length:14},fn:function(e,t){return a(s(e,t.length))}},keltnerChannels:{name:function(){return"KC"},type:"band",numLines:3,options:{color:"#11AA11",emaLength:20,multiplier:2,atrLength:10},fn:function(e,t){var n=l(e,t.emaLength,"close"),r=s(e,t.atrLength);return[a(n+r*t.multiplier),a(n),a(n-r*t.multiplier)]}},bollingerBands:{name:function(){return"BB"},type:"band",numLines:3,options:{color:"#1A1AA1",smaLength:20,stdev:2},fn:function(e,t){var n=o(e,t.smaLength,"close"),r=function(e,t,n){for(var r=o(e,t,n),a=0,i=0;i<t;i++)a+=Math.pow(e[i][n]-r,2);return Math.sqrt(a/t)}(e,t.smaLength,"close");return[a(n+r*t.stdev),a(n),a(n-r*t.stdev)]}},rsi:{name:function(e){return"RSI (".concat(e.options.length,")")},type:"band",separatePane:!0,numLines:3,options:{color:"#A1A11A",length:14,upperLevel:70,lowerLevel:30},fn:function(e,t){return[t.upperLevel,a(u(e,t.length,"close")),t.lowerLevel]}}};function f(e){return f="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},f(e)}function m(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?m(Object(n),!0).forEach((function(t){var r,a,i;r=e,a=t,i=n[t],(a=g(a))in r?Object.defineProperty(r,a,{value:i,enumerable:!0,configurable:!0,writable:!0}):r[a]=i})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):m(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function h(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function v(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,g(r.key),r)}}function y(e,t,n){return t&&v(e.prototype,t),n&&v(e,n),Object.defineProperty(e,"prototype",{writable:!1}),e}function g(e){var t=function(e,t){if("object"!=f(e)||!e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,"string");if("object"!=f(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}(e);return"symbol"==f(t)?t:String(t)}var b=function(){function e(t){h(this,e),this.storageKey=t,this.loadInitialState()}return y(e,[{key:"loadInitialState",value:function(){var e=localStorage.getItem(this.storageKey);this.state=e?JSON.parse(e):{}}},{key:"set",value:function(e,t){this.state[e]=t,this.saveState()}},{key:"setProperty",value:function(e,t,n){var r=this.state[e];null==r&&(r={}),r[t]=n,this.state[e]=r,this.saveState()}},{key:"setObject",value:function(e,t){for(var n=e.split("."),r=this.state;n.length>1;){var a=n.shift();r[a]=r[a]||{},r=r[a]}r[n[0]]=p(p({},r[n[0]]),t),this.saveState()}},{key:"get",value:function(e){return this.state[e]}},{key:"getProperty",value:function(e,t){return this.state[e]&&this.state[e][t]}},{key:"forEach",value:function(e){for(var t in this.state)this.state.hasOwnProperty(t)&&e(t,this.state[t])}},{key:"remove",value:function(e){e in this.state&&(delete this.state[e],this.saveState())}},{key:"saveState",value:function(){localStorage.setItem(this.storageKey,JSON.stringify(this.state))}}]),e}(),x=function(){function e(){h(this,e)}return y(e,[{key:"set",value:function(){}},{key:"setProperty",value:function(){}},{key:"setObject",value:function(){}},{key:"get",value:function(){}},{key:"getProperty",value:function(){}},{key:"forEach",value:function(){}},{key:"remove",value:function(){}}]),e}(),w='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',L='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 9L12 15L18 9" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',S=function(e,t){return function(n,a){var i=r(e.bull);i[3]=t;var o=r(e.bear);o[3]=t,fc.webglFillColor().value((function(e){return e.close>=e.open?i:o})).data(a)(n)}};function k(e){return e.each((function(){var e=d3.select(this);e.style("display","grid"),e.style("display","-ms-grid"),e.style("grid-template-columns","minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)"),e.style("-ms-grid-columns","minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)"),e.style("grid-template-rows","minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)"),e.style("-ms-grid-rows","minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)")}))}function C(e){return e.each((function(){var e=d3.select(this);e.style("grid-template-rows","minmax(0em, max-content) 0fr 0fr 0fr minmax(0em, max-content)"),e.style("-ms-grid-rows","minmax(0em, 0em) 0fr 0fr 0fr minmax(0em, 0em)")}))}function M(e,t){return function(n){return n.each((function(){d3.select(this).style(e,t)}))}}var E=M("display","none"),O=M("display","block");function P(e){d3.selectAll("".concat(e," .plot-area")).call(E),d3.selectAll("".concat(e," .cartesian-chart")).call(C),d3.selectAll("".concat(e)).call(M("flex","0"))}function j(e){d3.selectAll("".concat(e," .plot-area")).call(O),d3.selectAll("".concat(e," .cartesian-chart")).call(k),d3.selectAll("".concat(e)).call(M("flex","1"))}function T(e,t){var n=document.createElement("div");n.style.position="absolute",n.style.backgroundColor="rgba(238, 238, 238, 0.5)",n.style.width="100%",n.style.height="100%",n.style.display="none",n.style.userSelect="none",n.style.zIndex="1",n.onclick=function(e){e.target===n&&(n.style.display="none")};var r=document.createElement("div");r.style.width="400px",r.style.margin="100px auto",r.style.backgroundColor="#fff",r.style.position="relative",r.style.padding="15px",r.style.boxShadow="0px 0px 10px rgba(0,0,0,0.5)";var a=document.createElement("div");a.innerHTML=e,a.style.fontSize="1.5rem",a.style.padding="5px";var i=document.createElement("div"),o=document.createElement("div");return o.innerHTML=w,o.style.position="absolute",o.style.top="20px",o.style.right="15px",o.style.cursor="pointer",o.onclick=function(){n.style.display="none"},r.appendChild(a),r.appendChild(o),r.appendChild(i),n.appendChild(r),t.appendChild(n),[n,i,function(){n.style.display="block"},function(e){a.innerHTML=e}]}function A(e){return A="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},A(e)}function D(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function N(e){return function(e){if(Array.isArray(e))return H(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||V(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function I(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var r,a,i,o,l=[],c=!0,s=!1;try{if(i=(n=n.call(e)).next,0===t){if(Object(n)!==n)return;c=!1}else for(;!(c=(r=i.call(n)).done)&&(l.push(r.value),l.length!==t);c=!0);}catch(e){s=!0,a=e}finally{try{if(!c&&null!=n.return&&(o=n.return(),Object(o)!==o))return}finally{if(s)throw a}}return l}}(e,t)||V(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function V(e,t){if(e){if("string"==typeof e)return H(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?H(e,t):void 0}}function H(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function B(e,t,n){return new Proxy(e,{get:function(e,r){var a={};if("string"==typeof r&&!isNaN(r)){var i=n[t-Number(r)];return null!=i&&(a=i),B(a,t,n)}return e[r]}})}window.FirChart=function(e,o,l){var c;c=l.persistIndicatorState?new b("indicator-settings"):new x;var s=o.map((function(e,t,n){return B(e,t,n)})),u="cursor",f="placeLineInitial",m="placeLineSecondary",p="dragLine",h={mode:u,currentBar:null,volumeVisible:!0,indicators:[],additionalPanes:[],currentPaneId:"#ohlc-chart",drawings:[]},v=[];v.push((function(e){return h.currentBar=e}));var y={x:-1,y:-1};function g(e){if(h.mode=e,e===f||e===m)return h.activeDrag&&h.activeDrag.drawing.stopMoving(),d3.select("#ohlc-chart").node().style.cursor='url("'.concat((t='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'.replace(/"/g,"'").replace(/%/g,"%25").replace(/#/g,"%23").replace(/{/g,"%7B").replace(/}/g,"%7D").replace(/</g,"%3C").replace(/>/g,"%3E"),"data:image/svg+xml,".concat(t)),'") 0 24, pointer'),d3.select("#volume-chart").node().style.cursor="not-allowed",void h.additionalPanes.forEach((function(e){var t=e.id;d3.select(t).node().style.cursor="not-allowed"}));var t;Le(),e!==p?(Le(),d3.select("#ohlc-chart").node().style.cursor="default",d3.select("#volume-chart").node().style.cursor="default",h.additionalPanes.forEach((function(e){var t=e.id;d3.select(t).node().style.cursor="default"}))):d3.select("#ohlc-chart").node().style.cursor="grabbing"}var C=document.createElement("style");C.type="text/css",C.innerHTML=".info-box-hover-effect:hover { background-color: rgba(0, 0, 0, 0.1); }",document.getElementsByTagName("head")[0].appendChild(C);var O=document.getElementById(e);O.style.display="flex",O.style.flexDirection="column",O.style.fontSize="1.2em";var V=document.createElement("div");V.id="ohlc-chart",V.style.flex=4,O.appendChild(V);var H=document.createElement("div");H.id="volume-chart",H.style.flex=1,O.appendChild(H);var W=document.createElement("div");W.id="info-box",W.style.position="absolute",W.style.padding="0.4em 0.6em 0.4em 0.4em",W.style.backgroundColor="#eee",W.style.userSelect="none",W.style.width="24rem",W.style.fontSize="0.9rem",W.style.zIndex="1",O.appendChild(W);var z=document.createElement("div");z.style.display="flex",z.style.alignItems="center";var F=document.createElement("div");F.style.padding="0.3em";var Y={open:document.createElement("span"),high:document.createElement("span"),low:document.createElement("span"),close:document.createElement("span")};v.push((function(e){Y.open.innerHTML=a(e.open),Y.high.innerHTML=a(e.high),Y.low.innerHTML=a(e.low),Y.close.innerHTML=a(e.close)}));var R=document.createElement("span");R.innerHTML="O: ";var U=document.createElement("span");U.innerHTML=" H: ";var X=document.createElement("span");X.innerHTML=" L: ";var q=document.createElement("span");q.innerHTML=" C: ",Y.open.style.fontWeight="bold",Y.high.style.fontWeight="bold",Y.low.style.fontWeight="bold",Y.close.style.fontWeight="bold",F.appendChild(R),F.appendChild(Y.open),F.appendChild(U),F.appendChild(Y.high),F.appendChild(X),F.appendChild(Y.low),F.appendChild(q),F.appendChild(Y.close);var K=document.createElement("div"),Z=document.createElement("div");Z.style.flex="1",Z.style.cursor="pointer",Z.style.textAlign="right",Z.style.display="flex",Z.style.justifyContent="flex-end",Z.innerHTML=L;var J=!0,G=function(){J=!J,c.setProperty("ohlcBox","toggled",J),J?(Z.innerHTML=L,K.style.display="block"):(Z.innerHTML='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 15L12 9L18 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',K.style.display="none")};Z.onclick=G,!1===c.getProperty("ohlcBox","toggled")&&G(),z.appendChild(F),z.appendChild(Z),W.appendChild(z),W.appendChild(K);var Q=[];function $(e,t,r,a){var o,l=document.createElement("div");o=e.id?e.id:n(8),l.id=o+"-info",e.state&&(e.state.elementId=o),l.style.paddingLeft="0.3em",l.style.display="flex",l.style.alignItems="center";var s,u=document.createElement("span");u.className="label","function"==typeof e.name?s=e.name(e):"string"==typeof e.name&&(s=e.name),u.innerHTML=s,l.appendChild(u);var d=document.createElement("span");d.style.fontWeight="bold",d.style.marginLeft="0.3em",l.appendChild(d);var f=document.createElement("span");f.style.flex="1",f.style.textAlign="right",f.style.marginLeft="1em",f.style.display="flex",f.style.justifyContent="flex-end",l.appendChild(f);var m=document.createElement("span");m.innerHTML='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M3 13C6.6 5 17.4 5 21 13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14C15 15.6569 13.6569 17 12 17Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',m.style.paddingLeft=".1em",m.style.cursor="pointer",f.appendChild(m),K.insertBefore(l,K.children[K.children.length-1]);var p,h=!0,v=null!=e.iName||"volume"===e.id,y=function(){t(),h=!h,v&&c.setProperty(o,"toggled",h),l.style.opacity=h?1:.5};m.addEventListener("click",(function(){y(),Fe()})),v&&!1===c.getProperty(o,"toggled")&&y(),r&&(p={onValueChange:function(e){var t=r(e);Array.isArray(t)&&!t.some(isNaN)?d.innerHTML=t.join(","):isNaN(t)?d.innerHTML="...":d.innerHTML=""+t}},Q.push(p));var g=function(){};if(a){var b=document.createElement("span");b.innerHTML=w,b.style.paddingLeft=".1em",b.style.cursor="pointer",f.appendChild(b);var x=document.createElement("span");x.innerHTML='<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',x.style.cursor="pointer",f.insertBefore(x,m);var L=I(T(s,O),4),S=L[0],k=L[1],C=L[2],M=L[3];!function(t,n,r){var a=document.createElement("form");function i(){for(var t={},n=0;n<a.elements.length;n++){var r=a.elements[n];if(r.name){var i=r.value;"number"===r.type&&(i=Number(i)),t[r.name]=i}}var o;o=t,e.options=o,e.refreshOptions(),function(e){var t=document.getElementById(e.state.elementId);if(t)for(var n=0;n<t.children.length;n++)"label"===t.children[n].className&&(t.children[n].innerHTML=e.name(e))}(e),Fe()}for(var o in a.style.textAlign="left",a.style.marginTop="1em",a.style.fontSize="1rem",n)if(n.hasOwnProperty(o)){var l=document.createElement("div");l.style.marginBottom="10px",l.style.marginLeft="0.5em";var c=document.createElement("label");c.textContent=o+": ",c.style.marginRight="10px",c.style.display="inline-block",c.style.width="100px";var s=document.createElement("input");s.name=o,s.value=n[o];var u=function(){s.style.padding="0.1rem 0.2rem 0.1em 0.2em",s.style.border="1px solid gray",s.style.borderRadius="3px"};"string"==typeof n[o]?n[o].startsWith("#")?s.type="color":(u(),s.type="text"):"number"==typeof n[o]&&(u(),s.type="number"),s.addEventListener("blur",i),l.appendChild(c),l.appendChild(s),a.appendChild(l)}t.appendChild(a)}(k,e.options),x.addEventListener("click",(function(){"function"==typeof e.name&&M(e.name(e)),C()})),g=function(){l.remove(),S.remove(),p&&i(Q,p),a&&a()},b.addEventListener("click",g)}return{remove:g}}v.push((function(e){return Q.forEach((function(t){return t.onValueChange(e)}))}));var _=document.createElement("div");_.style.display="flex",_.style.padding="0.4em",K.appendChild(_);var ee=document.createElement("div");ee.innerHTML="Add Indicator",ee.style.textDecoration="underline",ee.style.cursor="pointer",_.appendChild(ee);var te=document.createElement("div");te.innerHTML="Add Line",te.style.textDecoration="underline",te.style.cursor="pointer",te.style.marginLeft="1em",_.appendChild(te),te.addEventListener("click",(function(){g(f)})),$({name:function(){return"Volume"},id:"volume"},(function(){return h.volumeVisible=!h.volumeVisible}),(function(e){return a(e.volume)}));var ne=fc.scaleDiscontinuous(d3.scaleTime()).domain(fc.extentDate().accessors([function(e){return e.date.getTime()}])(s)),re=d3.scaleLinear().domain(fc.extentLinear().accessors([function(e){return e.high+(e.high-e.low)/3},function(e){return e.low-(e.high-e.low)/3}])(s)),ae=function(){return function(e){if(e.length<2)return 0;for(var t=0,n={0:0},r=1;r<e.length;r++){var a=Math.abs(e[r]-e[r-1]);void 0!==n[a]&&(n[a]=0),n[a]+=1,n[a]>n[t]&&(t=a)}return t}(s.map((function(e){return e.date.getTime()})))},ie=[],oe=function(){if(s.length>1){for(var e,t=ae(),n=[],r=1;r<s.length;r++)s[r].date.getTime()-s[r-1].date.getTime()>t&&n.push([s[r-1].date.getTime(),new Date(s[r].date.getTime()-t).getTime()]);ie=n,ne.discontinuityProvider((e=fc).discontinuityRange.apply(e,n))}},le=function(){if(0!==s.length){var e=new Date(s[s.length-1].date.getTime()+ae()),t=s[0].date;s.length>100&&(t=s[s.length-100].date),oe(),ne.domain([t.getTime(),e.getTime()])}};le();var ce=function(){if(0!==s.length){var e=s.filter((function(e){return ne(e.date.getTime())>=0&&ne(e.date.getTime())<=d3.select("#ohlc-chart").node().clientWidth})),t=Math.min.apply(Math,N(e.map((function(e){return e.low})))),n=Math.max.apply(Math,N(e.map((function(e){return e.high}))));h.indicators.forEach((function(r){if(!r.separatePane&&r.state.enabled){var a=e.map(r.fn).filter((function(e){return!isNaN(e)}));Math.min.apply(Math,N(a))<t&&(t=Math.min.apply(Math,N(a))),Math.max.apply(Math,N(a))>n&&(n=Math.max.apply(Math,N(a)))}})),t-=((n+=(n-t)/10)-t)/10,re.domain([t,n])}},se=fc.zoom().duration(0).scaleExtent([.3,5]).on("zoom",(function(e){y.x=e.sourceEvent.layerX,ce(),h.textDrawings.forEach((function(e){var t=e.x,n=e.y,r=e.elem;r.setAttributeNS(null,"x",ne(t.getTime())),r.setAttributeNS(null,"y",re(n.getTime()))})),Fe()})),ue=fc.annotationSvgCrosshair().xScale(ne).yScale(re).xLabel((function(e){return""})).yLabel((function(e){return""})).decorate((function(e){e.enter().selectAll("g.annotation-line > line").each((function(){var e=d3.select(this);e.style("stroke-opacity",".8"),e.style("stroke-dasharray","4")}))}));function de(){var e="#volume-chart";h.additionalPanes.forEach((function(t){var n=t.id;document.querySelector("".concat(e," d3fc-svg.x-axis.bottom-axis")).style.display="none",e=n})),document.querySelector("".concat(e," d3fc-svg.x-axis.bottom-axis")).style.display="block"}function fe(e){var t=e.type,a=e.options,o=e.fn;e.fn=function(t){if(t)return o(t,e.options)},e.state={enabled:!0,chartObjects:{}};var l=e.id;l||(l=n(8)),c.setProperty(l,"id",l),c.setProperty(l,"iName",e.iName);var u,d,f,m=Te;if(e.separatePane){d3.select("#x-label").remove(),e.state.newPaneElem=document.createElement("div"),e.state.newPaneElem.id=l,e.state.newPaneElem.style.flex=1,O.appendChild(e.state.newPaneElem);var p="#"+e.state.newPaneElem.id;m=fc.seriesWebglMulti(),d=d3.scaleLinear(),e.refreshDomain=function(){var n;if("line"===t){var r=s.map((function(t){return e.fn(t)})).filter((function(e){return!isNaN(e)}));n=[.95*Math.min.apply(Math,N(r)),1.05*Math.max.apply(Math,N(r))]}else if("band"===t){var a=s.map((function(t){return e.fn(t)})).flat().filter((function(e){return!isNaN(e)}));n=[.95*Math.min.apply(Math,N(a)),1.05*Math.max.apply(Math,N(a))]}d.domain(n)},e.refreshDomain();var v=h.additionalPanes.length,g=fc.chartCartesian({xScale:ne,yScale:d,yAxis:{right:function(e){return fc.axisRight(e).ticks(3)}}}).webglPlotArea(m).svgPlotArea(Ee).decorate((function(e){e.enter().call(k),e.enter().selectAll(".plot-area").call(se,ne),e.enter().selectAll(".x-axis").call(se,ne),e.enter().selectAll(".top-label").call(E),e.enter().selectAll("svg").call(M("font-size","14px")),e.on("mousemove",(function(e){ze(p),We(e);var t=re.range()[0]+Oe.range()[0];h.additionalPanes.forEach((function(e,n){e.id!==p&&n<v&&(t+=e.yScale.range()[0])})),y.y=e.layerY;var n=d.range()[0];e.layerY>n&&(y.y=n),y.y+=t,He()}))}));u={id:p,chart:g,yScale:d},h.additionalPanes.push(u)}if(e.enableSeparatePane=function(){e.separatePane&&j(u.id)},e.disableSeparatePane=function(){e.separatePane&&P(u.id)},e.removeSeparatePane=function(){e.separatePane&&(i(h.additionalPanes,u),de(),e.state.newPaneElem.remove())},"line"===t){var b=fc.seriesWebglLine().xScale(ne).yScale(re).crossValue((function(e){return e.date})).mainValue(e.fn).decorate(fc.webglStrokeColor(r(a.color)));e.state.chartObjects.line=b,f=function(){if(e.separatePane){var t=s.map((function(t){return e.fn(t)})).filter((function(e){return!isNaN(e)}));d.domain([.95*Math.min.apply(Math,N(t)),1.05*Math.max.apply(Math,N(t))])}e.state.chartObjects.line.decorate(fc.webglStrokeColor(r(e.options.color)))},e.disable=function(){e.state.chartObjects.line.mainValue((function(e){}))},e.enable=function(){e.state.chartObjects.line.mainValue(e.fn)},e.remove=function(){De(m,e.state.chartObjects.line)},Ae(m,e.state.chartObjects.line)}else if("band"===t){for(var x=[],w=e.numLines,L=function(t){var n=fc.seriesWebglLine().crossValue((function(e){return e.date})).mainValue((function(n){var r=e.fn(n);if(r)return r[t]})).decorate(fc.webglStrokeColor(r(a.color)));x.push(n),Ae(m,n)},S=0;S<w;S++)L(S);e.state.chartObjects.lines=x,f=function(){if(e.separatePane){var t=s.map((function(t){return e.fn(t)})).flat().filter((function(e){return!isNaN(e)}));d.domain([.95*Math.min.apply(Math,N(t)),1.05*Math.max.apply(Math,N(t))])}e.state.chartObjects.lines.forEach((function(t){return t.decorate(fc.webglStrokeColor(r(e.options.color)))}))},e.disable=function(){e.state.chartObjects.lines.forEach((function(e){return e.mainValue((function(e){}))}))},e.enable=function(){e.state.chartObjects.lines.forEach((function(t,n){return t.mainValue((function(t){var r=e.fn(t);if(r)return r[n]}))}))},e.remove=function(){e.state.chartObjects.lines.forEach((function(e){return De(m,e)}))}}e.refreshOptions=function(){c.setObject(e.id+".options",e.options),f()},h.indicators.push(e),$(e,(function(){e.state.enabled=!e.state.enabled,c.setProperty(e.id,"toggled",e.state.enabled),e.state.enabled?(e.enable(),e.enableSeparatePane()):(e.disable(),e.disableSeparatePane()),ce()}),(function(t){return e.fn(t)}),(function(){c.remove(e.id),i(h.indicators,e),e.removeSeparatePane(),e.remove()})),de()}var me=I(T("Add Indicator",O),3),pe=(me[0],me[1]),he=me[2];pe.style.marginTop="1em",l.indicators.forEach((function(e){var n=d[e],r=document.createElement("div");r.className="info-box-hover-effect",r.innerHTML=n.name(n),r.style.marginTop="0.2em",r.style.cursor="pointer",r.style.padding="5px",r.style.fontSize="1rem",r.addEventListener("click",(function(){var r=t(n);r.iName=e;var a=r.name;r.name=function(e){return a(e)+": "},fe(r)})),pe.appendChild(r)})),ee.addEventListener("click",he);var ve="#7733dd",ye=fc.seriesSvgMulti(),ge=864e5;function be(e,t){return function(n){var r=(t-n.date.getTime())/ge;if(r>-1&&r<0)return t;var a=(e-n.date.getTime())/ge;return a>0&&a<1||a>-1&&a<0?e:e<=t&&n.date.getTime()>=e&&n.date.getTime()<=t||t<e&&n.date.getTime()>=t&&n.date.getTime()<=e?n.date:void 0}}function xe(e,t,n,r){var a=function(e,t){var n=function(e,t){for(var n=Math.min(e,t),r=Math.max(e,t),a=-1,i=-1,o=0;o<ie.length;o++){var l=I(ie[o],2),c=l[0];l[1],n>c&&(a=o),r>c&&(i=o)}return ie.slice(a+1,i+1)}(e,t),r=n.reduce((function(e,t){var n=I(t,2),r=n[0];return e+(n[1]-r)}),0);return t>e?-r:r},i=(r-t)/(n-e+a(e,n));if(!isNaN(i))return function(o){var l=(n-o.date)/ge;if(l>-1&&l<0)return r;var c=(e-o.date)/ge;if(c>0&&c<1||c>-1&&c<0)return t;var s,u,d=a(e,o.date.getTime()),f=o.date.getTime()-e;return s=f+d,u=f,Math.sign(s)===Math.sign(u)&&(f+=d),t+f*i}}function we(e,t){if(null!=h.activeLine&&null!=h.activeLine.chartObject){var n=h.activeLine.x1,r=h.activeLine.y1,a=ne.invert(e),i=re.invert(t);h.activeLine.chartObject.crossValue(be(n,a)).mainValue(xe(n,r,a,i)),Fe()}}function Le(){null!=h.activeLine&&(null!=h.activeLine.chartObject&&De(ye,h.activeLine.chartObject),h.activeLine=null)}function Se(e,t){g(p),h.activeDrag={initialX:e.layerX,initialY:e.layerY,drawing:t}}function ke(){h.activeDrag&&h.activeDrag.drawing.stopMoving(),g(u)}function Ce(e,t,r,a,o){var l,c=arguments.length>5&&void 0!==arguments[5]?arguments[5]:{},s={name:e,color:null!==(l=c.color)&&void 0!==l?l:ve};""===e&&(s.name="New Line");var u={name:function(e){return e.options.name},options:s,state:{enabled:!0,initialCoords:{x1:t,y1:r,x2:a,y2:o}},moreOpts:c},d=function(e){h.mode===p?ke():Se(e,u),Fe()},f=n(8),m=function(e){e.attr("id",f),e.attr("stroke",u.options.color),c.draggable&&(h.mode===p?e.style("cursor","grabbing"):e.style("cursor","grab"),e.on("click",d))},v=fc.seriesSvgLine().xScale(ne).yScale(re).crossValue(be(t,a)).mainValue(xe(t,r,a,o)).decorate(m);c.draggable&&(u.shadowChartObject=fc.seriesSvgLine().xScale(ne).yScale(re).crossValue(be(t,a)).mainValue(xe(t,r,a,o)).decorate((function(e){e.attr("id",f+"-shadow"),e.attr("stroke-width",15),e.attr("stroke-opacity",0),h.mode===p?e.style("cursor","grabbing"):e.style("cursor","grab"),e.on("click",d)})),Ae(ye,u.shadowChartObject)),u.move=function(e,t){u.state.inProgressCoords={x1:ne.invert(e+ne(u.state.initialCoords.x1)),x2:ne.invert(e+ne(u.state.initialCoords.x2)),y1:re.invert(t+re(u.state.initialCoords.y1)),y2:re.invert(t+re(u.state.initialCoords.y2))};var n=u.state.inProgressCoords,r=n.x1,a=n.y1,i=n.x2,o=n.y2;[u.chartObject,u.shadowChartObject].forEach((function(e){return e.crossValue(be(r,i)).mainValue(xe(r,a,i,o))})),Fe()},u.stopMoving=function(){u.state.initialCoords=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?D(Object(n),!0).forEach((function(t){var r,a,i,o;r=e,a=t,i=n[t],o=function(e,t){if("object"!=A(e)||!e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,"string");if("object"!=A(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}(a),(a="symbol"==A(o)?o:String(o))in r?Object.defineProperty(r,a,{value:i,enumerable:!0,configurable:!0,writable:!0}):r[a]=i})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):D(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},u.state.inProgressCoords);var e=u.state.initialCoords,t=e.x1,n=e.y1,r=e.x2,a=e.y2;[u.chartObject,u.shadowChartObject].forEach((function(e){return e.crossValue(be(t,r)).mainValue(xe(t,n,r,a))})),Fe()},u.id=f,u.chartObject=v,h.drawings.push(u),u.disable=function(){v.mainValue((function(e){})),u.shadowChartObject&&u.shadowChartObject.mainValue((function(e){}))},u.enable=function(){var e=u.state.initialCoords,t=e.x1,n=e.y1,r=e.x2,a=e.y2;v.mainValue(xe(t,n,r,a)),u.shadowChartObject&&u.shadowChartObject.mainValue(xe(t,n,r,a))},u.refreshOptions=function(){v.decorate(m)},Ae(ye,v);var y=function(){De(ye,u.chartObject),u.shadowChartObject&&De(ye,u.shadowChartObject),i(h.drawings,u)},g=y;return c.hideFromInfoBox||(g=$(u,(function(){u.state.enabled=!u.state.enabled,u.state.enabled?u.enable():u.disable()}),null,y).remove),{remove:g}}h.textDrawings=[];var Me=fc.autoBandwidth(fc.seriesWebglCandlestick()).decorate(S(l.colors,1)),Ee=fc.seriesSvgLine(),Oe=d3.scaleLinear(),Pe=function(){var e=s.map((function(e){return e.volume})),t=Math.max.apply(Math,N(e)),n=Math.min.apply(Math,N(e));Oe.domain([n/1.3,t])};Pe();var je=fc.autoBandwidth(fc.seriesWebglBar()).crossValue((function(e){return e.date})).mainValue((function(e){return e.volume})).decorate(S(l.colors,.8)),Te=fc.seriesWebglMulti();function Ae(e,t){var n=e.series();e.series([].concat(N(n),[t])),Fe()}function De(e,t){var n=e.series();i(n,t),e.series(n),Fe()}Te.xScale(ne).yScale(re).series([Me]);var Ne=fc.chartCartesian(ne,re).webglPlotArea(Te).svgPlotArea(ye).decorate((function(e){e.enter().call(k),e.enter().select(".svg-plot-area").call(M("border-bottom","1px solid rgba(0, 0, 0, 0.1)")),e.enter().selectAll(".x-axis").call(E),e.enter().selectAll(".top-label").call(E),e.enter().selectAll("svg").call(M("font-size","14px")),e.enter().selectAll(".plot-area").call(se,ne)})),Ie=fc.chartCartesian({xScale:ne,yScale:Oe,yAxis:{right:function(e){return fc.axisRight(e).ticks(3)}}}).webglPlotArea(je).svgPlotArea(Ee).decorate((function(e){e.enter().call(k),e.enter().selectAll(".plot-area").call(se,ne),e.enter().selectAll(".x-axis").call(se,ne),e.enter().selectAll(".top-label").call(E),e.enter().selectAll("svg").call(M("font-size","14px"))})),Ve=!1;function He(){if(0!==s.length){var e=ne.invert(y.x),t=s.reduce((function(t,n){return Math.abs(n.date-e)<Math.abs(t.date-e)?n:t}));Ve&&function(e){var t=[re(e.open),re(e.high),re(e.low),re(e.close)].reduce((function(e,t){return Math.abs(t-y.y)<Math.abs(e-y.y)?t:e}));y.x=ne(e.date),y.y=t,h.mode===m&&we(y.x,y.y)}(t),v.forEach((function(e){return e(t)})),Be()}}function Be(){d3.select("#ohlc-chart svg").datum([y]).call(ue);var e=re.range()[0];d3.select("#volume-chart svg").datum([{x:y.x,y:y.y-e}]).call(ue);var t=e+Oe.range()[0],n="#volume-chart";h.additionalPanes.forEach((function(e){var r=e.id,a=e.yScale;d3.select("".concat(r," svg")).datum([{x:y.x,y:y.y-t}]).call(ue),n=r,t+=a.range()[0]}));var r=null!=h.currentBar?h.currentBar.date.toLocaleString():"",i=d3.select("#x-label"),o=function(e){if("#ohlc-chart"===e)return re;if("#volume-chart"===e)return Oe;for(var t=0;t<h.additionalPanes.length;t++){var n=h.additionalPanes[t],r=n.id,a=n.yScale;if(e===r)return a}}(h.currentPaneId),l=y.y-function(e){if("#ohlc-chart"===e)return 0;if("#volume-chart"===e)return re.range()[0];for(var t=re.range()[0]+Oe.range()[0],n=0;n<h.additionalPanes.length;n++){var r=h.additionalPanes[n],a=r.id,i=r.yScale;if(e===a)break;t+=i.range()[0]}return t}(h.currentPaneId),c=a(o.invert(l)),s=d3.select("#y-label");if(y.x<0||y.y<0)return i.remove(),void s.remove();var u=function(e,t,n,a){var i=e.attr("id"),o="x-label"===i?"translate(".concat(y.x,",18)"):"translate(5,".concat(l,")");e.attr("transform",o),t.style("fill","white"),n.style("fill","black"),a.text("x-label"===i?r:c).style("fill","white");var s=a.node().getBBox();t.attr("x",s.x-5).attr("y",s.y-5).attr("width",s.width+10).attr("height",s.height+10),n.attr("x",s.x-5).attr("y",s.y-5).attr("width",s.width+10).attr("height",s.height+10),e.raise()};i.empty()?d3.select("".concat(n," .bottom-axis svg")).each((function(){var e=d3.select(this).append("g").attr("id","x-label"),t=e.append("rect").attr("id","rect1"),n=e.append("rect").attr("id","rect2"),r=e.append("text");u(e,t,n,r)})):i.each((function(){var e=d3.select(this),t=e.select("rect#rect1"),n=e.select("rect#rect2"),r=e.select("text");u(e,t,n,r)})),s.empty()?d3.select("".concat(h.currentPaneId," .right-axis svg")).each((function(){var e=d3.select(this).append("g").attr("id","y-label"),t=e.append("rect").attr("id","rect1"),n=e.append("rect").attr("id","rect2"),r=e.append("text");u(e,t,n,r)})):s.each((function(){var e=d3.select(this),t=e.select("rect#rect1"),n=e.select("rect#rect2"),r=e.select("text");u(e,t,n,r)}))}document.addEventListener("keydown",(function(e){"Shift"===e.key&&(Ve=!0,He())})),document.addEventListener("keyup",(function(e){"Shift"===e.key&&(Ve=!1,He())}));var We=function(e){y.x=e.layerX;var t=ne.range()[1];e.layerX>t&&(y.x=t)};function ze(e){h.currentPaneId!==e&&d3.select("#y-label").remove(),h.currentPaneId=e}function Fe(){d3.select("#ohlc-chart").datum(s).call(Ne),d3.select("#volume-chart").datum(s).call(Ie),h.additionalPanes.forEach((function(e){var t=e.id,n=e.chart;d3.select(t).datum(s).call(n)})),h.volumeVisible?j("#volume-chart"):P("#volume-chart"),Be()}return d3.select("#ohlc-chart").on("mousemove",(function(e){ze("#ohlc-chart"),We(e),y.y=e.layerY,He(),h.mode===m?we(y.x,y.y):h.mode===p&&function(e,t){if(h.activeDrag){var n=0,r=0;h.activeDrag.drawing.moreOpts.dragConstrainX||(n=e-h.activeDrag.initialX),h.activeDrag.drawing.moreOpts.dragConstrainY||(r=t-h.activeDrag.initialY),h.activeDrag.drawing.move(n,r)}}(y.x,y.y)})).on("mouseleave",(function(e){h.mode===p&&ke()})).on("click",(function(e){if(h.mode===f)return t=y.x,n=y.y,r=fc.seriesSvgLine().xScale(ne).yScale(re).decorate((function(e){e.attr("stroke",ve)})),Ae(ye,r),h.activeLine={x1:ne.invert(t),y1:re.invert(n),chartObject:r},void g(m);var t,n,r;if(h.mode===m){var a=ne.invert(y.x),i=re.invert(y.y);return Ce("",h.activeLine.x1,h.activeLine.y1,a,i,{draggable:!0}),void g(u)}for(var o=0;o<h.drawings.length;o++)if(e.target.id.split("-")[0]===h.drawings[o].id)return void(h.mode===p?Se(e,h.drawings[o]):ke());h.mode!==p||ke()})).on("contextmenu",(function(e){e.preventDefault(),g(u)})),document.body.addEventListener("keypress",(function(){g(u)})),d3.select("#volume-chart").on("mousemove",(function(e){ze("#volume-chart"),We(e);var t=re.range()[0];y.y=e.layerY;var n=Oe.range()[0];e.layerY>n&&(y.y=n),y.y+=t,He()})),v.forEach((function(e){0!==s.length&&e(s[s.length-1])})),Fe(),c.forEach((function(e,n){if("volume"!==e&&"ohlcBox"!==e){var r=t(d[n.iName]);r.iName=n.iName;var a=r.name;if(r.name=function(e){return a(e)+": "},n.options)for(var i in n.options)n.options.hasOwnProperty(i)&&(r.options[i]=n.options[i]);r.id=e,fe(r)}})),{addTextDrawing:function(e,t,n){var r=document.querySelector("#ohlc-chart .plot-area svg");if(r){var a=document.createElementNS("http://www.w3.org/2000/svg","text");a.setAttributeNS(null,"x",ne(e)),a.setAttributeNS(null,"y",re(t)),a.style.textAnchor="middle",a.innerHTML=n,r.appendChild(a);var o={x:e,y:t,elem:a,remove:function(){i(h.textDrawings,o),elem.remove()}};return h.textDrawings.push(o),a}},addLineDrawing:Ce,refreshData:function(e,t){var n=!1,r=0;(function(e,t){if(e.length<2||t.length<0)return!1;var n=e[e.length-1].date.getTime();if(!(t[t.length-1].date.getTime()-n>=0))return!1;for(var r=t.length-1;r>0;r--)if(t[r].date.getTime()>=n&&t[r-1].date.getTime()<=n)return!0;return!1})(s,e)&&(n=!0,r=e[e.length-1].date.getTime()-s[s.length-1].date.getTime()),s=e.map((function(e,t,n){return B(e,t,n)})),!t&&n?function(e){var t=ne.domain();ne.domain([new Date(t[0].getTime()+e).getTime(),new Date(t[1].getTime()+e).getTime()]),oe()}(r):le(),ce(),Pe(),h.indicators.forEach((function(e){var t=e.refreshDomain;t&&t()})),Fe()},setScaleExtent:function(e){se.scaleExtent(e)}}}})();
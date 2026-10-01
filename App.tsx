/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Volume2, Search, Eye, EyeOff, Copy, Check, CheckCircle2,
  XCircle, RotateCcw, ArrowRight, Award, Mic, Square, Sparkles, Layers, Quote
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* =========================================================
   AUDIO & UTILITIES
========================================================= */
function speakSpanish(text: string, rate: number = 0.9): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith('es-AR') || v.lang.startsWith('es'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

class SoundFX {
  private ctx: AudioContext | null = null;
  private getCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  playCorrect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
  playIncorrect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}
const sounds = new SoundFX();

/* =========================================================
   LESSON DATA (ESPAÑOL / ՀԱՅԵՐԵՆ)
========================================================= */
const SUBTITLES = [
  { id: 1, time: '0:06', sec: 6, es: 'Hola, soy Natalia Oreiro y estoy en la inauguración de la peluquería Sedal en la playa de Mar del Plata.', hy: 'Բարև, ես Նատալիա Օրեյրոն եմ և գտնվում եմ Մար դել Պլատայի լողափում՝ Sedal վարսավիրանոցի բացման արարողությանը։' },
  { id: 2, time: '0:18', sec: 18, es: 'En principio mi intención es descansar los primeros meses del año. Tuve un 2013 con mucho trabajo.', hy: 'Սկզբում իմ մտադրությունն է հանգստանալ տարվա առաջին ամիսներին։ 2013 թվականը շատ աշխատանքային տարի էր ինձ համար։' },
  { id: 3, time: '0:24', sec: 24, es: 'Pero tengo nuevas giras con la música, voy a volver a viajar al exterior, voy a filmar una película, voy a hacer desfiles con la Soreiro.', hy: 'Բայց ես նոր երաժշտական շրջագայություններ ունեմ, կրկին արտասահման եմ ճանապարհորդելու, ֆիլմ եմ նկարահանելու և Soreiro-ի հետ նորաձևության ցուցադրություններ եմ անելու։' },
  { id: 4, time: '0:33', sec: 33, es: 'Tengo un año sin televisión, pero de cine y de viajes, de música.', hy: 'Այս տարի հեռուստատեսային աշխատանք չեմ ունենալու, բայց կունենամ կինո, ճանապարհորդություններ և երաժշտություն։' },
  { id: 5, time: '0:42', sec: 42, es: 'Bueno, mis peinados favoritos siempre son las trenzas. Me gusta mucho hacerme trenzas y aparte está bueno poder recogerte el pelo.', hy: 'Իմ ամենասիրելի սանրվածքները միշտ հյուսքերն են։ Ես շատ եմ սիրում հյուսքեր անել, և նաև լավ է, որ կարելի է մազերը հավաքել։' },
  { id: 6, time: '0:47', sec: 47, es: 'Te las puedes hacer de costado. Si te metes en la página de Sedal vas a ver que yo te enseño cómo hacerte las trenzas.', hy: 'Կարելի է հյուսքերը կողքից անել։ Եթե մտնես Sedal-ի էջ, կտեսնես, որ ես ցույց եմ տալիս, թե ինչպես կարելի է հյուսքեր անել։' },
  { id: 7, time: '0:52', sec: 52, es: 'Pero generalmente ahora yo estoy usando mucho como una trenza cosida acá, otra trenza cosida acá, me la hago yo sola, me lo uno acá y me lo dejo todo para el costado.', hy: 'Բայց հիմա ես հիմնականում այսպիսի հյուսք եմ անում այստեղ, մյուսը՝ այստեղ։ Ես դա ինքս եմ անում, հետո միացնում եմ և ամբողջ մազերը թողնում եմ մի կողմում։' },
  { id: 8, time: '1:05', sec: 65, es: 'La verdad es que he tenido todos los looks. Dos veces tuve el pelo corto, pero me gusta mucho más el pelo largo. Te permite jugar más, cambiar más de looks.', hy: 'Իրականում ես շատ տարբեր արտաքին տեսքեր եմ ունեցել։ Երկու անգամ կարճ մազեր եմ ունեցել, բայց երկար մազերն ինձ շատ ավելի են դուր գալիս։ Դրանք հնարավորություն են տալիս ավելի շատ փորձել և փոխել արտաքին տեսքը։' },
  { id: 9, time: '1:19', sec: 79, es: 'Y es posible, pero todavía no lo pensé. Tengo una película donde tengo que tener el pelo muy largo, que es la película de Juana Azurduy, así que seguramente no me lo corte, me lo deje crecer.', hy: 'Դա հնարավոր է, բայց դեռ չեմ մտածել դրա մասին։ Ես ֆիլմ ունեմ, որտեղ պետք է շատ երկար մազեր ունենամ։ Դա Juana Azurduy-ի մասին ֆիլմն է, այնպես որ հավանաբար մազերս չեմ կտրի և կթողնեմ, որ երկարեն։' },
  { id: 10, time: '1:34', sec: 94, es: 'Estamos inaugurando junto a Sergio la Mesa la peluquería de Sedal en Mar del Plata. Estamos muy contentos. Con Sergio somos amigos.', hy: 'Սերխիո Լա Մեսայի հետ միասին բացում ենք Sedal-ի վարսավիրանոցը Մար դել Պլատայում։ Մենք շատ ուրախ ենք։ Սերխիոյի հետ ընկերներ ենք։' },
  { id: 11, time: '1:40', sec: 100, es: 'Así que nos divirtió muchísimo poder hacer una peluquería en la playa. Yo creo que es el lugar ideal. La gente viene, la pasa bien, en el verano el pelo se te daña un montón y qué mejor que venir y que la gente de Sedal especializada te lo reconstituya.', hy: 'Այդ պատճառով մեզ համար շատ զվարճալի էր լողափում վարսավիրանոց ստեղծելը։ Կարծում եմ՝ դա իդեալական վայր է։ Մարդիկ գալիս են, լավ ժամանակ անցկացնում, իսկ ամռանը մազերը շատ են վնասվում, և շատ լավ է գալ այստեղ, որպեսզի Sedal-ի մասնագետները վերականգնեն դրանք։' }
];

const VOCABULARY = [
  { id: 1, word: 'la peluquería', hy: 'վարսավիրանոց', esEx: 'Estamos inaugurando la peluquería en la playa.', hyEx: 'Մենք լողափում գտնվող վարսավիրանոցի բացմանն ենք։', cat: 'peluquería' },
  { id: 2, word: 'la inauguración', hy: 'բացում / բացման արարողություն', esEx: 'Hoy es la inauguración oficial del nuevo espacio.', hyEx: 'Այսօր նոր տարածքի պաշտոնական բացումն է։', cat: 'carrera' },
  { id: 3, word: 'descansar', hy: 'հանգստանալ', esEx: 'Mi intención principal es descansar los primeros meses del año.', hyEx: 'Իմ գլխավոր մտադրությունն է հանգստանալ տարվա առաջին ամիսներին։', cat: 'carrera' },
  { id: 4, word: 'la gira', hy: 'շրջագայություն', esEx: 'Natalia tiene nuevas giras musicales por varios países.', hyEx: 'Նատալիան նոր երաժշտական շրջագայություններ ունի։', cat: 'carrera' },
  { id: 5, word: 'viajar al exterior', hy: 'արտասահման ճանապարհորդել', esEx: 'Voy a volver a viajar al exterior para mis conciertos.', hyEx: 'Ես կրկին արտասահման եմ ճանապարհորդելու։', cat: 'carrera' },
  { id: 6, word: 'filmar', hy: 'նկարահանել', esEx: 'La actriz va a filmar una película histórica.', hyEx: 'Դերասանուհին պատմական ֆիլմ է նկարահանելու։', cat: 'carrera' },
  { id: 7, word: 'el desfile', hy: 'նորաձևության ցուցադրություն', esEx: 'Va a organizar desfiles de moda con su propia marca.', hyEx: 'Նորաձևության ցուցադրություններ է կազմակերպելու։', cat: 'estilo' },
  { id: 8, word: 'el peinado', hy: 'սանրվածք', esEx: 'Mis peinados favoritos siempre son cómodos.', hyEx: 'Իմ սիրելի սանրվածքները միշտ հարմարավետ են։', cat: 'estilo' },
  { id: 9, word: 'la trenza', hy: 'հյուսք', esEx: 'Me encanta hacerme trenzas para los días de calor.', hyEx: 'Շոգ օրերին ես շատ եմ սիրում հյուսքեր անել։', cat: 'estilo' },
  { id: 10, word: 'recogerse el pelo', hy: 'մազերը հավաքել', esEx: 'Está muy bueno poder recogerte el pelo en la playa.', hyEx: 'Լողափում շատ հարմար է մազերը հավաքել։', cat: 'peluquería' },
  { id: 11, word: 'el pelo corto', hy: 'կարճ մազեր', esEx: 'Dos veces en su vida tuvo el pelo corto.', hyEx: 'Իր կյանքում երկու անգամ կարճ մազեր է ունեցել։', cat: 'estilo' },
  { id: 12, word: 'el pelo largo', hy: 'երկար մազեր', esEx: 'Prefiere el pelo largo porque permite cambiar más de look.', hyEx: 'Նախընտրում է երկար մազերը, քանի որ թույլ են տալիս փոխել տեսքը։', cat: 'estilo' },
  { id: 13, word: 'el look', hy: 'արտաքին տեսք / ոճ', esEx: 'El pelo largo te permite probar diferentes looks.', hyEx: 'Երկար մազերը թույլ են տալիս տարբեր տեսքեր փորձել։', cat: 'estilo' },
  { id: 14, word: 'dejarse crecer el pelo', hy: 'մազերը երկարացնել', esEx: 'Se va a dejar crecer el pelo para una película.', hyEx: 'Ֆիլմի համար մազերը կերկարացնի։', cat: 'peluquería' },
  { id: 15, word: 'dañarse', hy: 'վնասվել', esEx: 'En el verano el pelo se daña fácilmente por el sol.', hyEx: 'Ամռանը մազերը հեշտությամբ վնասվում են արևից։', cat: 'peluquería' },
  { id: 16, word: 'reconstituir', hy: 'վերականգնել', esEx: 'Los especialistas te reconstituyen el pelo dañado.', hyEx: 'Մասնագետները վերականգնում են վնասված մազերը։', cat: 'peluquería' }
];

const QUIZ_QUESTIONS = [
  { id: 1, q: '¿Dónde está Natalia Oreiro al comienzo de la entrevista?', opts: [{ l: 'a', t: 'En un estudio de televisión en Buenos Aires' }, { l: 'b', t: 'En la inauguración de una peluquería en Mar del Plata' }, { l: 'c', t: 'En una conferencia de prensa en el aeropuerto' }, { l: 'd', t: 'En el ensayo general de un teatro musical' }], ans: 'b', expEs: 'Natalia dice: "Estoy en la inauguración de la peluquería Sedal en la playa de Mar del Plata."', expHy: 'Նատալիան ասում է, որ գտնվում է Մար դել Պլատայի լողափին՝ Sedal-ի բացմանը։' },
  { id: 2, q: '¿Qué quiere hacer Natalia durante los primeros meses del año?', opts: [{ l: 'a', t: 'Descansar tras un año 2013 con mucho trabajo' }, { l: 'b', t: 'Comenzar a rodar una serie diaria de televisión' }, { l: 'c', t: 'Establecerse de forma permanente en otro continente' }, { l: 'd', t: 'Abrir una cadena de salones de belleza' }], ans: 'a', expEs: 'Explica: "En principio mi intención es descansar los primeros meses del año."', expHy: 'Նա բացատրում է, որ առաջին ամիսներին ցանկանում է հանգստանալ։' },
  { id: 3, q: '¿Qué planes profesionales menciona Natalia para este año?', opts: [{ l: 'a', t: 'Abrir una academia de música para jóvenes artistas' }, { l: 'b', t: 'Alejarse por completo de la música y del cine' }, { l: 'c', t: 'Viajar al exterior, filmar una película y hacer música' }, { l: 'd', t: 'Dedicarse únicamente a presentar programas de televisión' }], ans: 'c', expEs: 'Menciona nuevas giras, viajar al exterior, filmar una película y desfiles.', expHy: 'Նշում է համերգային շրջագայություններ, արտասահման մեկնելը և ֆիլմ նկարահանելը։' },
  { id: 4, q: '¿Cuáles son los peinados favoritos de Natalia Oreiro?', opts: [{ l: 'a', t: 'El cabello completamente suelto y alisado' }, { l: 'b', t: 'Las trenzas' }, { l: 'c', t: 'Los cortes asimétricos muy cortos' }, { l: 'd', t: 'Las melenas con volumen y rizos definidos' }], ans: 'b', expEs: 'Afirma claramente: "Mis peinados favoritos siempre son las trenzas."', expHy: 'Նա հստակ ասում է, որ իր սիրելի սանրվածքները միշտ հյուսքերն են։' },
  { id: 5, q: '¿Qué tipo de longitud de pelo prefiere Natalia?', opts: [{ l: 'a', t: 'El pelo rapado a los lados' }, { l: 'b', t: 'El pelo corto estilo pixie' }, { l: 'c', t: 'No tiene preferencia, le da exactamente igual' }, { l: 'd', t: 'El pelo largo' }], ans: 'd', expEs: 'Natalia comenta: "Me gusta mucho más el pelo largo."', expHy: 'Նատալիան նշում է, որ երկար մազերն իրեն շատ ավելի են դուր գալիս։' },
  { id: 6, q: '¿Por qué razón prefiere Natalia tener el pelo largo?', opts: [{ l: 'a', t: 'Porque requiere menos cuidados y productos' }, { l: 'b', t: 'Porque le permite jugar más y cambiar más de look' }, { l: 'c', t: 'Porque los directores de cine se lo exigen siempre' }, { l: 'd', t: 'Porque nunca se ha atrevido a cortarse el pelo' }], ans: 'b', expEs: 'Dice: "Te permite jugar más, cambiar más de looks."', expHy: 'Նա նշում է, որ երկար մազերը թույլ են տալիս ավելի շատ փոխել տեսքը։' },
  { id: 7, q: '¿Por qué probablemente no se cortará el pelo en los próximos meses?', opts: [{ l: 'a', t: 'Porque no confía en los estilistas de su ciudad' }, { l: 'b', t: 'Porque su amigo Sergio le prohibió cortarlo' }, { l: 'c', t: 'Porque necesita tener el pelo muy largo para la película de Juana Azurduy' }, { l: 'd', t: 'Porque piensa retirarse del espectáculo' }], ans: 'c', expEs: 'Tendrá que tener el pelo largo para interpretar a Juana Azurduy.', expHy: 'Juana Azurduy-ի մասին ֆիլմի համար նրան պետք են շատ երկար մազեր։' },
  { id: 8, q: '¿Dónde está ubicada exactamente la peluquería de Sedal?', opts: [{ l: 'a', t: 'En la playa de Mar del Plata' }, { l: 'b', t: 'En el interior de un centro comercial cerrado' }, { l: 'c', t: 'En una avenida céntrica de la capital' }, { l: 'd', t: 'En el jardín de un hotel de lujo' }], ans: 'a', expEs: '"Nos divirtió muchísimo poder hacer una peluquería en la playa."', expHy: 'Վարսավիրանոցը բացվել է Մար դել Պլատայի լողափին։' },
  { id: 9, q: '¿Qué relación personal une a Natalia con Sergio Lamensa?', opts: [{ l: 'a', t: 'Son familiares lejanos' }, { l: 'b', t: 'Son socios en una empresa textil' }, { l: 'c', t: 'Son amigos' }, { l: 'd', t: 'Se acaban de conocer en el evento' }], ans: 'c', expEs: 'Dice sonriente: "Con Sergio somos amigos."', expHy: 'Նատալիան ուրախությամբ նշում է, որ իրենք ընկերներ են։' },
  { id: 10, q: '¿Qué le sucede al pelo durante el verano según Natalia?', opts: [{ l: 'a', t: 'Crece mucho más rápido por el clima cálido' }, { l: 'b', t: 'Se vuelve más brillante y no sufre ningún cambio' }, { l: 'c', t: 'Se daña un montón por el sol y el clima' }, { l: 'd', t: 'No necesita ningún tipo de tratamiento' }], ans: 'c', expEs: 'Ella afirma: "En el verano el pelo se te daña un montón."', expHy: 'Նա նշում է, որ ամռանը մազերը շատ են վնասվում։' },
  { id: 11, q: '¿Qué dice Natalia sobre su presencia en la televisión este año?', opts: [{ l: 'a', t: 'Tendrá un año sin televisión, pero de cine, música y viajes' }, { l: 'b', t: 'Grabará una telenovela diaria de más de cien episodios' }, { l: 'c', t: 'Presentará un concurso de talentos todos los fines de semana' }, { l: 'd', t: 'Se tomará un año completamente libre de cualquier trabajo' }], ans: 'a', expEs: 'Ella aclara: "Tengo un año sin televisión, pero de cine y de viajes, de música."', expHy: 'Նշում է, որ հեռուստատեսությունում չի աշխատելու, բայց կլինեն կինո և երաժշտություն։' },
  { id: 12, q: '¿Qué contenido comparte Natalia en la página oficial de Sedal?', opts: [{ l: 'a', t: 'Recetas de cocina saludable para el verano' }, { l: 'b', t: 'Tutoriales donde enseña cómo hacerse las trenzas' }, { l: 'c', t: 'Consejos para cantar y cuidar la voz en giras' }, { l: 'd', t: 'Técnicas de maquillaje para desfiles' }], ans: 'b', expEs: 'Natalia explica: "Yo te enseño cómo hacerte las trenzas."', expHy: 'Նա ցույց է տալիս, թե ինչպես կարելի է հյուսքեր անել։' },
  { id: 13, q: '¿Cuántas veces ha llevado el pelo corto Natalia en su vida?', opts: [{ l: 'a', t: 'Nunca ha llevado el pelo corto' }, { l: 'b', t: 'Una única vez durante su adolescencia' }, { l: 'c', t: 'Dos veces' }, { l: 'd', t: 'Más de diez veces para diferentes personajes' }], ans: 'c', expEs: 'Dice: "Dos veces tuve el pelo corto, pero me gusta mucho más el pelo largo."', expHy: 'Նատալիան ասում է, որ երկու անգամ կարճ մազեր է ունեցել։' }
];

const TRUE_FALSE_ITEMS = [
  { id: 1, st: 'Natalia quiere trabajar mucho en televisión este año.', isTrue: false, expEs: 'Falso. Natalia dice: "Tengo un año sin televisión".', expHy: 'Սխալ է։ Նատալիան նշում է, որ այս տարի հեռուստատեսությունում չի աշխատելու։' },
  { id: 2, st: 'Natalia prefiere el pelo largo porque le permite cambiar de look.', isTrue: true, expEs: 'Verdadero. Afirma: "Te permite jugar más, cambiar más de looks".', expHy: 'Ճիշտ է։ Երկար մազերը թույլ են տալիս ավելի շատ փոխել տեսքը։' },
  { id: 3, st: 'Natalia nunca ha tenido el pelo corto en toda su vida.', isTrue: false, expEs: 'Falso. Menciona que tuvo el pelo corto en dos ocasiones.', expHy: 'Սխալ է։ Նա երկու անգամ կարճ մազեր է ունեցել։' },
  { id: 4, st: 'La peluquería de Sedal está ubicada en la playa de Mar del Plata.', isTrue: true, expEs: 'Verdadero. La inauguración es en la playa de Mar del Plata.', expHy: 'Ճիշտ է։ Վարսավիրանոցը գտնվում է Մար դել Պլատայի լողափին։' },
  { id: 5, st: 'Natalia y Sergio Lamensa se acaban de conocer durante este evento.', isTrue: false, expEs: 'Falso. Natalia aclara que son amigos de antes.', expHy: 'Սխալ է։ Նատալիան ասում է, որ իրենք ընկերներ են։' },
  { id: 6, st: 'Natalia se dejará crecer el pelo para interpretar a Juana Azurduy.', isTrue: true, expEs: 'Verdadero. Para ese personaje histórico necesita pelo largo.', expHy: 'Ճիշտ է։ Այդ կերպարի համար նրան պետք են երկար մազեր։' },
  { id: 7, st: 'Según Natalia, el pelo no sufre ningún daño durante el verano.', isTrue: false, expEs: 'Falso. Advierte que en el verano el pelo se daña un montón.', expHy: 'Սխալ է։ Ամռանը մազերը շատ են վնասվում։' },
  { id: 8, st: 'En la página de Sedal, Natalia enseña cómo peinarse con trenzas.', isTrue: true, expEs: 'Verdadero. Enseña a hacerse las trenzas.', expHy: 'Ճիշտ է։ Նա ցույց է տալիս, թե ինչպես հյուսքեր անել։' }
];

const PHRASE_ITEMS = [
  { id: 1, quote: '«Me gusta mucho más el pelo largo.»', q: '¿Qué significa esta frase?', opts: [{ l: 'a', t: 'Prefiere tener el pelo largo antes que corto' }, { l: 'b', t: 'Tiene la intención de cortarse el pelo ya' }, { l: 'c', t: 'No le agrada cuidar su cabello' }, { l: 'd', t: 'Cree que el pelo largo no está de moda' }], ans: 'a', expEs: 'Expresa una clara preferencia por el cabello largo.', expHy: 'Նա նախընտրում է երկար մազերը։' },
  { id: 2, quote: '«En principio mi intención es descansar los primeros meses del año.»', q: '¿Qué significa esta frase?', opts: [{ l: 'a', t: 'Planea empezar proyectos muy pesados en enero' }, { l: 'b', t: 'Su idea es tomarse unas vacaciones a comienzos de año' }, { l: 'c', t: 'Ha decidido dejar su profesión para siempre' }, { l: 'd', t: 'No sabe qué planes tiene para el año' }], ans: 'b', expEs: 'Planea descansar tras un año de mucho trabajo.', expHy: 'Նրա նպատակն է հանգստանալ տարեսկզբին։' },
  { id: 3, quote: '«Te permite jugar más, cambiar más de looks.»', q: '¿Qué expresa sobre el pelo largo?', opts: [{ l: 'a', t: 'Que es incómodo para viajar' }, { l: 'b', t: 'Que solo sirve para películas de niños' }, { l: 'c', t: 'Que da libertad para experimentar con estilos' }, { l: 'd', t: 'Que exige mantener el mismo peinado siempre' }], ans: 'c', expEs: 'El pelo largo da versatilidad para probar diferentes estilos.', expHy: 'Երկար մազերը ազատություն են տալիս տարբեր ոճեր փորձելու։' },
  { id: 4, quote: '«En el verano el pelo se te daña un montón.»', q: '¿Qué advierte Natalia?', opts: [{ l: 'a', t: 'Que el pelo sufre deterioro por el sol y la sal' }, { l: 'b', t: 'Que el pelo se vuelve sano solo' }, { l: 'c', t: 'Que no hay que ir a la peluquería' }, { l: 'd', t: 'Que las trenzas estropean las puntas' }], ans: 'a', expEs: 'El verano y la playa maltratan el pelo.', expHy: 'Ամռանը մազերը շատ են վնասվում արևից և ծովից։' },
  { id: 5, quote: '«Qué mejor que venir y que la gente especializada te lo reconstituya.»', q: '¿Qué resalta Natalia?', opts: [{ l: 'a', t: 'Que no hace falta ir a expertos' }, { l: 'b', t: 'Que es excelente dejar que profesionales reparen el pelo' }, { l: 'c', t: 'Que es mejor cortarse el pelo uno mismo' }, { l: 'd', t: 'Que no hay solución para el cabello seco' }], ans: 'b', expEs: 'Es una gran ventaja tener expertos que reparen el cabello en la playa.', expHy: 'Հիանալի է, երբ մասնագետները վերականգնում են վնասված մազերը։' }
];

const FILL_BLANK_ITEMS = [
  { id: 1, blank: 'Mis peinados favoritos siempre son las ______.', full: 'Mis peinados favoritos siempre son las trenzas.', hy: 'Իմ ամենասիրելի սանրվածքները միշտ հյուսքերն են։', opts: [{ l: 'a', t: 'trenzas' }, { l: 'b', t: 'películas' }, { l: 'c', t: 'playas' }, { l: 'd', t: 'giras' }], ans: 'a' },
  { id: 2, blank: 'En principio mi intención es ______ los primeros meses del año.', full: 'En principio mi intención es descansar los primeros meses del año.', hy: 'Սկզբում իմ մտադրությունն է հանգստանալ տարվա առաջին ամիսներին։', opts: [{ l: 'a', t: 'filmar' }, { l: 'b', t: 'descansar' }, { l: 'c', t: 'cortar' }, { l: 'd', t: 'cantar' }], ans: 'b' },
  { id: 3, blank: 'Tengo nuevas giras con la música, voy a volver a ______ al exterior.', full: 'Tengo nuevas giras con la música, voy a volver a viajar al exterior.', hy: 'Երաժշտական շրջագայություններ ունեմ, կրկին արտասահման եմ ճանապարհորդելու։', opts: [{ l: 'a', t: 'peinar' }, { l: 'b', t: 'dormir' }, { l: 'c', t: 'viajar' }, { l: 'd', t: 'cerrar' }], ans: 'c' },
  { id: 4, blank: 'Voy a ______ una película y voy a hacer desfiles.', full: 'Voy a filmar una película y voy a hacer desfiles.', hy: 'Ֆիլմ եմ նկարահանելու և նորաձևության ցուցադրություններ եմ անելու։', opts: [{ l: 'a', t: 'filmar' }, { l: 'b', t: 'dañar' }, { l: 'c', t: 'lavar' }, { l: 'd', t: 'recoger' }], ans: 'a' },
  { id: 5, blank: 'Dos veces tuve el pelo corto, pero me gusta mucho más el pelo ______.', full: 'Dos veces tuve el pelo corto, pero me gusta mucho más el pelo largo.', hy: 'Երկու անգամ կարճ մազեր եմ ունեցել, բայց երկար մազերն ինձ ավելի են դուր գալիս։', opts: [{ l: 'a', t: 'teñido' }, { l: 'b', t: 'seco' }, { l: 'c', t: 'largo' }, { l: 'd', t: 'mojado' }], ans: 'c' },
  { id: 6, blank: 'Nos divirtió muchísimo poder hacer una peluquería en la ______.', full: 'Nos divirtió muchísimo poder hacer una peluquería en la playa.', hy: 'Մեզ համար շատ զվարճալի էր լողափում վարսավիրանոց ստեղծելը։', opts: [{ l: 'a', t: 'estación' }, { l: 'b', t: 'playa' }, { l: 'c', t: 'oficina' }, { l: 'd', t: 'montaña' }], ans: 'b' },
  { id: 7, blank: 'En el ______ el pelo se te daña un montón por el sol.', full: 'En el verano el pelo se te daña un montón por el sol.', hy: 'Ամռանը արևից մազերը շատ են վնասվում։', opts: [{ l: 'a', t: 'invierno' }, { l: 'b', t: 'otoño' }, { l: 'c', t: 'verano' }, { l: 'd', t: 'estudio' }], ans: 'c' },
  { id: 8, blank: 'Qué mejor que venir y que la gente especializada te lo ______.', full: 'Qué mejor que venir y que la gente especializada te lo reconstituya.', hy: 'Շատ լավ է գալ այստեղ, որպեսզի մասնագետները վերականգնեն այն։', opts: [{ l: 'a', t: 'reconstituya' }, { l: 'b', t: 'oculte' }, { l: 'c', t: 'olvide' }, { l: 'd', t: 'rompa' }], ans: 'a' }
];

const SPEAKING_PROMPTS = [
  { id: 1, es: '¿Qué peinado te gusta más llevar en tu día a día?', hy: 'Ո՞ր սանրվածքն է քեզ ամենաշատը դուր գալիս կրել առօրյայում։', startEs: 'A mí personalmente me gusta más llevar el pelo...', startHy: 'Անձամբ ինձ ավելի շատ դուր է գալիս մազերը կրել...', kw: ['suelto', 'recogido', 'con trenzas', 'muy natural'] },
  { id: 2, es: '¿Prefieres el pelo largo o corto? ¿Por qué?', hy: 'Նախընտրո՞ւմ ես երկար, թե կարճ մազեր։ Ինչո՞ւ։', startEs: 'Yo prefiero el pelo [largo / corto] porque...', startHy: 'Ես նախընտրում եմ [երկար / կարճ] մազերը, քանի որ...', kw: ['es más cómodo', 'cambiar de look', 'más elegante'] },
  { id: 3, es: '¿Te gustan las trenzas? ¿Sabes hacértelas tú mismo/a?', hy: 'Սիրո՞ւմ ես հյուսքերը։ Կարողանո՞ւմ ես ինքնուրույն անել դրանք։', startEs: 'Sí / No, las trenzas me parecen... y yo...', startHy: 'Այո / Ոչ, իմ կարծիքով հյուսքերը... են, և ես...', kw: ['hacerme trenzas', 'yo solo/a', 'de costado'] },
  { id: 4, es: '¿Qué haces normalmente con tu pelo durante el verano?', hy: 'Ամռանը սովորաբար ի՞նչ ես անում մազերիդ հետ։', startEs: 'En los meses de verano normalmente suelo...', startHy: 'Ամռան ամիսներին սովորաբար ես...', kw: ['recogerme el pelo', 'protegerlo del sol', 'ir a la playa'] },
  { id: 5, es: '¿Te gustaría cambiar de look radicalmente este año?', hy: 'Կցանկանայի՞ր այս տարի արմատապես փոխել արտաքին տեսքդ։', startEs: 'Me gustaría cambiar de look porque... / No me gustaría porque...', startHy: 'Ես կցանկանայի փոխել տեսքս, քանի որ... / Չէի ցանկանա...', kw: ['cortarme el pelo', 'cambiar de color', 'un estilo nuevo'] },
  { id: 6, es: '¿Qué planes profesionales o de descanso tienes para este año?', hy: 'Ի՞նչ մասնագիտական կամ հանգստի ծրագրեր ունես այս տարվա համար։', startEs: 'Este año mi intención principal es...', startHy: 'Այս տարի իմ գլխավոր մտադրությունն է...', kw: ['descansar', 'aprender español', 'viajar al exterior'] },
  { id: 7, es: '¿Te gusta viajar al exterior? ¿Qué país hispanohablante te gustaría visitar?', hy: 'Սիրո՞ւմ ես արտասահման ճանապարհորդել։ Իսպանախոս ո՞ր երկիր կցանկանայի այցելել։', startEs: 'Me encanta viajar al exterior y me gustaría mucho visitar...', startHy: 'Ես շատ եմ սիրում ճանապարհորդել և կցանկանայի այցելել...', kw: ['España', 'Argentina', 'Uruguay', 'México'] },
  { id: 8, es: '¿Qué te parece la idea de tener una peluquería en la playa como Sedal en Mar del Plata?', hy: 'Ի՞նչ ես կարծում լողափում վարսավիրանոց ունենալու գաղափարի մասին։', startEs: 'A mí la idea de una peluquería en la playa me parece...', startHy: 'Լողափում վարսավիրանոց ունենալու գաղափարը իմ կարծիքով...', kw: ['muy original', 'súper divertida', 'ideal para el verano'] }
];

/* =========================================================
   MAIN APP COMPONENT
========================================================= */
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('todo');
  const [videoTimestamp, setVideoTimestamp] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Subtitles state
  const [searchTerm, setSearchTerm] = useState('');
  const [showArmenian, setShowArmenian] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Vocab state
  const [vocabCat, setVocabCat] = useState<string>('todas');
  const [isFlashcard, setIsFlashcard] = useState<boolean>(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Quiz state
  const [qIdx, setQIdx] = useState<number>(0);
  const [qSelected, setQSelected] = useState<string | null>(null);
  const [qAnswered, setQAnswered] = useState<boolean>(false);
  const [qScore, setQScore] = useState<number>(0);
  const [qFinished, setQFinished] = useState<boolean>(false);

  // True/False state
  const [tfIdx, setTfIdx] = useState<number>(0);
  const [tfChoice, setTfChoice] = useState<boolean | null>(null);
  const [tfAnswered, setTfAnswered] = useState<boolean>(false);
  const [tfScore, setTfScore] = useState<number>(0);
  const [tfFinished, setTfFinished] = useState<boolean>(false);

  // Phrase meaning state
  const [pmIdx, setPmIdx] = useState<number>(0);
  const [pmSelected, setPmSelected] = useState<string | null>(null);
  const [pmAnswered, setPmAnswered] = useState<boolean>(false);
  const [pmScore, setPmScore] = useState<number>(0);
  const [pmFinished, setPmFinished] = useState<boolean>(false);

  // Fill in blank state
  const [fbIdx, setFbIdx] = useState<number>(0);
  const [fbSelected, setFbSelected] = useState<string | null>(null);
  const [fbAnswered, setFbAnswered] = useState<boolean>(false);
  const [fbScore, setFbScore] = useState<number>(0);
  const [fbFinished, setFbFinished] = useState<boolean>(false);

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Speaking state
  const [speakIdx, setSpeakIdx] = useState<number>(1);
  const [spokenNotes, setSpokenNotes] = useState<Record<number, string>>({});
  const [spokenAudios, setSpokenAudios] = useState<Record<number, string>>({});
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Reset all progress
  const handleResetAll = () => {
    setQIdx(0);
    setQSelected(null);
    setQAnswered(false);
    setQScore(0);
    setQFinished(false);

    setTfIdx(0);
    setTfChoice(null);
    setTfAnswered(false);
    setTfScore(0);
    setTfFinished(false);

    setPmIdx(0);
    setPmSelected(null);
    setPmAnswered(false);
    setPmScore(0);
    setPmFinished(false);

    setFbIdx(0);
    setFbSelected(null);
    setFbAnswered(false);
    setFbScore(0);
    setFbFinished(false);

    setFlippedCards({});
    setSearchTerm('');
    setSpokenNotes({});
    setSpokenAudios({});
    setSpeakIdx(1);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setShowResetModal(false);
    sounds.playCorrect();
  };

  // Video seek helper
  const handleSeek = (seconds: number) => {
    setVideoTimestamp(seconds);
    if (iframeRef.current) {
      iframeRef.current.src = `https://www.youtube.com/embed/p2j13KraOuE?start=${seconds}&autoplay=1`;
      iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Recording helpers
  const handleStartRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setSpokenAudios(prev => ({ ...prev, [speakIdx]: URL.createObjectURL(blob) }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleStopRec = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const filteredSubs = SUBTITLES.filter(s =>
    s.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.hy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVocab = VOCABULARY.filter(v => vocabCat === 'todas' || v.cat === vocabCat);

  const currentQ = QUIZ_QUESTIONS[qIdx];
  const currentTf = TRUE_FALSE_ITEMS[tfIdx];
  const currentPm = PHRASE_ITEMS[pmIdx];
  const currentFb = FILL_BLANK_ITEMS[fbIdx];
  const currentSpeak = SPEAKING_PROMPTS.find(p => p.id === speakIdx) || SPEAKING_PROMPTS[0];

  const totalScore = (qFinished ? qScore : 0) + (tfFinished ? tfScore : 0) + (pmFinished ? pmScore : 0) + (fbFinished ? fbScore : 0);
  const totalMax = 13 + 8 + 5 + 8; // 34
  const pct = Math.round((totalScore / totalMax) * 100);

  const navTabs = [
    { id: 'video', es: 'Video', hy: 'Տեսանյութ', icon: '🎬' },
    { id: 'subtitulos', es: 'Subtítulos', hy: 'Ենթագրեր', icon: '📜' },
    { id: 'vocabulario', es: 'Palabras', hy: 'Բառապաշար', icon: '📚' },
    { id: 'comprension', es: 'Comprensión', hy: 'Ըմբռնում', icon: '❓' },
    { id: 'verdadero-falso', es: 'V o F', hy: 'Ճիշտ-Սխալ', icon: '⚖️' },
    { id: 'frases', es: 'Frases', hy: 'Ֆրազներ', icon: '💡' },
    { id: 'completa', es: 'Completa', hy: 'Լրացրու', icon: '✏️' },
    { id: 'habla', es: 'Habla tú', hy: 'Խոսիր դու', icon: '🎙️' }
  ];

  return (
    <div className="min-h-screen bg-[#fffdfa] text-stone-900 flex flex-col font-sans">
      {/* 4-Color Rainbow Top Stripe: Yellow, Orange, Red, Burgundy */}
      <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20]" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fffdfa]/95 backdrop-blur-md border-b-2 border-orange-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 via-red-600 to-[#670a20] p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#670a20] flex items-center justify-center text-yellow-300 font-serif text-xl font-black">
                ES
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2.5">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#670a20]">
                  Aprende Español con Natalia Oreiro
                </h1>
                <span className="text-red-400 font-bold hidden sm:inline">|</span>
                <span className="text-sm sm:text-base font-bold text-red-600">
                  Սովորիր իսպաներեն
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                Nivel A2–B1 · Mar del Plata · Peluquería Sedal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex flex-col items-end">
              <span className="text-stone-500 font-medium text-xs">Progreso · Դասի առաջընթացը</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-[#670a20]">{totalScore} / {totalMax}</span>
                <span className="text-red-400">·</span>
                <span className="text-red-600 font-black">{pct}%</span>
              </div>
            </div>
            <div className="w-24 sm:w-32 h-3 bg-orange-100 rounded-full overflow-hidden p-0.5 border border-orange-300">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 via-red-500 to-[#670a20] transition-all duration-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Botón de reinicio en el encabezado */}
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 border-2 border-red-200 transition font-black text-xs cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
              title="Reiniciar todo el progreso · Զրոյացնել ամբողջ առաջընթացը"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Reiniciar · Զրոյացնել</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#670a20] via-red-700 to-orange-600 text-yellow-300 shadow-md border border-yellow-400/50'
                    : 'text-stone-700 hover:text-red-700 hover:bg-orange-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-extrabold">{tab.es}</span>
                <span className={`text-[11px] sm:text-xs font-normal ${activeTab === tab.id ? 'text-yellow-200' : 'text-stone-400'}`}>
                  · {tab.hy}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 sm:py-9 space-y-10">
        {/* Banner with 4 warm colors */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 border-yellow-300/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-yellow-200">
              <Sparkles className="w-4 h-4 text-yellow-200 fill-current" />
              <span>Ruta pedagógica · Ուսումնական ուղեցույց</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              1. Mira el video → 2. Lee los subtítulos → 3. Aprende el vocabulario → 4. Responde a los ejercicios
            </h3>
            <p className="text-sm sm:text-base text-yellow-100 font-semibold">
              1. Դիտիր տեսանյութը → 2. Կարդա ենթագրերը → 3. Սովորիր բառապաշարը → 4. Կատարիր վարժությունները
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer border-2 bg-black/25 hover:bg-black/35 text-white border-white/40 flex items-center gap-2 shadow-xs active:scale-95"
              title="Reiniciar todo · Զրոյացնել ամբողջը"
            >
              <RotateCcw className="w-4 h-4 text-yellow-300" />
              <span>Reiniciar · Զրոյացնել</span>
            </button>
            <button
              onClick={() => setActiveTab('todo')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer border-2 ${
                activeTab === 'todo'
                  ? 'bg-white text-[#670a20] border-white shadow-md'
                  : 'bg-black/20 hover:bg-black/30 text-white border-white/40'
              }`}
            >
              Vista continua · Ամբողջը
            </button>
          </div>
        </div>

        {/* 1. SECCIÓN DE VIDEO */}
        {(activeTab === 'todo' || activeTab === 'video') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 border border-orange-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#670a20]">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#670a20]" />
                  </div>
                  <span>Lección en video · Տեսադաս</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
                  🇪🇸 Entrevista con Natalia Oreiro  
                  <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                    🇦🇲 Հարցազրույց Նատալիա Օրեյրոյի հետ
                  </span>
                </h2>
                <div className="text-stone-700 text-base sm:text-lg space-y-1">
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-red-600">🇪🇸</span>
                    <span className="font-semibold text-stone-900">Mira el video con atención y después responde a las preguntas.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">🇦🇲</span>
                    <span className="font-semibold text-stone-800">Ուշադիր դիտիր տեսանյութը, ապա պատասխանիր հարցերին։</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <button
                  onClick={() => handleSeek(0)}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black hover:brightness-110 shadow-lg cursor-pointer border-2 border-yellow-300/50"
                >
                  <Play className="w-5 h-5 fill-current text-yellow-300" />
                  <div className="text-left leading-snug">
                    <div className="text-base text-yellow-100">▶ Ver entrevista</div>
                    <div className="text-xs sm:text-sm text-yellow-200">▶ Դիտել հարցազրույցը</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Video Frame */}
            <div className="p-1.5 rounded-3xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] shadow-xl">
              <div className="rounded-[22px] overflow-hidden bg-black aspect-video relative">
                <iframe
                  ref={iframeRef}
                  src="https://www.youtube.com/embed/p2j13KraOuE"
                  title="Natalia Oreiro Sedal"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t-2 border-orange-100">
              <span className="text-xs sm:text-sm font-black uppercase text-[#670a20] block mb-3">
                Momentos clave · Հարցազրույցի առանցքային պահերը
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { t: '0:06', s: 6, es: 'Inauguración', hy: 'Բացում' },
                  { t: '0:24', s: 24, es: 'Planes profesionales', hy: 'Ծրագրեր' },
                  { t: '0:42', s: 42, es: 'Trenzas y peinados', hy: 'Հյուսքեր' },
                  { t: '1:05', s: 65, es: 'Pelo largo vs. corto', hy: 'Երկար թե կարճ' },
                  { t: '1:34', s: 94, es: 'Amigos con Sergio', hy: 'Ընկերներ' }
                ].map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleSeek(m.s)}
                    className="p-3 rounded-2xl border-2 border-orange-200 hover:border-red-500 bg-orange-50/60 hover:bg-orange-100 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-mono font-black text-red-600 mb-0.5">[{m.t}]</div>
                    <div className="text-xs sm:text-sm font-black text-stone-900">{m.es}</div>
                    <div className="text-xs font-semibold text-stone-600">{m.hy}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 2. SUBTÍTULOS — ԵՆԹԱԳՐԵՐ */}
        {(activeTab === 'todo' || activeTab === 'subtitulos') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-orange-100">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
                  🇪🇸 Subtítulos de la entrevista  
                  <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                    🇦🇲 Հարցազրույցի ենթագրերը
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowArmenian(!showArmenian)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-orange-50 text-[#670a20] border-2 border-orange-200 transition cursor-pointer"
              >
                {showArmenian ? <EyeOff className="w-4 h-4 text-red-600" /> : <Eye className="w-4 h-4 text-red-600" />}
                <span>{showArmenian ? 'Ocultar armenio · Թաքցնել հայերենը' : 'Mostrar armenio · Ցուցադրել հայերենը'}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 text-red-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por palabra en español o armenio... / Որոնել բառ իսպաներեն կամ հայերեն..."
                className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base rounded-2xl border-2 border-orange-200 focus:outline-none focus:border-red-600 bg-[#fffdfa]"
              />
            </div>

            <div className="space-y-4">
              {filteredSubs.map(s => (
                <div key={s.id} className="p-6 rounded-2xl bg-[#fffdfa] border-2 border-orange-100 hover:border-red-400 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => handleSeek(s.sec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white text-xs sm:text-sm font-mono font-black cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>[{s.time}]</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakSpanish(s.es)}
                        className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-red-700 cursor-pointer"
                        title="Լսել"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${s.es}\n${s.hy}`);
                          setCopiedId(s.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-red-700 cursor-pointer"
                        title="Պատճենել"
                      >
                        {copiedId === s.id ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-black uppercase text-[#670a20] mb-1">🇪🇸 Español</div>
                    <p className="text-lg sm:text-xl font-bold text-stone-900 leading-relaxed">{s.es}</p>
                  </div>

                  {showArmenian && (
                    <div className="pt-3 border-t border-orange-100">
                      <div className="text-xs font-bold uppercase text-orange-700 mb-1">🇦🇲 Հայերեն</div>
                      <p className="text-base sm:text-lg text-stone-800 font-medium leading-relaxed">{s.hy}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. PALABRAS IMPORTANTES */}
        {(activeTab === 'todo' || activeTab === 'vocabulario') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-orange-100">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
                  🇪🇸 Palabras importantes  
                  <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                    🇦🇲 Կարևոր բառեր և արտահայտություններ
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setIsFlashcard(!isFlashcard)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white shadow-md cursor-pointer border border-yellow-300"
              >
                <Layers className="w-5 h-5" />
                <span>{isFlashcard ? 'Modo lista · Ցուցակ' : 'Modo tarjetas · Քարտեր'}</span>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'todas', es: 'Todas las palabras', hy: 'Բոլորը' },
                { id: 'peluquería', es: 'Peluquería', hy: 'Վարսահարդարում' },
                { id: 'estilo', es: 'Estilo', hy: 'Ոճ' },
                { id: 'carrera', es: 'Carrera', hy: 'Կարիերա' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setVocabCat(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer border-2 ${
                    vocabCat === cat.id
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-transparent shadow-xs'
                      : 'bg-orange-50 text-stone-700 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {cat.es} · {cat.hy}
                </button>
              ))}
            </div>

            {!isFlashcard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredVocab.map(v => (
                  <div key={v.id} className="p-6 rounded-2xl bg-[#fffdfa] border-2 border-orange-100 hover:border-red-400 hover:shadow-lg transition">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-[#670a20]">{v.word}</div>
                        <div className="text-base sm:text-lg font-bold text-orange-600">{v.hy}</div>
                      </div>
                      <button
                        onClick={() => speakSpanish(v.word)}
                        className="p-2.5 rounded-xl bg-orange-100 text-red-700 hover:bg-orange-200 cursor-pointer"
                        title="Լսել"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-100 text-sm sm:text-base space-y-1">
                      <p className="font-semibold text-stone-900"><strong className="text-red-600 mr-1.5">🇪🇸</strong>{v.esEx}</p>
                      <p className="font-medium text-stone-700"><strong className="text-[#670a20] mr-1.5">🇦🇲</strong>{v.hyEx}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {filteredVocab.map(v => {
                  const flipped = !!flippedCards[v.id];
                  return (
                    <div
                      key={v.id}
                      onClick={() => setFlippedCards(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                      className={`h-60 rounded-3xl p-6 border-2 cursor-pointer flex flex-col justify-between transition-all shadow-md ${
                        flipped
                          ? 'bg-gradient-to-br from-[#58091a] via-red-600 to-orange-500 text-white border-yellow-300'
                          : 'bg-white border-orange-200 hover:border-red-400'
                      }`}
                    >
                      <div className="text-xs font-black uppercase text-yellow-300">
                        {flipped ? '🇦🇲 Հայերեն' : '🇪🇸 Español (Սեղմիր շրջելու համար)'}
                      </div>
                      <div className="text-center my-auto">
                        <div className={`text-2xl font-black ${flipped ? 'text-yellow-300' : 'text-[#670a20]'}`}>
                          {flipped ? v.hy : v.word}
                        </div>
                        {flipped && <div className="text-xs text-yellow-100 italic mt-2">«{v.esEx}»</div>}
                      </div>
                      <div className="text-xs text-center opacity-75">
                        {flipped ? 'Շրջել դեպի իսպաներեն' : 'Բառապաշար'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. COMPRENSIÓN AUDITIVA */}
        {(activeTab === 'todo' || activeTab === 'comprension') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-orange-100">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
                  🇪🇸 Preguntas de comprensión  
                  <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                    🇦🇲 Հարցեր տեսանյութի բովանդակության շուրջ
                  </span>
                </h2>
              </div>
              {!qFinished && (
                <div className="text-right">
                  <span className="text-xs sm:text-sm font-bold text-stone-700">
                    Pregunta {qIdx + 1} de {QUIZ_QUESTIONS.length} · Հարց {qIdx + 1} / {QUIZ_QUESTIONS.length}-ից
                  </span>
                  <div className="w-36 h-3 bg-orange-100 rounded-full overflow-hidden mt-1.5 ml-auto border border-orange-300">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-full"
                      style={{ width: `${((qIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {!qFinished ? (
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#fffdfa] to-orange-50/40 border-2 border-orange-200 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-red-600 uppercase block mb-1">Pregunta {qIdx + 1}</span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#670a20]">{currentQ.q}</h3>
                  </div>
                  <button onClick={() => speakSpanish(currentQ.q)} className="p-3 rounded-2xl bg-orange-100 text-red-700 cursor-pointer">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {currentQ.opts.map(opt => {
                    const isSelected = qSelected === opt.l;
                    const isCorrect = opt.l === currentQ.ans;
                    let style = 'bg-white border-2 border-orange-200 hover:border-red-400 hover:bg-orange-50/40';
                    if (qAnswered) {
                      if (isCorrect) style = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                      else if (isSelected) style = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold';
                      else style = 'bg-stone-50 border border-stone-200 text-stone-400 opacity-55';
                    }
                    return (
                      <button
                        key={opt.l}
                        disabled={qAnswered}
                        onClick={() => {
                          if (qAnswered) return;
                          setQSelected(opt.l);
                          setQAnswered(true);
                          if (opt.l === currentQ.ans) {
                            sounds.playCorrect();
                            setQScore(s => s + 1);
                          } else {
                            sounds.playIncorrect();
                          }
                        }}
                        className={`w-full text-left p-4.5 sm:p-5 rounded-2xl transition flex items-center justify-between gap-4 cursor-pointer disabled:cursor-default ${style}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black uppercase bg-orange-100 text-[#670a20] border border-orange-200">
                            {opt.l}
                          </span>
                          <span className="text-base sm:text-lg font-semibold">{opt.t}</span>
                        </div>
                        {qAnswered && (
                          isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : isSelected ? <XCircle className="w-6 h-6 text-rose-500" /> : null
                        )}
                      </button>
                    );
                  })}
                </div>

                {qAnswered && (
                  <div className={`p-6 rounded-3xl border-2 shadow-sm ${qSelected === currentQ.ans ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-rose-50 border-rose-400 text-rose-950'}`}>
                    <div className="font-black text-lg mb-2">
                      {qSelected === currentQ.ans ? '✅ Correcto / Ճիշտ է' : '❌ Incorrecto / Սխալ է'}
                    </div>
                    <div className="text-sm sm:text-base space-y-1 pt-2 border-t border-stone-200/60">
                      <p><strong className="text-[#670a20]">🇪🇸:</strong> {currentQ.expEs}</p>
                      <p><strong className="text-red-700">🇦🇲:</strong> {currentQ.expHy}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (qIdx < QUIZ_QUESTIONS.length - 1) {
                            setQIdx(i => i + 1);
                            setQSelected(null);
                            setQAnswered(false);
                          } else {
                            setQFinished(true);
                            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md border border-yellow-300"
                      >
                        <span>{qIdx < QUIZ_QUESTIONS.length - 1 ? 'Siguiente pregunta' : 'Ver resultado'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <Award className="w-16 h-16 text-[#670a20] mx-auto" />
                <h3 className="text-3xl font-extrabold text-[#670a20]">Resultado: {qScore} / {QUIZ_QUESTIONS.length}</h3>
                <button
                  onClick={() => { setQIdx(0); setQSelected(null); setQAnswered(false); setQScore(0); setQFinished(false); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Intentar de nuevo / 🔄 Կրկին փորձել</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* 5. VERDADERO O FALSO */}
        {(activeTab === 'todo' || activeTab === 'verdadero-falso') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
              🇪🇸 Verdadero o falso  
              <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                🇦🇲 Ճի՞շտ, թե՞ սխալ
              </span>
            </h2>

            {!tfFinished ? (
              <div className="space-y-6">
                <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#fffdfa] to-orange-50/40 border-2 border-orange-200 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-red-600 uppercase block mb-1">Afirmación {tfIdx + 1} / {TRUE_FALSE_ITEMS.length}</span>
                    <p className="text-2xl sm:text-3xl font-black text-[#670a20] font-serif">«{currentTf.st}»</p>
                  </div>
                  <button onClick={() => speakSpanish(currentTf.st)} className="p-3 rounded-2xl bg-orange-100 text-red-700 cursor-pointer">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[true, false].map((choice) => (
                    <button
                      key={String(choice)}
                      disabled={tfAnswered}
                      onClick={() => {
                        if (tfAnswered) return;
                        setTfChoice(choice);
                        setTfAnswered(true);
                        if (choice === currentTf.isTrue) {
                          sounds.playCorrect();
                          setTfScore(s => s + 1);
                        } else {
                          sounds.playIncorrect();
                        }
                      }}
                      className={`p-5 sm:p-6 rounded-2xl border-2 text-center transition font-black cursor-pointer disabled:cursor-default ${
                        tfAnswered
                          ? choice === currentTf.isTrue
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30'
                            : tfChoice === choice
                            ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/30'
                            : 'bg-stone-50 border-stone-200 text-stone-400 opacity-55'
                          : choice
                          ? 'bg-white hover:bg-emerald-50 border-orange-200 text-emerald-700 hover:border-emerald-400'
                          : 'bg-white hover:bg-rose-50 border-orange-200 text-rose-700 hover:border-rose-400'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl">{choice ? 'Verdadero' : 'Falso'}</div>
                      <div className="text-sm font-semibold opacity-75">{choice ? 'Ճիշտ է' : 'Սխալ է'}</div>
                    </button>
                  ))}
                </div>

                {tfAnswered && (
                  <div className={`p-6 rounded-3xl border-2 shadow-sm ${tfChoice === currentTf.isTrue ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-rose-50 border-rose-400 text-rose-950'}`}>
                    <div className="font-black text-lg mb-2">{tfChoice === currentTf.isTrue ? '✅ Correcto / Ճիշտ է' : '❌ Incorrecto / Սխալ է'}</div>
                    <div className="text-sm sm:text-base space-y-1 pt-2 border-t border-stone-200/60">
                      <p><strong className="text-[#670a20]">🇪🇸:</strong> {currentTf.expEs}</p>
                      <p><strong className="text-red-700">🇦🇲:</strong> {currentTf.expHy}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (tfIdx < TRUE_FALSE_ITEMS.length - 1) {
                            setTfIdx(i => i + 1);
                            setTfChoice(null);
                            setTfAnswered(false);
                          } else {
                            setTfFinished(true);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                      >
                        <span>Siguiente afirmación</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <Award className="w-16 h-16 text-[#670a20] mx-auto" />
                <h3 className="text-3xl font-extrabold text-[#670a20]">Resultado: {tfScore} / {TRUE_FALSE_ITEMS.length}</h3>
                <button
                  onClick={() => { setTfIdx(0); setTfChoice(null); setTfAnswered(false); setTfScore(0); setTfFinished(false); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Intentar de nuevo / 🔄 Կրկին փորձել</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* 6. ¿QUÉ SIGNIFICA ESTA FRASE? */}
        {(activeTab === 'todo' || activeTab === 'frases') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
              🇪🇸 ¿Qué significa esta frase?  
              <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                🇦🇲 Ի՞նչ է նշանակում այս արտահայտությունը
              </span>
            </h2>

            {!pmFinished ? (
              <div className="space-y-6">
                <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#fffdfa] to-orange-50/40 border-2 border-orange-200 relative">
                  <Quote className="w-10 h-10 text-red-300/40 absolute top-5 right-5" />
                  <span className="text-xs sm:text-sm font-black text-red-600 uppercase block mb-1">Frase {pmIdx + 1} / {PHRASE_ITEMS.length}</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#670a20] font-serif mb-2">«{currentPm.quote}»</p>
                  <p className="text-base sm:text-lg font-bold text-stone-800">{currentPm.q}</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {currentPm.opts.map(opt => {
                    const isSelected = pmSelected === opt.l;
                    const isCorrect = opt.l === currentPm.ans;
                    let style = 'bg-white border-2 border-orange-200 hover:border-red-400 hover:bg-orange-50/40';
                    if (pmAnswered) {
                      if (isCorrect) style = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                      else if (isSelected) style = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold';
                      else style = 'bg-stone-50 border border-stone-200 text-stone-400 opacity-55';
                    }
                    return (
                      <button
                        key={opt.l}
                        disabled={pmAnswered}
                        onClick={() => {
                          if (pmAnswered) return;
                          setPmSelected(opt.l);
                          setPmAnswered(true);
                          if (opt.l === currentPm.ans) {
                            sounds.playCorrect();
                            setPmScore(s => s + 1);
                          } else {
                            sounds.playIncorrect();
                          }
                        }}
                        className={`w-full text-left p-4.5 sm:p-5 rounded-2xl transition flex items-center justify-between gap-4 cursor-pointer disabled:cursor-default ${style}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black uppercase bg-orange-100 text-[#670a20] border border-orange-200">
                            {opt.l}
                          </span>
                          <span className="text-base sm:text-lg font-semibold">{opt.t}</span>
                        </div>
                        {pmAnswered && (
                          isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : isSelected ? <XCircle className="w-6 h-6 text-rose-500" /> : null
                        )}
                      </button>
                    );
                  })}
                </div>

                {pmAnswered && (
                  <div className={`p-6 rounded-3xl border-2 shadow-sm ${pmSelected === currentPm.ans ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-rose-50 border-rose-400 text-rose-950'}`}>
                    <div className="font-black text-lg mb-2">{pmSelected === currentPm.ans ? '✅ Correcto / Ճիշտ է' : '❌ Incorrecto / Սխալ է'}</div>
                    <div className="text-sm sm:text-base space-y-1 pt-2 border-t border-stone-200/60">
                      <p><strong className="text-[#670a20]">🇪🇸:</strong> {currentPm.expEs}</p>
                      <p><strong className="text-red-700">🇦🇲:</strong> {currentPm.expHy}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (pmIdx < PHRASE_ITEMS.length - 1) {
                            setPmIdx(i => i + 1);
                            setPmSelected(null);
                            setPmAnswered(false);
                          } else {
                            setPmFinished(true);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                      >
                        <span>Siguiente frase</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <Award className="w-16 h-16 text-[#670a20] mx-auto" />
                <h3 className="text-3xl font-extrabold text-[#670a20]">Resultado: {pmScore} / {PHRASE_ITEMS.length}</h3>
                <button
                  onClick={() => { setPmIdx(0); setPmSelected(null); setPmAnswered(false); setPmScore(0); setPmFinished(false); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Intentar de nuevo / 🔄 Կրկին փորձել</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* 7. COMPLETA LA FRASE */}
        {(activeTab === 'todo' || activeTab === 'completa') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
              🇪🇸 Completa la frase  
              <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                🇦🇲 Լրացրու նախադասությունը
              </span>
            </h2>

            {!fbFinished ? (
              <div className="space-y-6">
                <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#fffdfa] to-orange-50/40 border-2 border-orange-200">
                  <span className="text-xs sm:text-sm font-black text-red-600 uppercase block mb-1">Frase {fbIdx + 1} / {FILL_BLANK_ITEMS.length}</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#670a20] font-sans leading-relaxed">{currentFb.blank}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {currentFb.opts.map(opt => {
                    const isSelected = fbSelected === opt.l;
                    const isCorrect = opt.l === currentFb.ans;
                    let style = 'bg-white border-2 border-orange-200 hover:border-red-400 hover:bg-orange-50/40';
                    if (fbAnswered) {
                      if (isCorrect) style = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                      else if (isSelected) style = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold';
                      else style = 'bg-stone-50 border border-stone-200 text-stone-400 opacity-55';
                    }
                    return (
                      <button
                        key={opt.l}
                        disabled={fbAnswered}
                        onClick={() => {
                          if (fbAnswered) return;
                          setFbSelected(opt.l);
                          setFbAnswered(true);
                          if (opt.l === currentFb.ans) {
                            sounds.playCorrect();
                            setFbScore(s => s + 1);
                          } else {
                            sounds.playIncorrect();
                          }
                        }}
                        className={`p-4.5 sm:p-5 rounded-2xl transition flex items-center justify-between gap-3.5 cursor-pointer disabled:cursor-default ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black uppercase bg-orange-100 text-[#670a20] border border-orange-200">
                            {opt.l}
                          </span>
                          <span className="text-lg sm:text-xl font-bold">{opt.t}</span>
                        </div>
                        {fbAnswered && (
                          isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isSelected ? <XCircle className="w-5 h-5 text-rose-500" /> : null
                        )}
                      </button>
                    );
                  })}
                </div>

                {fbAnswered && (
                  <div className={`p-6 rounded-3xl border-2 shadow-sm ${fbSelected === currentFb.ans ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-rose-50 border-rose-400 text-rose-950'}`}>
                    <div className="font-black text-lg mb-2">{fbSelected === currentFb.ans ? '✅ Correcto / Ճիշտ է' : '❌ Incorrecto / Սխալ է'}</div>
                    <div className="text-base sm:text-lg space-y-1 pt-2 border-t border-stone-200/60">
                      <p><strong className="text-[#670a20]">🇪🇸:</strong> «{currentFb.full}»</p>
                      <p><strong className="text-red-700">🇦🇲:</strong> {currentFb.hy}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (fbIdx < FILL_BLANK_ITEMS.length - 1) {
                            setFbIdx(i => i + 1);
                            setFbSelected(null);
                            setFbAnswered(false);
                          } else {
                            setFbFinished(true);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                      >
                        <span>Siguiente frase</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <Award className="w-16 h-16 text-[#670a20] mx-auto" />
                <h3 className="text-3xl font-extrabold text-[#670a20]">Resultado: {fbScore} / {FILL_BLANK_ITEMS.length}</h3>
                <button
                  onClick={() => { setFbIdx(0); setFbSelected(null); setFbAnswered(false); setFbScore(0); setFbFinished(false); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Intentar de nuevo / 🔄 Կրկին փորձել</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* 8. HABLA TÚ */}
        {(activeTab === 'todo' || activeTab === 'habla') && (
          <section className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-orange-200 shadow-md space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#670a20]">
              🇪🇸 Habla tú  
              <span className="block text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                🇦🇲 Խոսիր դու
              </span>
            </h2>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {SPEAKING_PROMPTS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => { if (isRecording) handleStopRec(); setSpeakIdx(p.id); }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap cursor-pointer border-2 ${
                    speakIdx === p.id
                      ? 'bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white border-yellow-300 shadow-md'
                      : 'bg-orange-50 text-stone-800 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  Tema {idx + 1}
                </button>
              ))}
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#fffdfa] to-orange-50/40 border-2 border-orange-200 space-y-3">
              <span className="text-xs sm:text-sm font-black text-red-600 uppercase block">Pregunta de conversación {speakIdx} / 8</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#670a20]">🇪🇸 {currentSpeak.es}</h3>
              <p className="text-lg sm:text-xl font-bold text-red-600">🇦🇲 {currentSpeak.hy}</p>

              <div className="pt-4 border-t-2 border-orange-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                <div className="p-4 rounded-2xl bg-white border border-orange-200">
                  <span className="font-black text-[#670a20] block mb-1">💡 Inicio sugerido · Սկիզբ:</span>
                  <p className="font-bold text-stone-900 font-serif">«{currentSpeak.startEs}»</p>
                  <p className="text-stone-600 text-xs sm:text-sm mt-0.5">«{currentSpeak.startHy}»</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-orange-200">
                  <span className="font-black text-[#670a20] block mb-1">🔑 Palabras clave · Բառեր:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {currentSpeak.kw.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#670a20] text-xs font-mono font-bold">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Recorder */}
              <div className="p-6 rounded-3xl border-2 border-orange-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[#670a20] flex items-center gap-2">
                    <Mic className="w-5 h-5 text-red-600" />
                    Grabadora de voz · Ձայնագրիչ
                  </span>
                  {isRecording && <span className="text-xs text-rose-600 font-black animate-pulse">Grabando... / Ձայնագրվում է...</span>}
                </div>
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRec}
                      className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 via-red-600 to-[#670a20] text-white font-black hover:brightness-110 shadow-md cursor-pointer border border-yellow-300"
                    >
                      <Mic className="w-5 h-5 text-yellow-200" />
                      <span>Grabar respuesta · Ձայնագրել</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRec}
                      className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-rose-600 text-white font-black hover:bg-rose-700 shadow-md cursor-pointer animate-pulse"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      <span>Detener · Դադարեցնել</span>
                    </button>
                  )}
                  {spokenAudios[speakIdx] && (
                    <div className="w-full mt-2">
                      <audio src={spokenAudios[speakIdx]} controls className="w-full h-11" />
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="p-6 rounded-3xl border-2 border-orange-200 bg-white space-y-3">
                <span className="text-sm font-black uppercase text-[#670a20] block">Escribe tu respuesta · Գրիր քո պատասխանը</span>
                <textarea
                  value={spokenNotes[speakIdx] || ''}
                  onChange={e => setSpokenNotes(prev => ({ ...prev, [speakIdx]: e.target.value }))}
                  rows={4}
                  placeholder="Ejemplo: A mí me gusta mucho llevar el pelo largo porque..."
                  className="w-full p-3.5 text-base rounded-2xl border-2 border-orange-200 focus:outline-none focus:border-red-600 bg-[#fffdfa]"
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t-2 border-orange-200 bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-stone-600">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-extrabold text-[#670a20] text-base">
              🇪🇸 Plataforma interactiva de español para hispanohablantes a través del armenio
            </p>
            <p className="text-stone-600 font-medium">
              🇦🇲 Իսպաներենի ինտերակտիվ ուսումնական հարթակ հայերենով՝ Նատալիա Օրեյրոյի հարցազրույցի հիման վրա
            </p>
          </div>
          <div className="text-center md:text-right text-xs sm:text-sm text-red-700 font-bold bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 px-4 py-2 rounded-2xl border border-orange-300">
            <span>Mar del Plata · Peluquería Sedal · Nivel A2–B1</span>
          </div>
        </div>
      </footer>
      {/* Modal de confirmación de reinicio / Զրոյացման հաստատման պատուհան */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-orange-300 shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 text-red-600 flex items-center justify-center mx-auto shadow-xs border border-red-200">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-[#670a20]">
                🇪🇸 ¿Reiniciar todo el progreso?
              </h3>
              <p className="text-lg font-bold text-red-600">
                🇦🇲 Զրոյացնե՞լ ամբողջ առաջընթացը։
              </p>
              <div className="text-sm text-stone-600 pt-1 space-y-1">
                <p>
                  <strong>🇪🇸</strong> Se restablecerán todas las preguntas, afirmaciones, notas escritas y grabaciones de voz.
                </p>
                <p className="text-stone-500 font-medium">
                  <strong>🇦🇲</strong> Բոլոր հարցերի պատասխանները, նշումները և ձայնագրությունները կզրոյացվեն։
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-3 rounded-2xl border-2 border-stone-200 text-stone-700 font-bold hover:bg-stone-50 transition cursor-pointer text-sm"
              >
                Cancelar · Չեղարկել
              </button>
              <button
                onClick={handleResetAll}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-[#670a20] text-white font-black hover:brightness-110 transition cursor-pointer text-sm shadow-md border border-red-700 active:scale-95"
              >
                Sí, reiniciar · Զրոյացնել
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

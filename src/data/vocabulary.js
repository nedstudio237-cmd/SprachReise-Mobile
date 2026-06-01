// Vocabulary bank for word-match game
export const WORD_MATCH = {
  A1: [
    { de:'der Vater',    fr:'le père',        wrong:['la mère','le frère','l\'enfant'] },
    { de:'die Mutter',   fr:'la mère',         wrong:['le père','la sœur','la famille'] },
    { de:'der Bruder',   fr:'le frère',        wrong:['la sœur','le fils','le père'] },
    { de:'die Schule',   fr:'l\'école',        wrong:['la maison','le bureau','la rue'] },
    { de:'das Buch',     fr:'le livre',        wrong:['le cahier','le stylo','le sac'] },
    { de:'das Haus',     fr:'la maison',       wrong:['l\'appartement','la rue','le jardin'] },
    { de:'der Hund',     fr:'le chien',        wrong:['le chat','l\'oiseau','le cheval'] },
    { de:'die Katze',    fr:'le chat',         wrong:['le chien','le lapin','l\'oiseau'] },
    { de:'groß',         fr:'grand',           wrong:['petit','vieux','beau'] },
    { de:'klein',        fr:'petit',           wrong:['grand','gros','vieux'] },
    { de:'gut',          fr:'bon / bien',      wrong:['mauvais','beau','nouveau'] },
    { de:'schön',        fr:'beau / belle',    wrong:['laid','grand','vieux'] },
    { de:'essen',        fr:'manger',          wrong:['boire','dormir','travailler'] },
    { de:'trinken',      fr:'boire',           wrong:['manger','dormir','courir'] },
    { de:'schlafen',     fr:'dormir',          wrong:['manger','travailler','marcher'] },
    { de:'gehen',        fr:'aller / marcher', wrong:['courir','venir','rester'] },
    { de:'eins',         fr:'un (1)',           wrong:['deux','trois','zéro'] },
    { de:'zwei',         fr:'deux (2)',         wrong:['un','trois','quatre'] },
    { de:'drei',         fr:'trois (3)',        wrong:['deux','quatre','cinq'] },
    { de:'heute',        fr:'aujourd\'hui',    wrong:['demain','hier','maintenant'] },
  ],
  A2: [
    { de:'der Laden',    fr:'la boutique',     wrong:['le marché','le bureau','la banque'] },
    { de:'der Zug',      fr:'le train',        wrong:['l\'avion','le bus','le bateau'] },
    { de:'die Fahrkarte',fr:'le billet',       wrong:['le passeport','la carte','le ticket'] },
    { de:'die Küche',    fr:'la cuisine',      wrong:['la chambre','le salon','la salle de bain'] },
    { de:'der Arzt',     fr:'le médecin',      wrong:['l\'infirmier','le pharmacien','le dentiste'] },
    { de:'krank',        fr:'malade',          wrong:['fatigué','triste','blessé'] },
    { de:'billig',       fr:'bon marché',      wrong:['cher','gratuit','rare'] },
    { de:'teuer',        fr:'cher',            wrong:['bon marché','gratuit','rare'] },
    { de:'kaufen',       fr:'acheter',         wrong:['vendre','louer','donner'] },
    { de:'kosten',       fr:'coûter',          wrong:['payer','gagner','économiser'] },
  ],
  B1: [
    { de:'die Bewerbung',fr:'la candidature',  wrong:['l\'entretien','le CV','le contrat'] },
    { de:'das Gehalt',   fr:'le salaire',      wrong:['le bonus','la prime','le revenu'] },
    { de:'die Umwelt',   fr:'l\'environnement',wrong:['la nature','la ville','la campagne'] },
    { de:'der Klimawandel',fr:'le changement climatique',wrong:['la pollution','la sécheresse','l\'inondation'] },
    { de:'die Meinung',  fr:'l\'opinion',      wrong:['l\'idée','la pensée','le choix'] },
    { de:'obwohl',       fr:'bien que',        wrong:['parce que','donc','mais'] },
    { de:'deshalb',      fr:'c\'est pourquoi', wrong:['pourtant','néanmoins','cependant'] },
    { de:'trotzdem',     fr:'quand même / néanmoins', wrong:['donc','ainsi','pourtant'] },
  ],
  B2: [
    { de:'das Unternehmen',fr:'l\'entreprise', wrong:['la société','l\'organisation','l\'association'] },
    { de:'investieren',  fr:'investir',        wrong:['économiser','dépenser','prêter'] },
    { de:'die Integration',fr:'l\'intégration',wrong:['l\'isolation','l\'exclusion','la séparation'] },
    { de:'verhandeln',   fr:'négocier',        wrong:['discuter','décider','refuser'] },
    { de:'einerseits',   fr:'d\'un côté',      wrong:['de l\'autre côté','en revanche','pourtant'] },
  ],
};

// Fill-in-the-blank sentences
export const FILL_BLANK = {
  A1: [
    { sentence:'Ich ___ Marie.',           options:['heiße','bin','komme','spreche'],   correct:0, explanation:'"heiße" = "je m\'appelle". Ich heiße = je m\'appelle.' },
    { sentence:'Wie ___ du?',              options:['geht\'s','heißt','bist','kommst'], correct:0, explanation:'"Wie geht\'s dir?" = "Comment tu vas ?"' },
    { sentence:'Das ist ___ Buch.',        options:['ein','eine','der','die'],          correct:0, explanation:'"Buch" (livre) est neutre → article indéfini "ein".' },
    { sentence:'___ kommen Sie?',          options:['Woher','Wo','Wer','Was'],          correct:0, explanation:'"Woher" = "D\'où". Woher kommen Sie? = D\'où venez-vous ?' },
    { sentence:'Ich ___ zwanzig Jahre alt.',options:['bin','habe','bin','komme'],       correct:0, explanation:'"Ich bin X Jahre alt" = "J\'ai X ans". En allemand, on utilise "sein" (être) pour l\'âge.' },
    { sentence:'Der Hund ___ groß.',       options:['ist','hat','sind','bin'],          correct:0, explanation:'"ist" = est (3e personne singulier de "sein").' },
    { sentence:'Wir ___ Deutsch.',         options:['lernen','lerne','lernst','lernt'], correct:0, explanation:'"lernen" → wir lernen (nous apprenons). Terminaison -en pour "wir".' },
    { sentence:'Das Buch ___ auf dem Tisch.', options:['liegt','steht','hängt','sitzt'],correct:0, explanation:'"liegt" = est posé (à plat). Livres, papiers → liegen.' },
  ],
  A2: [
    { sentence:'Er ___ gestern ins Kino gegangen.', options:['ist','hat','war','hatte'], correct:0, explanation:'"gehen" (aller) → Perfekt avec "sein" : ist gegangen.' },
    { sentence:'Ich habe das Buch ___.',   options:['gelesen','lesen','las','liest'],   correct:0, explanation:'"gelesen" = participe passé de "lesen" (lire). ge- + radical + -en.' },
    { sentence:'Das Essen ___ sehr lecker.',options:['schmeckt','riecht','sieht','klingt'],correct:0, explanation:'"schmeckt" = a bon goût. "Das Essen schmeckt gut" = la nourriture est bonne.' },
    { sentence:'___ ich Ihnen helfen?',    options:['Kann','Will','Muss','Soll'],       correct:0, explanation:'"Kann ich...?" = "Puis-je...?" — formule polie avec können.' },
    { sentence:'Wir fahren ___ Berlin.',   options:['nach','in','zu','an'],             correct:0, explanation:'"nach" + nom de ville pour les déplacements. "Wir fahren nach Berlin".' },
    { sentence:'Ich ___ morgen früh aufstehen.', options:['muss','kann','will','darf'],correct:0, explanation:'"muss" = doit (obligation). Ich muss... = Je dois...' },
  ],
  B1: [
    { sentence:'___ er krank ist, geht er arbeiten.', options:['Obwohl','Weil','Wenn','Dass'], correct:0, explanation:'"Obwohl" = bien que/quoique → exprime la concession. Le verbe va en fin de proposition.' },
    { sentence:'Er sagt, ___ er morgen kommt.', options:['dass','weil','obwohl','wenn'], correct:0, explanation:'"dass" introduit une proposition complétive. Le verbe va en fin de proposition.' },
    { sentence:'Ich würde gern ___ Deutschland reisen.', options:['nach','in','zu','durch'], correct:0, explanation:'"nach Deutschland" = en Allemagne (après nach + pays sans article).' },
    { sentence:'Das Buch ___ von Goethe geschrieben.', options:['wurde','war','hat','ist'], correct:0, explanation:'Passif d\'action au prétérit : wurde + Partizip II. "wurde geschrieben" = a été écrit.' },
  ],
};

// ── Audio exercises ─────────────────────────────────────────────────────────

// Listen & Choose: hear audio → pick correct translation
export const LISTEN_CHOOSE = {
  A1: [
    { de:'Guten Morgen!',      fr:'Bonjour ! (matin)',    wrong:['Bonsoir !','Au revoir !','Merci !'] },
    { de:'Wie heißen Sie?',    fr:'Comment vous appelez-vous ?', wrong:['Comment allez-vous ?','D\'où venez-vous ?','Quel âge avez-vous ?'] },
    { de:'Ich komme aus Kamerun.', fr:'Je viens du Cameroun.',  wrong:['J\'habite au Cameroun.','Je suis camerounais.','Je visite le Cameroun.'] },
    { de:'Das Buch ist groß.', fr:'Le livre est grand.',  wrong:['Le livre est petit.','Le livre est beau.','Le livre est vieux.'] },
    { de:'Ich habe Hunger.',   fr:'J\'ai faim.',          wrong:['J\'ai soif.','Je suis fatigué.','J\'ai froid.'] },
    { de:'Wo ist der Bahnhof?',fr:'Où est la gare ?',     wrong:['Où est l\'hôtel ?','Quand part le train ?','Combien coûte le billet ?'] },
    { de:'Es ist halb neun.', fr:'Il est neuf heures et demie.',wrong:['Il est neuf heures.','Il est huit heures et demie.','Il est dix heures.'] },
    { de:'Ich lerne Deutsch.', fr:'J\'apprends l\'allemand.', wrong:['Je parle allemand.','J\'aime l\'allemand.','Je comprends l\'allemand.'] },
  ],
  A2: [
    { de:'Können Sie mir helfen?',  fr:'Pouvez-vous m\'aider ?',   wrong:['Avez-vous besoin d\'aide ?','Je peux vous aider.','Où puis-je vous aider ?'] },
    { de:'Ich hätte gern einen Kaffee.', fr:'Je voudrais un café.', wrong:['J\'aime le café.','Avez-vous du café ?','Le café est prêt.'] },
    { de:'Der Zug fährt um 10 Uhr ab.', fr:'Le train part à 10h.', wrong:['Le train arrive à 10h.','Le train est à 10h.','Le train passe à 10h.'] },
    { de:'Wie viel kostet das?',    fr:'Combien ça coûte ?',        wrong:['C\'est gratuit ?','Avez-vous des remises ?','Quel est le prix total ?'] },
    { de:'Mir geht es gut, danke.', fr:'Je vais bien, merci.',      wrong:['Je suis malade, merci.','Ça va mal, merci.','Je suis fatigué, merci.'] },
  ],
  B1: [
    { de:'Das ist meiner Meinung nach falsch.', fr:'C\'est faux selon moi.', wrong:['C\'est juste selon moi.','Je ne sais pas.','Peut-être que c\'est vrai.'] },
    { de:'Ich würde gern mehr verdienen.', fr:'J\'aimerais gagner plus.', wrong:['Je gagne assez.','Je veux travailler plus.','Je cherche un emploi.'] },
    { de:'Obwohl es regnet, gehe ich spazieren.', fr:'Bien qu\'il pleuve, je me promène.', wrong:['Parce qu\'il pleut, je reste.','Il pleut donc je sors.','Quand il pleut, je marche.'] },
  ],
};

// Dictée: hear audio → type what you heard
export const DICTEE = {
  A1: [
    { de:'Guten Tag!',              hint:'Salutation de la journée' },
    { de:'Ich heiße Marie.',        hint:'Se présenter — le nom' },
    { de:'Das ist ein Buch.',       hint:'Article indéfini + objet' },
    { de:'Wie alt bist du?',        hint:'Question sur l\'âge' },
    { de:'Ich wohne in Berlin.',    hint:'Lieu de résidence' },
    { de:'Danke schön!',            hint:'Remercier poliment' },
    { de:'Auf Wiedersehen!',        hint:'Formule d\'au revoir' },
    { de:'Sprechen Sie Deutsch?',   hint:'Demander si on parle allemand' },
  ],
  A2: [
    { de:'Was kostet das Ticket?',          hint:'Demander le prix' },
    { de:'Ich hätte gern ein Zimmer.',      hint:'Réserver une chambre' },
    { de:'Der Zug kommt um acht Uhr.',      hint:'Heure d\'arrivée' },
    { de:'Können Sie das wiederholen?',     hint:'Demander de répéter' },
    { de:'Ich habe gestern gekocht.',       hint:'Passé composé (Perfekt)' },
  ],
  B1: [
    { de:'Meiner Meinung nach ist das falsch.',    hint:'Exprimer son opinion' },
    { de:'Ich würde gern nach Deutschland reisen.',hint:'Konjunktiv II + voyage' },
    { de:'Das Buch wurde von Goethe geschrieben.', hint:'Voix passive' },
  ],
};

// Pronunciation: see text → record yourself → playback & compare
export const PRONOUNCE = {
  A1: [
    { de:'Guten Morgen!',      phonetic:'Gou-ten Mor-gen',    fr:'Bonjour ! (matin)' },
    { de:'Wie geht es Ihnen?', phonetic:'Vi guet es I-nen',   fr:'Comment allez-vous ?' },
    { de:'Ich heiße...',       phonetic:'Ich haï-ssé',        fr:'Je m\'appelle...' },
    { de:'Auf Wiedersehen!',   phonetic:'Auf Vi-der-ze-en',   fr:'Au revoir !' },
    { de:'Danke schön!',       phonetic:'Dan-ké cheun',       fr:'Merci beaucoup !' },
    { de:'Entschuldigung!',    phonetic:'Ent-choul-di-goung', fr:'Excusez-moi !' },
    { de:'Deutschland',        phonetic:'Doïtch-land',        fr:'L\'Allemagne' },
    { de:'Ich spreche Deutsch.',phonetic:'Ich chpré-ché Doïtch', fr:'Je parle allemand.' },
  ],
  A2: [
    { de:'Können Sie mir helfen?',   phonetic:'Keu-nen Zi mir hel-fen', fr:'Pouvez-vous m\'aider ?' },
    { de:'Wo ist der Bahnhof?',      phonetic:'Vo ist der Ban-hof',     fr:'Où est la gare ?' },
    { de:'Ich hätte gern einen Kaffee.', phonetic:'Ich hé-té guern ai-nen Ka-fé', fr:'Je voudrais un café.' },
    { de:'Das Wetter ist schön.',    phonetic:'Das Vé-ter ist cheun',   fr:'Le temps est beau.' },
  ],
  B1: [
    { de:'Meiner Meinung nach...', phonetic:'Mai-ner Maï-noung nach', fr:'Selon moi...' },
    { de:'Das ist kompliziert.',   phonetic:'Das ist kom-pli-tsiert',  fr:'C\'est compliqué.' },
    { de:'Ich würde gern...',      phonetic:'Ich vür-de guern',        fr:'J\'aimerais...' },
  ],
};

// Word order: hear audio → put words in correct order
export const WORD_ORDER = {
  A1: [
    { de:'Ich heiße Marie.',         words:['Ich','heiße','Marie','.'],           audio:'Ich heiße Marie.' },
    { de:'Das ist ein Buch.',         words:['Das','ist','ein','Buch','.'],         audio:'Das ist ein Buch.' },
    { de:'Wie heißen Sie?',           words:['Wie','heißen','Sie','?'],             audio:'Wie heißen Sie?' },
    { de:'Ich komme aus Kamerun.',    words:['Ich','komme','aus','Kamerun','.'],    audio:'Ich komme aus Kamerun.' },
    { de:'Guten Morgen, wie geht es?',words:['Guten','Morgen',',','wie','geht','es','?'], audio:'Guten Morgen, wie geht es?' },
    { de:'Der Hund ist groß.',        words:['Der','Hund','ist','groß','.'],        audio:'Der Hund ist groß.' },
  ],
  A2: [
    { de:'Können Sie mir helfen?',    words:['Können','Sie','mir','helfen','?'],    audio:'Können Sie mir helfen?' },
    { de:'Ich hätte gern einen Kaffee.', words:['Ich','hätte','gern','einen','Kaffee','.'], audio:'Ich hätte gern einen Kaffee.' },
    { de:'Der Zug fährt um zehn Uhr ab.', words:['Der','Zug','fährt','um','zehn','Uhr','ab','.'], audio:'Der Zug fährt um zehn Uhr ab.' },
  ],
  B1: [
    { de:'Obwohl es regnet, gehe ich spazieren.',
      words:['Obwohl','es','regnet',',','gehe','ich','spazieren','.'],
      audio:'Obwohl es regnet, gehe ich spazieren.' },
    { de:'Das Buch wurde von Goethe geschrieben.',
      words:['Das','Buch','wurde','von','Goethe','geschrieben','.'],
      audio:'Das Buch wurde von Goethe geschrieben.' },
  ],
};

export function getRandomWords(level, count = 6) {
  const pool = WORD_MATCH[level] ?? WORD_MATCH.A1;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomSentences(level, count = 5) {
  const pool = FILL_BLANK[level] ?? FILL_BLANK.A1;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// This taxonomy mirrors game-levels/README.md and the titles of the mapped wiki
// pages. Classification receives these descriptions, never locked wiki text.
export const LEVEL_TAXONOMY = Object.freeze([
  Object.freeze({
    level: 1,
    name: 'Arrival & The First Address',
    description: 'Preparing to arrive, visas, passports, first days, accommodation, rental documents, address registration (Anmeldung), and the Bürgeramt.',
    topics: Object.freeze([
      topic('arrival', 1, 'Before arrival, entry visas, passports, arrival logistics, and first days', [
        /\bpassport\b|\breisepass\b|\bpass verloren\b|\bvisum\b|\bvisa\b|\bblue card\b|\bchancenkarte\b|\bfirst days?\b|\barriv(?:al|e|ing)\b|\bankunft\b|\beinreise\b/i,
      ], [
        /\bpassport\b|\breisepass\b|\bvisum\b|\bvisa\b/i,
      ]),
      topic('housing', 1, 'Finding accommodation, renting, landlords, deposits, scams, and housing documents', [
        /\baccommodation\b|\bhousing\b|\bflat\b|\bapartment\b|\brent(?:al|ing)?\b|\blandlord\b|\bdeposit\b|\bschufa\b|\bwohnung\b|\bmiete\b|\bmietvertrag\b|\bvermieter\b|\bkaution\b|\bwohnungsgeberbest[aä]tigung\b/i,
      ]),
      topic('registration', 1, 'City address registration, Anmeldung, Ummeldung, Abmeldung, and the Bürgeramt', [
        /\banmeldung\b|\bummeldung\b|\babmeldung\b|\bmeldebescheinigung\b|\bb[uü]rgeramt\b|\bregister(?:ing|ed)? (?:my |an? )?address\b|\baddress registration\b|\bwohnort anmel/i,
      ], [
        /\banmeldung\b|\bummeldung\b|\babmeldung\b|\bmeldebescheinigung\b|\bb[uü]rgeramt\b|\baddress registration\b/i,
      ], true),
    ]),
  }),
  Object.freeze({
    level: 2,
    name: 'Money, Health & Taxes',
    description: 'Bank accounts and IBANs, health insurance, taxes and tax IDs, pension insurance, and personal liability insurance.',
    topics: Object.freeze([
      topic('banking', 2, 'Opening and using a German bank account, IBAN, and identity verification', [
        /\bbank(?:ing)?\b|\bbank account\b|\baccount opening\b|\bgirokonto\b|\biban\b|\bkonto(?:er[oö]ffnung)?\b|\bvideo[ -]?ident\b|\bpostident\b/i,
      ], [
        /\bbank account\b|\bgirokonto\b|\biban\b|\bkontoer[oö]ffnung\b/i,
      ]),
      topic('health-insurance', 2, 'German public or private health insurance, Krankenkasse, GKV, and PKV', [
        /\bhealth insurance\b|\bmedical insurance\b|\bkrankenkasse\b|\bkrankenversicherung\b|\bgesundheitsversicherung\b|\bgkv\b|\bpkv\b|\bversichertenkarte\b/i,
      ], [
        /\bhealth insurance\b|\bkrankenkasse\b|\bkrankenversicherung\b|\bgkv\b|\bpkv\b/i,
      ], true),
      topic('taxes', 2, 'German taxes, tax ID, ELSTER, tax classes, and the Finanzamt', [
        /\btax(?:es|ation)?\b|\btax id\b|\bsteuer(?:n|erkl[aä]rung|-?id|klasse)?\b|\bfinanzamt\b|\belster\b|\blohnsteuer\b|\bkirchensteuer\b/i,
      ], [
        /\btax(?:es|ation)?\b|\bsteuer(?:n|erkl[aä]rung|-?id|klasse)?\b|\bfinanzamt\b|\belster\b/i,
      ], true),
      topic('pension', 2, 'Pension insurance and pension contribution records', [
        /\bpension insurance\b|\bpension contributions?\b|\brentenversicherung\b|\brentenversicherungsnummer\b/i,
      ], undefined, true),
      topic('liability-insurance', 2, 'Personal liability insurance (Haftpflichtversicherung)', [
        /\bliability insurance\b|\bpersonal liability\b|\bhaftpflicht(?:versicherung)?\b/i,
      ], undefined, true),
    ]),
  }),
  Object.freeze({
    level: 3,
    name: 'The Ausländerbehörde Gauntlet',
    description: 'The foreigners office and residence permits, integration courses, recognition of professional qualifications, and finding a job.',
    topics: Object.freeze([
      topic('residence-permit', 3, 'Ausländerbehörde appointments, residence permits, eAT cards, and Fiktionsbescheinigung', [
        /\bausl[aä]nderbeh[oö]rde\b|\bforeigners(?:'|’) office\b|\bimmigration office\b|\baufenthaltstitel\b|\baufenthaltserlaubnis\b|\bfiktionsbescheinigung\b|\beat card\b|\bresidence permit\b|\bpermit to (?:live|stay|remain)\b|\bpermission to (?:live|stay|remain)\b|\bbleiberecht\b/i,
      ], [
        /\bausl[aä]nderbeh[oö]rde\b|\baufenthaltstitel\b|\bfiktionsbescheinigung\b|\beat card\b|\bresidence permit\b|\bpermission to (?:live|stay|remain)\b/i,
      ], true),
      topic('integration-course', 3, 'BAMF integration courses, language and civic exams, and course obligations', [
        /\bintegration course\b|\bintegrationskurs\b|\bbamf course\b|\bdeutsch-?test f[uü]r zuwanderer\b|\bleben in deutschland\b|\bberechtigungsschein\b/i,
      ], [
        /\bintegration course\b|\bintegrationskurs\b|\bbamf course\b/i,
      ], true),
      topic('qualifications', 3, 'Recognition of foreign qualifications, Anerkennung, anabin, ZAB, and Approbation', [
        /\bqualification recognition\b|\brecognition of (?:my )?(?:degree|diploma|qualification)\b|\banerkennung\b|\banabin\b|\bzab\b|\bapprobation\b|\babschluss anerkennen\b/i,
      ], [
        /\bqualification recognition\b|\banerkennung\b|\banabin\b|\bapprobation\b/i,
      ], true),
      topic('jobs', 3, 'Finding a job, German applications, Bewerbung, and employment search', [
        /\bjob search\b|\bfind(?:ing)? (?:a )?job\b|\blooking for work\b|\bjob hunting\b|\bbewerbung\b|\barbeitssuche\b|\bstellensuche\b|\bjob finden\b/i,
      ]),
    ]),
  }),
  Object.freeze({
    level: 4,
    name: 'Getting Around & Settling In',
    description: 'Driving licences, cars, public transport, broadcasting fees, waste sorting, SIM and internet service, and social integration.',
    topics: Object.freeze([
      topic('driving', 4, 'Driving licence conversion, tests, and the Führerscheinstelle', [
        /\bdriving licen[cs]e\b|\bdriver(?:'s|’) licen[cs]e\b|\bf[uü]hrerschein\b|\bumschreibung\b|\bf[uü]hrerscheinstelle\b/i,
      ], undefined, true),
      topic('car', 4, 'Buying, insuring, inspecting, and registering a car', [
        /\bbuy(?:ing)? (?:a )?car\b|\bcar registration\b|\bvehicle registration\b|\bauto kaufen\b|\bkfz\b|\bzulassungsbeh[oö]rde\b|\bt[uü]v\b|\bumweltplakette\b|\bevb(?:-nummer)?\b/i,
      ], undefined, true),
      topic('transport', 4, 'Public transport, VGN, VAG, and Deutschlandticket', [
        /\bpublic transport\b|\btrain ticket\b|\btram\b|\bbus ticket\b|\bdeutschlandticket\b|\bvgn\b|\bvag\b|\b[oö]ffentliche verkehrsmittel\b|\bnahverkehr\b/i,
      ]),
      topic('broadcasting-fee', 4, 'Rundfunkbeitrag and household broadcasting fees', [
        /\brundfunkbeitrag\b|\bradio tax\b|\bbroadcast(?:ing)? (?:fee|contribution)\b|\bgez\b/i,
      ], undefined, true),
      topic('waste', 4, 'Waste separation, recycling, bin colours, and Pfand', [
        /\bwaste sort(?:ing)?\b|\bwaste separation\b|\brecycling\b|\bm[uü]lltrennung\b|\babfall\b|\bpfand\b|\bgelbe tonne\b/i,
      ]),
      topic('connectivity', 4, 'SIM cards, mobile plans, and home internet contracts', [
        /\bsim card\b|\besim\b|\bmobile plan\b|\bhome internet\b|\bbroadband\b|\binternet contract\b|\bprepaid sim\b|\bhandyvertrag\b/i,
      ]),
      topic('social', 4, 'Learning German socially, meetups, Stammtisch, and settling into local life', [
        /\bsocial integration\b|\bmake friends\b|\bmeet people\b|\bstammtisch\b|\bmeetups?\b|\bdeutsch lernen\b|\blearning german\b|\bsoziale integration\b/i,
      ]),
    ]),
  }),
  Object.freeze({
    level: 5,
    name: 'Family & Forever',
    description: 'Having a child, parental benefits and leave, permanent residence, naturalisation, and citizenship.',
    topics: Object.freeze([
      topic('family', 5, 'Having a child, birth registration, Kindergeld, Elterngeld, Elternzeit, and Mutterschutz', [
        /\bhaving a child\b|\bhave a baby\b|\bpregnan(?:t|cy)\b|\bbirth registration\b|\bgeburtsurkunde\b|\bkindergeld\b|\belterngeld\b|\belternzeit\b|\bmutterschutz\b|\bkind bekommen\b|\bschwanger\b/i,
      ], undefined, true),
      topic('permanent-status', 5, 'Permanent residence, naturalisation, and German citizenship', [
        /\bpermanent residence\b|\bsettlement permit\b|\bniederlassungserlaubnis\b|\bcitizenship\b|\bnaturali[sz]ation\b|\beinb[uü]rgerung\b|\bstaatsb[uü]rgerschaft\b|\bgerman passport\b/i,
      ], [
        /\bpermanent residence\b|\bsettlement permit\b|\bniederlassungserlaubnis\b|\bcitizenship\b|\bnaturali[sz]ation\b|\beinb[uü]rgerung\b/i,
      ], true),
    ]),
  }),
]);

function topic(id, level, description, patterns, leakPatterns = patterns, highStakes = false) {
  return Object.freeze({
    id,
    level,
    description,
    patterns: Object.freeze(patterns),
    leakPatterns: Object.freeze(leakPatterns),
    highStakes,
  });
}

export const WIKI_MIN_LEVEL = Object.freeze({
  '01-before-you-arrive.md': 1,
  '02-arrival-and-first-days.md': 1,
  '03-accommodation.md': 1,
  '04-city-registration-anmeldung.md': 1,
  '05-bank-account.md': 2,
  '06-health-insurance.md': 2,
  '07-auslanderbehorde-residence-permit.md': 3,
  '08-integration-course.md': 3,
  '09-driving-license.md': 4,
  '10-taxes.md': 2,
  '11-car-buying-and-registration.md': 4,
  '12-public-transport.md': 4,
  '13-radio-tax.md': 4,
  '14-waste-sorting.md': 4,
  '15-pension-insurance.md': 2,
  '16-liability-insurance.md': 2,
  '17-sim-and-internet.md': 4,
  '18-social-integration.md': 4,
  '19-having-a-child.md': 5,
  '20-qualifications-recognition.md': 3,
  '21-job-search.md': 3,
  '22-permanent-residence-and-citizenship.md': 5,
  '23-glossary-and-resources.md': 0,
});

export function publicLevelTaxonomy() {
  return LEVEL_TAXONOMY.map(({ level, name, description }) => ({ level, name, description }));
}

export function classifyLocally(input) {
  const text = String(input).normalize('NFKC');
  const matches = [];
  for (const level of LEVEL_TAXONOMY) {
    for (const candidate of level.topics) {
      if (candidate.patterns.some((pattern) => pattern.test(text))) matches.push(candidate);
    }
  }
  if (!matches.length) return { confident: false, requiredLevel: null, topicIds: [], highStakes: false };
  return {
    confident: true,
    requiredLevel: Math.max(...matches.map((match) => match.level)),
    topicIds: [...new Set(matches.map((match) => match.id))],
    highStakes: matches.some((match) => match.highStakes),
  };
}

export function detectDeterministicFutureLeak(answer, currentLevel, allowedSourceText = '') {
  const text = String(answer).normalize('NFKC');
  const allowed = String(allowedSourceText).normalize('NFKC').toLocaleLowerCase('de-DE');
  const matches = [];
  for (const level of LEVEL_TAXONOMY) {
    if (level.level <= currentLevel) continue;
    for (const candidate of level.topics) {
      for (const pattern of candidate.leakPatterns) {
        const match = pattern.exec(text);
        pattern.lastIndex = 0;
        if (!match) continue;
        if (allowed.includes(match[0].toLocaleLowerCase('de-DE'))) continue;
        matches.push({ level: candidate.level, topicId: candidate.id, phrase: match[0] });
      }
    }
  }
  return matches;
}

export function needsScopeVerifier(answer, currentLevel) {
  if (currentLevel >= 5) return false;
  const classification = classifyLocally(answer);
  return classification.confident && classification.requiredLevel > currentLevel;
}

export function isUrgentSafetyText(input) {
  return /\b(emergency|urgent|danger|unsafe|violence|threat|police|ambulance|fire|notfall|dringend|gefahr|unsicher|gewalt|bedrohung|polizei|rettungsdienst|feuerwehr)\b/i.test(String(input));
}

export function requiresGeneralGuidance(input) {
  return /\b(lost|losing|lose|stolen|missing|misplaced|verloren|gestohlen|weg)\b/i.test(String(input)) && /\b(passport|reisepass|pass)\b/i.test(String(input));
}

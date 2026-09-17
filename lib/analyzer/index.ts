import { crawl } from './crawler';
import { assertPublicHostname, normalizeUrl, sameOrigin } from './url';
import { visibleText } from './parser';
import type { AnalysisReport, AnalysisResult, Category, PageSnapshot, ScoreSet, Severity } from './types';

const id = () => Math.random().toString(36).slice(2, 10);
const result = (category: Category, rule: string, status: AnalysisResult['status'], severity: Severity, score: number, title: string, evidence: string, recommendation: string, pageUrl?: string): AnalysisResult => ({ id: id(), category, rule, status, severity, score, title, evidence, recommendation, pageUrl });

function firstPage(pages: PageSnapshot[]) { return pages[0]; }
function hasAny(text: string, terms: string[]) { return terms.some((term) => text.toLowerCase().includes(term)); }
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

async function publicText(url: URL, timeout = 4000): Promise<string> {
  try {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { signal: controller.signal, redirect: 'error', headers: { 'user-agent': 'FixMyBusinessAI/1.0' }, cache: 'no-store' });
    clearTimeout(timer);
    if (!response.ok) return '';
    const text = await response.text(); return text.slice(0, 200_000);
  } catch { return ''; }
}

function analyzePage(page: PageSnapshot): AnalysisResult[] {
  const text = visibleText(page.html);
  const lower = text.toLowerCase();
  const results: AnalysisResult[] = [];
  const titleGood = page.title.length >= 20 && page.title.length <= 65;
  results.push(result('SEO', 'title-present-and-length', page.title ? (titleGood ? 'pass' : 'warning') : 'fail', page.title ? (titleGood ? 'good' : 'medium') : 'high', page.title ? (titleGood ? 100 : 65) : 0, page.title ? 'Le titre de page est détecté' : 'Titre de page absent', page.title ? `« ${page.title.slice(0, 100)} » (${page.title.length} caractères)` : 'Aucune balise title détectée.', 'Rédigez un titre descriptif, unique et adapté à la page, idéalement entre 20 et 65 caractères.', page.url));
  results.push(result('SEO', 'meta-description', page.description ? (page.description.length >= 70 && page.description.length <= 170 ? 'pass' : 'warning') : 'fail', page.description ? 'medium' : 'high', page.description ? (page.description.length >= 70 && page.description.length <= 170 ? 100 : 70) : 0, page.description ? 'Meta description détectée' : 'Meta description non détectée', page.description ? `« ${page.description.slice(0, 145)} »` : 'La page ne contient pas de meta description identifiable.', 'Ajoutez une description unique qui résume la page et donne envie de la visiter. Le nombre de caractères est un repère, pas une garantie SEO.', page.url));
  results.push(result('SEO', 'h1-structure', page.h1.length === 1 ? 'pass' : (page.h1.length === 0 ? 'fail' : 'warning'), page.h1.length === 1 ? 'good' : 'medium', page.h1.length === 1 ? 100 : page.h1.length === 0 ? 0 : 65, page.h1.length === 1 ? 'Un H1 unique est détecté' : page.h1.length === 0 ? 'Aucun H1 détecté' : 'Plusieurs H1 détectés', page.h1.length ? `${page.h1.length} H1: ${page.h1.slice(0, 2).join(' · ')}` : 'La structure principale ne contient pas de H1 identifiable.', 'Utilisez un H1 clair pour présenter le sujet principal de la page, puis organisez les sous-parties avec H2 et H3.', page.url));
  results.push(result('SEO', 'heading-hierarchy', page.h2.length || page.h1.length ? 'pass' : 'warning', page.h2.length || page.h1.length ? 'good' : 'low', page.h2.length || page.h1.length ? 100 : 55, 'Structure des titres', page.h2.length ? `${page.h2.length} sous-titre(s) H2 détecté(s).` : 'Peu de titres structurants détectés.', 'Structurez le contenu avec des titres explicites pour faciliter le parcours et l’interprétation de la page.', page.url));
  results.push(result('SEO', 'canonical', /<link\b[^>]*rel\s*=\s*["'][^"']*canonical/i.test(page.html) ? 'pass' : 'warning', /<link\b[^>]*rel\s*=\s*["'][^"']*canonical/i.test(page.html) ? 'good' : 'low', /<link\b[^>]*rel\s*=\s*["'][^"']*canonical/i.test(page.html) ? 100 : 65, 'URL canonique', /<link\b[^>]*rel\s*=\s*["'][^"']*canonical/i.test(page.html) ? 'Une balise canonique est détectée.' : 'Aucune balise canonique détectée sur cette page.', 'Vérifiez la stratégie canonique lorsque plusieurs URL peuvent afficher un contenu similaire.', page.url));
  const textLength = text.length;
  results.push(result('CONTENU', 'content-depth-indicator', textLength >= 600 ? 'pass' : 'warning', textLength >= 600 ? 'good' : 'medium', textLength >= 600 ? 100 : textLength >= 250 ? 70 : 35, textLength >= 600 ? 'Volume de contenu raisonnable' : 'Contenu potentiellement succinct', `${textLength} caractères de texte visible estimés. Ce contrôle est indicatif et ne juge pas la qualité éditoriale.`, 'Vérifiez que la page répond à l’intention du visiteur et présente les informations essentielles sans ajouter du texte artificiellement.', page.url));
  const valueTerms = ['nous', 'solution', 'service', 'accompagnement', 'pour', 'découvrir', 'contact'];
  results.push(result('CONTENU', 'value-proposition', hasAny(lower, valueTerms) ? 'pass' : 'warning', hasAny(lower, valueTerms) ? 'good' : 'medium', hasAny(lower, valueTerms) ? 100 : 60, hasAny(lower, valueTerms) ? 'Des termes de proposition de valeur sont visibles' : 'Proposition de valeur difficile à repérer', hasAny(lower, valueTerms) ? 'Certains termes orientés offre ou bénéfice ont été détectés.' : 'Le contrôle automatique n’a pas retrouvé de formulation claire décrivant une offre ou un bénéfice.', 'Placez en haut de page une phrase simple qui explique pour qui vous êtes et ce que vous apportez.', page.url));
  const repeated = /(\b[\wÀ-ÿ]{5,}\b)(?:[\s,.;:!?]+\1){4,}/i.test(text);
  results.push(result('CONTENU', 'obvious-repetition', repeated ? 'warning' : 'pass', repeated ? 'low' : 'good', repeated ? 70 : 100, repeated ? 'Répétition potentielle détectée' : 'Pas de répétition évidente détectée', repeated ? 'Une répétition de termes a été repérée par un contrôle simple.' : 'Aucune répétition mécanique évidente n’a été repérée.', 'Relisez les passages signalés et privilégiez un vocabulaire naturel; ce contrôle peut produire des faux positifs.', page.url));
  const cta = hasAny(lower, ['contact', 'demander', 'réserver', 'réservez', 'acheter', 'devis', 'essai', 'commencer', 'en savoir plus', 'book', 'get started', 'sign up']);
  results.push(result('CONVERSION', 'clear-cta', cta ? 'pass' : 'warning', cta ? 'good' : 'high', cta ? 100 : 35, cta ? 'Un appel à l’action potentiel est détecté' : 'Appel à l’action évident non détecté', cta ? 'Des mots associés à une prise de contact ou à une action ont été repérés.' : 'Le contrôle n’a pas repéré de libellé habituel d’appel à l’action dans le texte visible.', 'Rendez l’étape suivante explicite avec un bouton ou un lien adapté à l’objectif de la page.', page.url));
  const contact = hasAny(lower, ['@', 'contact', 'téléphone', 'tel:', 'phone', 'adresse']);
  results.push(result('CONVERSION', 'contact-information', contact ? 'pass' : 'warning', contact ? 'good' : 'medium', contact ? 100 : 55, contact ? 'Un moyen de contact potentiel est visible' : 'Informations de contact non détectées', contact ? 'Un élément de contact semble présent dans le contenu ou les liens.' : 'Aucun email, téléphone ou libellé de contact courant n’a été détecté.', 'Rendez le moyen de contact adapté à votre activité facile à trouver, sans exposer plus de données personnelles que nécessaire.', page.url));
  const trust = hasAny(lower, ['avis', 'témoignage', 'testimonial', 'garantie', 'certifié', 'certification', 'clients']);
  results.push(result('CONVERSION', 'trust-signals', trust ? 'pass' : 'warning', trust ? 'good' : 'low', trust ? 100 : 60, trust ? 'Un élément de confiance potentiel est visible' : 'Éléments de confiance non détectés', trust ? 'Des termes associés à la preuve ou à la confiance sont repérés.' : 'Le contrôle n’a pas retrouvé de témoignage ou d’élément de confiance courant.', 'Si cela correspond à votre activité, présentez des preuves vérifiables, contextualisées et non trompeuses.', page.url));
  results.push(result('MOBILE', 'viewport', page.hasViewport ? 'pass' : 'fail', page.hasViewport ? 'good' : 'high', page.hasViewport ? 100 : 0, page.hasViewport ? 'Viewport mobile détecté' : 'Viewport mobile absent', page.hasViewport ? 'La balise meta viewport est présente.' : 'Aucune meta viewport identifiable.', 'Ajoutez une meta viewport et vérifiez le rendu sur plusieurs tailles d’écran. Ce contrôle ne remplace pas un test sur appareils réels.', page.url));
  const oversizedImage = page.images.some((image) => !image.alt);
  results.push(result('ACCESSIBILITÉ', 'image-alt', oversizedImage ? 'warning' : 'pass', oversizedImage ? 'medium' : 'good', oversizedImage ? 60 : 100, oversizedImage ? 'Certaines images n’ont pas de texte alternatif' : 'Textes alternatifs détectés sur les images', `${page.images.filter((image) => !image.alt).length} image(s) sans alt sur ${page.images.length} détectée(s).`, 'Ajoutez un alt pertinent aux images informatives; utilisez un alt vide pour les images strictement décoratives.', page.url));
  results.push(result('ACCESSIBILITÉ', 'document-language', page.lang ? 'pass' : 'warning', page.lang ? 'good' : 'low', page.lang ? 100 : 60, page.lang ? 'Langue du document détectée' : 'Langue du document non détectée', page.lang ? `Langue déclarée: ${page.lang}.` : 'La balise html ne déclare pas de langue identifiable.', 'Déclarez la langue principale du document sur la balise html et vérifiez les changements de langue.', page.url));
  const unlabeledInputs = (page.html.match(/<input\b(?![^>]*type\s*=\s*["'](?:hidden|submit|button)["'])[^>]*>/gi) ?? []).filter((tag) => !/aria-label|id\s*=|title\s*=/i.test(tag)).length;
  results.push(result('ACCESSIBILITÉ', 'form-labels', page.forms === 0 || unlabeledInputs === 0 ? 'pass' : 'warning', page.forms === 0 || unlabeledInputs === 0 ? 'good' : 'medium', page.forms === 0 || unlabeledInputs === 0 ? 100 : 65, page.forms === 0 ? 'Aucun formulaire à contrôler' : unlabeledInputs ? 'Libellés de champs à vérifier' : 'Champs de formulaire repérés', page.forms === 0 ? 'Aucun formulaire HTML détecté.' : `${unlabeledInputs} champ(s) nécessitent une vérification automatique.`, 'Associez chaque champ à un label visible et expliquez les erreurs de saisie. Contrôle automatisé uniquement.', page.url));
  const heavy = page.scripts > 20 || page.size > 500_000;
  results.push(result('PERFORMANCE', 'page-weight-indicator', heavy ? 'warning' : 'pass', heavy ? 'medium' : 'good', heavy ? 65 : 100, heavy ? 'Poids ou nombre de scripts à surveiller' : 'Indicateur de poids raisonnable', `${Math.round(page.size / 1024)} Ko HTML et ${page.scripts} script(s) détecté(s). Mesure indicative, hors ressources secondaires.`, 'Mesurez les ressources réelles en production et compressez les éléments utiles avant de supprimer du contenu nécessaire.', page.url));
  results.push(result('PERFORMANCE', 'response-time', page.responseMs > 1500 ? 'warning' : 'pass', page.responseMs > 1500 ? 'medium' : 'good', page.responseMs > 1500 ? 65 : 100, page.responseMs > 1500 ? 'Réponse initiale à surveiller' : 'Réponse initiale rapide dans ce contrôle', `${page.responseMs} ms observées depuis le serveur d’analyse; ce n’est pas une mesure officielle de Google.`, 'Suivez la latence réelle de vos visiteurs et optimisez hébergement, cache et ressources critiques.', page.url));
  results.push(result('TECHNIQUE', 'http-status', page.status >= 200 && page.status < 400 ? 'pass' : 'fail', page.status >= 200 && page.status < 400 ? 'good' : 'high', page.status >= 200 && page.status < 400 ? 100 : 0, page.status >= 200 && page.status < 400 ? 'La page répond correctement' : 'La page répond avec une erreur', `Statut HTTP: ${page.status}.`, 'Vérifiez les pages en erreur et les redirections avant de les partager à vos visiteurs.', page.url));
  return results;
}

export async function analyzeWebsite(rawUrl: string, requestedPageCount = 1): Promise<AnalysisReport> {
  const { pages, warnings } = await crawl(rawUrl, { maxPages: requestedPageCount });
  const results = pages.flatMap(analyzePage);
  const root = new URL(pages[0].url);
  const robots = await publicText(new URL('/robots.txt', root));
  const sitemap = await publicText(new URL('/sitemap.xml', root));
  const linksToCheck = [...new Map(pages.flatMap((page) => page.links).map((link) => [link.href, link])).values()].slice(0, 12);
  for (const link of linksToCheck) {
    let target: URL;
    try { target = normalizeUrl(link.href); } catch { results.push(result('TECHNIQUE', 'link-health', 'unavailable', 'low', 50, 'Lien non vérifiable', `${link.href} — URL non reconnue par le contrôle.`, 'Vérifiez l’URL et retirez les liens mal formés.', pages[0].url)); continue; }
    if (!sameOrigin(root, target)) { results.push(result('TECHNIQUE', 'link-health', 'pass', 'good', 100, 'Lien externe détecté', `${target.toString()} — type EXTERNAL; son contenu n’est pas audité.`, 'Vérifiez manuellement les liens externes importants et leur destination.', pages[0].url)); continue; }
    try {
      await assertPublicHostname(target);
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(target, { method: 'HEAD', redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'FixMyBusinessAI/1.0' }, cache: 'no-store' });
      clearTimeout(timer);
      const redirected = [301, 302, 303, 307, 308].includes(response.status);
      const healthy = response.status >= 200 && response.status < 400;
      results.push(result('TECHNIQUE', 'link-health', healthy ? (redirected ? 'warning' : 'pass') : 'fail', healthy ? (redirected ? 'low' : 'good') : 'medium', healthy ? (redirected ? 75 : 100) : 0, healthy ? (redirected ? 'Redirection détectée sur un lien interne' : 'Lien interne accessible') : 'Lien interne en erreur', `${target.toString()} — ${redirected ? 'REDIRECT' : response.status >= 400 ? 'ERROR' : 'OK'} (${response.status}).`, 'Corrigez les liens en erreur et vérifiez que les redirections sont intentionnelles.', pages[0].url));
    } catch (error) {
      const timeout = error instanceof Error && error.name === 'AbortError';
      results.push(result('TECHNIQUE', 'link-health', 'unavailable', 'medium', 45, timeout ? 'Lien interne trop lent à vérifier' : 'Lien interne inaccessible', `${target.toString()} — ${timeout ? 'TIMEOUT' : 'INACCESSIBLE'}.`, 'Vérifiez la disponibilité de la destination depuis un réseau externe.', pages[0].url));
    }
  }
  results.push(result('SEO', 'robots-and-sitemap', robots || sitemap ? 'pass' : 'warning', robots || sitemap ? 'good' : 'low', robots || sitemap ? 100 : 60, robots && sitemap ? 'Robots.txt et sitemap détectés' : robots ? 'Robots.txt détecté' : sitemap ? 'Sitemap détecté' : 'Robots.txt et sitemap non détectés', `robots.txt: ${robots ? 'accessible' : 'non détecté'} · sitemap.xml: ${sitemap ? 'accessible' : 'non détecté'}.`, 'Vérifiez que ces fichiers reflètent votre stratégie d’exploration; leur absence n’est pas automatiquement une erreur.', pages[0].url));
  const categories: Category[] = ['SEO', 'CONTENU', 'TECHNIQUE', 'MOBILE', 'ACCESSIBILITÉ', 'CONVERSION', 'PERFORMANCE'];
  const scores = {} as ScoreSet;
  for (const category of categories) {
    const categoryResults = results.filter((item) => item.category === category);
    scores[category] = clamp(categoryResults.length ? categoryResults.reduce((sum, item) => sum + item.score, 0) / categoryResults.length : 0);
  }
  const weights: Record<Category, number> = { SEO: .2, CONTENU: .15, TECHNIQUE: .15, MOBILE: .1, ACCESSIBILITÉ: .15, CONVERSION: .15, PERFORMANCE: .1 };
  scores.global = clamp(categories.reduce((sum, category) => sum + (scores[category] * weights[category]), 0));
  const failures = results.filter((item) => item.status === 'fail' || item.status === 'warning');
  const positives = results.filter((item) => item.status === 'pass' && item.severity === 'good').slice(0, 5).map((item) => item.title);
  const important = failures.filter((item) => item.severity === 'high' || item.severity === 'critical').slice(0, 2).map((item) => item.title.toLowerCase());
  const summary = warnings.length || failures.length ? `Nous avons identifié ${failures.length} point(s) à vérifier sur ${pages.length} page(s). ${important.length ? `Les sujets prioritaires concernent ${important.join(' et ')}.` : 'Consultez les preuves et recommandations pour décider des actions utiles.'}` : 'Les contrôles automatisés ne signalent pas de problème majeur sur les pages récupérées.';
  const limitations = ['Contrôle automatisé basé sur les éléments publiquement accessibles.', 'Le score est un indicateur interne, pas une norme officielle ni une garantie de performance.', 'Le rendu mobile, le contraste et la qualité éditoriale complète nécessitent une vérification humaine.', ...warnings];
  return { id: `r_${Date.now().toString(36)}_${id()}`, url: root.toString(), createdAt: new Date().toISOString(), status: warnings.length ? 'PARTIAL' : 'COMPLETED', pageCount: pages.length, requestedPageCount, scores, results, pages: pages.map(({ url, status, responseMs, size, depth, title }) => ({ url, status, responseMs, size, depth, title })), positives, summary, limitations, aiAvailable: Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY) };
}

import fetch from 'cross-fetch';
import { FiltersEngine, Request } from '@ghostery/adblocker';

export const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'zanpid',
  'msclkid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'yclid',
  'igshid',
  'twclid',
  'ref_src',
]);

export const BLOCKED_DOMAINS: string[] = [
  'doubleclick.net',
  'google-analytics.com',
  'googlesyndication.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'analytics.google.com',
  'googletagmanager.com',
  'googletagservices.com',
  'pixel.facebook.com',
  'analytics.facebook.com',
  'ads.tiktok.com',
  'analytics.tiktok.com',
  'ads.twitter.com',
  'analytics.twitter.com',
  'adroll.com',
  'adnxs.com',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'mouseflow.com',
  'fullstory.com',
  'crazyegg.com',
  'optimizely.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'heapanalytics.com',
  'branch.io',
  'amplitude.com',
  'appsflyer.com',
  'adjust.com',
  'singular.net',
  'kochava.com',
  'smartlook.com',
  'loggly.com',
  'bugsnag.com',
  'rollbar.com',
  'raygun.io',
  'newrelic.com',
  'nr-data.net',
  'datadoghq.com',
  'dynatrace.com',
  'appdynamics.com',
  'sentry.io',
  'clarity.ms',
  'bingads.microsoft.com',
  'bat.bing.com',
  'yahoo.com/ads',
  'gemini.yahoo.com',
  'media.net',
  'inmobi.com',
  'mopub.com',
  'unityads.unity3d.com',
  'applovin.com',
  'ironsrc.com',
  'chartboost.com',
  'vungle.com',
  'adcolony.com',
  'tapjoy.com',
  'fyber.com',
  'smaato.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'openx.com',
  'indexexchange.com',
  'casale-media.com',
  'sovrn.com',
  'lijit.com',
  'triplelift.com',
  'sharethrough.com',
  'teads.tv',
  'teads.com',
  'revcontent.com',
  'mgid.com',
  'zergnet.com',
  'content.ad',
  'nativo.com',
  'seedtag.com',
  'gumgum.com',
  'yieldmo.com',
  'kargo.com',
  'undertone.com',
  'conversantmedia.com',
  'exponential.com',
  'tribalfusion.com',
  'chitika.com',
  'infolinks.com',
  'kontera.com',
  'viglink.com',
  'skimlinks.com',
  'sovurn.com',
  'adblade.com',
  'bidvertiser.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'exoclick.com',
  'juicyads.com',
  'trafficjunky.com',
  'trafficfactory.biz',
  'ero-advertising.com',
  'adcash.com',
  'clickadu.com',
  'hilltopads.com',
  'adsterra.com',
  'yllix.com',
  'revenuehits.com',
  'adbuffs.com',
  'buysellads.com',
  'carbonads.com',
  'carbonads.net',
  'ethicalads.io',
  'codefund.io',
  'adbutler.com',
  'adzerk.net',
  'kevel.co',
  'flashtalking.com',
  'sizmek.com',
  'mediamind.com',
  'spongecell.com',
  'celtra.com',
  'bonzai.co',
  'smartadserver.com',
  'equativ.com',
  'adform.com',
  'adform.net',
  'xandr.com',
  'appnexus.com',
  'yieldlab.net',
  'improvedigital.com',
  'stroeer.de',
  'plista.com',
  'ligatus.com',
  'adspirit.de',
  'adspirit.com',
  'adscale.de',
  'nugg.ad',
  'thetradedesk.com',
  'ttd.com',
  'mediamath.com',
  'turn.com',
  'dataxu.com',
  'roku.com/ads',
  'amazon-adsystem.com',
  'aax-us-east.amazon-adsystem.com',
  'c.amazon-adsystem.com',
  's.amazon-adsystem.com',
  'adsystem.com',
  'assoc-amazon.com',
  'yieldmanager.com',
  'advertising.com',
  'atdmt.com',
  'atlasolutions.com',
  'moatads.com',
  'moat.com',
  'iasds.com',
  'integralads.com',
  'doubleverify.com',
  'dv-measure.com',
  'meetrics.com',
  'adloox.com',
  'pixel.adloox.com',
  'comscore.com',
  'voicefive.com',
  'scorecardresearch.com',
  'tns-counter.ru',
  'gemius.pl',
  'mediametrie.fr',
  'agbnielsen.net',
  'kantar.com',
  'yougov.com',
  'liveramp.com',
  'rlcdn.com',
  'neustar.biz',
  'agkn.com',
  'lotame.com',
  'crwdcntrl.net',
  'krux.com',
  'krxd.net',
  'demdex.net',
  'everesttech.net',
  'omtrdc.net',
  '2o7.net',
  'bluekai.com',
  'bkrtx.com',
  'oracleinfinity.io',
  'eloqua.com',
  'en25.com',
  'pardot.com',
  'marketo.com',
  'mktoresp.com',
  'hubspot.com',
  'hs-analytics.net',
  'hs-scripts.com',
  'leadforensics.com',
  'albacross.com',
  'clearbit.com',
  'visitor-analytics.io',
  'luckyorange.com',
  'mouseflow.com',
  'sessioncam.com',
  'clicktale.net',
  'smartlook.com',
  'decibelinsight.net',
  'inspectlet.com',
  'ptengine.com',
  'vwo.com',
  'visualwebsiteoptimizer.com',
  'kameleoon.com',
  'abtasty.com',
  'convert.com',
  'qualaroo.com',
  'usabilla.com',
  'survicate.com',
  'getsitecontrol.com',
  'sumo.com',
  'sumome.com',
  'optinmonster.com',
  'sleeknote.com',
  'privy.com',
  'wisepops.com',
  'bounceexchange.com',
  'yieldify.com',
  'salecycle.com',
  'barilliance.com',
  'nosto.com',
  'richrelevance.com',
  'certona.com',
  'monetate.net',
  'dynamicyield.com',
  'qubit.com',
  'evergage.com',
  'boxever.com',
  'tealiumiq.com',
  'tiqcdn.com',
  'ensighten.com',
  'signal.co',
  'brighttag.com',
  'commander1.com',
  'tagcommander.com',
  'tagman.com',
  'matomo.org',
  'piwik.pro',
  'plausible.io',
  'simpleanalytics.com',
  'fathom.com',
  'usefathom.com',
  'counter.yadro.ru',
  'top100.rambler.ru',
  'metrika.yandex.ru',
  'mc.yandex.ru',
  'an.yandex.ru',
  'bs.yandex.ru',
  'ad.mail.ru',
  'top-fwz1.mail.ru',
  'counter.co.il',
  'statcounter.com',
  'histats.com',
  'whos.amung.us',
  'clustrmaps.com',
  'feedjit.com',
  'revolvermaps.com',
  'flagcounter.com',
  'shinystat.com',
  'nedstat.com',
  'sitestat.com',
  'estat.com',
  'xiti.com',
  'atinternet.com',
  'weborama.com',
  'weborama.fr',
  'adriver.ru',
  'soloway.ru',
  'sape.ru',
  'begun.ru',
  'directcrm.ru',
  'mindbox.ru',
  'adfox.ru',
  'buzzoola.com',
  'relap.io',
  'viqeo.tv',
  'target.my.com',
  'mytarget.com',
  'vk.com/rtrg',
  'ok.ru/counter',
  'criteo.net',
  'rtbhouse.com',
  'sociomantic.com',
  'mythings.com',
  'adroll.com',
  'nextroll.com',
  'steelhouse.com',
  'mntn.com',
  'choozle.com',
  'simpli.fi',
  'basis.net',
  'centro.net',
  'chango.com',
  'fetchback.com',
  'tellapart.com',
  'retargeter.com',
  'adacado.com',
  'spongecell.com',
  'jivox.com',
  'flashtalking.com',
  'revjet.com',
  'adzymic.com',
  'bannerflow.com',
  'celtra.com',
  'responsiveads.com',
  'adacado.com',
  'bonzai.co',
  'spongecell.com',
  'mixpo.com',
  'adform.com',
  'smartclip.tv',
  'stickyads.tv',
  'spotxchange.com',
  'spotx.tv',
  'tremorhub.com',
  'tremorvideo.com',
  'yume.com',
  'videologygroup.com',
  'unruly.co',
  'unrulymedia.com',
  'invitemedia.com',
  'liverail.com',
  'adap.tv',
  'brightroll.com',
  'innovid.com',
  'flashtalking.com',
  'extremereach.com',
  'adstream.com',
  'peachvideo.com',
  'beam.tv',
  'honeycomb.tv',
  'groupm.com',
  'xaxis.com',
  'amnetgroup.com',
  'accuenmedia.com',
  'vivaki.com',
  'cadreon.com',
  'matterkind.com',
  'ipgmediabrands.com',
  'publicisgroupe.com',
  'omnicomgroup.com',
  'wpp.com',
  'dentsu.com',
  'havas.com',
  'havasmedia.com',
  'ipg.com',
];

// Initialize initial fallback engine immediately
const fallbackRules = BLOCKED_DOMAINS.map((d) => `||${d}^`).join('\n');
let engine: FiltersEngine = FiltersEngine.parse(fallbackRules);

// Asynchronously load full EasyList + EasyPrivacy prebuilt lists
FiltersEngine.fromPrebuiltAdsAndTracking(fetch)
  .then((prebuilt) => {
    engine = prebuilt;
  })
  .catch(() => {
    // Keep fallback engine
  });

/**
 * Checks if a given URL is blocked by network filters or fallback blocklist.
 */
export function isBlocked(url: string, sourceUrl?: string, destType = 'other'): boolean {
  try {
    let clean = url.trim();
    if (!clean.includes('://') && !clean.startsWith('//')) {
      clean = `https://${clean}`;
    } else if (clean.startsWith('//')) {
      clean = `https:${clean}`;
    }
    const parsed = new URL(clean);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Direct domain match against fallback list
    for (const blocked of BLOCKED_DOMAINS) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return true;
      }
    }

    // 2. Ghostery FiltersEngine match
    if (engine) {
      const ghosteryType = mapDestToGhosteryType(destType);
      const req = Request.fromRawDetails({
        url: parsed.toString(),
        sourceUrl: sourceUrl || undefined,
        type: ghosteryType as any,
      });
      const match = engine.match(req);
      if (match && match.match) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Retrieves cosmetic CSS styling to hide ad placeholders on the page.
 */
export function getCosmeticFilters(pageUrl: string): string {
  try {
    if (!engine) return '';
    const req = Request.fromRawDetails({ url: pageUrl });
    const cosmetics = engine.getCosmeticsFilters(req);
    if (cosmetics && typeof (cosmetics as any).styles === 'string') {
      return (cosmetics as any).styles;
    }
    return '';
  } catch {
    return '';
  }
}

function mapDestToGhosteryType(dest: string): string {
  const d = dest.toLowerCase();
  if (d === 'script') return 'script';
  if (d === 'style') return 'stylesheet';
  if (d === 'image') return 'image';
  if (d === 'font') return 'font';
  if (d === 'iframe' || d === 'document' || d === 'frame') return 'subdocument';
  if (d === 'video' || d === 'audio') return 'media';
  if (d === 'empty' || d === 'fetch' || d === 'xhr') return 'xmlhttprequest';
  return 'other';
}

/**
 * Removes tracking parameters from URLs.
 */
export function stripTrackingParams(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    let changed = false;
    for (const key of Array.from(u.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        u.searchParams.delete(key);
        changed = true;
      }
    }
    return changed ? u.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

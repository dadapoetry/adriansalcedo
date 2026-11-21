(() => {
  const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ca';
  document.documentElement.lang = lang;
  const scroller = document.querySelector('#scroller');
  const roll = document.querySelector('#roll');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let travel = 0;
  let current = 0;
  let boot = reduceMotion ? 1 : 0;

  function measure() {
    const ratio = travel ? Math.min(window.scrollY, travel) / travel : 0;
    travel = Math.max(0, roll.scrollWidth - window.innerWidth);
    scroller.style.height = `${window.innerHeight + travel}px`;
    window.scrollTo(0, ratio * travel);
    current = ratio * travel;
  }

  function fitBody(inner, max) {
    const body = inner.querySelector('.detail-body');
    const pad = getComputedStyle(inner);
    const avail = inner.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);
    const contentH = () => [...inner.children].reduce((total, child) => {
      const style = getComputedStyle(child);
      return total + child.getBoundingClientRect().height
        + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0);
    }, 0);
    let size = parseFloat(getComputedStyle(body).fontSize);
    body.style.fontSize = `${size}px`;
    while (contentH() > avail && size > 14) {
      size -= 1;
      body.style.fontSize = `${size}px`;
    }
    while (contentH() < avail * 0.82 && size < max) {
      size += 2;
      body.style.fontSize = `${size}px`;
    }
    return size;
  }

  function frame() {
    const target = Math.min(window.scrollY, travel);
    const w = window.innerWidth;
    current = reduceMotion ? target : current + (target - current) * 0.12;
    if (Math.abs(target - current) < 0.1) current = target;
    if (boot < 1) boot = Math.min(1, boot + 0.014);
    roll.style.transform = `translate3d(${-current.toFixed(2)}px, 0, 0)`;

    for (const panel of roll.children) {
      const left = panel.offsetLeft - current;
      const overlap = Math.max(0, Math.min(left + panel.offsetWidth, w) - Math.max(left, 0));
      const focus = Math.min(1, overlap / panel.offsetWidth);
      const reveal = reduceMotion ? 1 : boot * Math.max(0, Math.min(1, (w * 0.95 - left) / (w * 0.6)));
      const blur = reduceMotion ? 0 : (1 - focus) * 0.7;
      panel.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : 'none';

      [...panel.children].forEach((child, i) => {
        const local = Math.max(0, Math.min(1, (reveal - i * 0.1) / (1 - i * 0.1)));
        child.style.opacity = local.toFixed(3);
        child.style.transform = local <= 0 || local >= 1 ? 'none' : `translate3d(${((1 - local) * 44).toFixed(1)}px, 0, 0)`;
      });
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', measure);

  document.querySelector('.skip').addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: travel, behavior: 'smooth' });
  });

  const load = async (name) => {
    const response = await fetch(new URL(`../content/${name}.json?v=${Date.now()}`, location.href));
    if (!response.ok) throw new Error(name);
    return response.json();
  };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
  const text = (html) => new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent.trim();
  const asset = (src) => (String(src || '').startsWith('/media/') ? `../${src.slice(1)}` : src);

  async function init() {
    const names = ['site', 'site.en', 'home', 'obres', 'projectes', 'festivals', 'premis', 'premsa', 'quisoc', 'agenda', 'labels'];
    let sources;
    try {
      sources = await Promise.all(names.map(load));
    } catch (error) {
      console.warn('Prototip: JSON no accessible, faig servir la còpia local.', error);
      sources = names.map((name) => (window.PROTOTIP_DATA || {})[name] || {});
    }
    const [site, siteEn, home, obres, projectes, festivals, premis, premsa, quisoc, agenda, labels] = sources;

    const L = (key) => {
      const row = (labels.labels || []).find((item) => item.key === key);
      return row ? (lang === 'en' ? row.en : row.ca) : '';
    };
    const pick = (obj, key) => {
      if (!obj) return '';
      const ca = obj[key];
      if (lang !== 'en') return ca;
      const en = obj[`${key}_en`];
      const empty = en == null || (typeof en === 'string' && !en.trim()) || (Array.isArray(en) && !en.length);
      return empty ? ca : en;
    };
    const pickList = (obj, key) => {
      const value = pick(obj, key);
      return Array.isArray(value) ? value : (value ? [value] : []);
    };
    const kind = (value) => {
      if (!value) return '';
      if (['Debut editorial', 'Debut book', 'Editorial debut'].includes(value)) return L('debutWork');
      const label = L(`kind${value.charAt(0).toUpperCase()}${value.slice(1)}`);
      return label || value;
    };

    const s = { ...(site.site || {}), ...((lang === 'en' && siteEn.site) || {}) };
    const social = (lang === 'en' && siteEn.social) || site.social || {};
    const h = home.hero || {};
    const fw = home.featuredWork || {};
    // El detall complet ve de la fitxa d'obra; s'identifica pel slug de l'enllaç destacat.
    const work = (obres.works || []).find((w) => w.id === String(fw.link || '').split('/').pop());
    const featured = work
      ? { ...work, ...fw, content: work.content, content_en: work.content_en, links: work.links, buyLinks: work.buyLinks, isbn: work.isbn }
      : fw;
    const subtitle = String(pick(h, 'subtitle') || '').replace(/^./, (c) => c.toLowerCase());

    document.querySelector('.skip').textContent = L('skipToEnd');
    document.title = lang === 'en'
      ? (home.seo?.title_en || s.title)
      : (home.seo?.title || s.title);
    const metaTag = document.querySelector('meta[name="description"]');
    if (metaTag) {
      metaTag.content = lang === 'en'
        ? (home.seo?.description_en || s.description || '')
        : (home.seo?.description || s.description || '');
    }
    const langLinks = `<span class="lang"><a href="?lang=ca"${lang === 'ca' ? ' aria-current="true"' : ''}>CA</a><span aria-hidden="true"> / </span><a href="?lang=en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a></span>`;
    const heading = (title) => {
      const name = String(title || '');
      return `<h2 class="${name.length > 20 ? 'long' : ''}">${esc(name)}</h2>`;
    };
    const lead = (value) => {
      const body = String(value || '');
      return `<p class="lead${body.length > 140 ? ' long' : ''}">${esc(body)}</p>`;
    };

    const highlighted = (list) => (list || []).filter((item) => item.destacat);
    const imageOf = (item) => item.image || (item.images || [])[0]?.src;
    const altOf = (item) => pick(item, 'imageAlt') || pick((item.images || [])[0], 'alt') || '';
    const metaOf = (item) => item.meta || [
      kind(pick(item, 'type') || pick(item, 'label') || pick(item, 'category')),
      item.year || String(pick(item, 'date') || '').slice(0, 4),
      item.publisher,
      item.venue,
      item.isbn ? `ISBN: ${item.isbn}` : ''
    ].filter(Boolean).join(', ');
    const strip = (value) => text(Array.isArray(value) ? value[0] : value);
    const rollItem = (item) => (item.label && !item.title
      ? { ...item, title: pick(item, 'label'), meta: String(item.year || '') }
      : item);
    const linkRow = (list) => (list || [])
      .map((link) => `<a href="${esc(link.url)}">${esc(pick(link, 'label') || link.url)}</a>`)
      .join(' \u00B7 ');
    const detailOf = (item, leadText) => {
      const paras = pickList(item, 'content');
      const body = paras.filter((paragraph) => text(paragraph) !== leadText).join('');
      const list = pickList(item, 'contentList').map((x) => `<p>${esc(x)}</p>`).join('');
      const closing = pick(item, 'closing') ? `<p>${pick(item, 'closing')}</p>` : '';
      const media = (item.images || []).slice(1)
        .map((i) => `<figure><img src="${esc(asset(i.src))}" alt="${esc(pick(i, 'alt'))}"></figure>`).join('');
      const videos = (item.videos || []).map((v) => `<p><a href="${esc(v.url)}">${esc(pick(v, 'title') || v.url)}</a></p>`).join('');
      const buy = linkRow(item.buyLinks);
      const more = linkRow(item.links);
      const links = (buy || more)
        ? `<div class="detail-links">${buy ? `<p><span>${esc(L('whereToBuy'))}</span>${buy}</p>` : ''}${more ? `<p>${more}</p>` : ''}</div>`
        : '';
      return { body: body + list + closing + media + videos, links };
    };

    const panels = [];
    const add = (html, extra = '') => panels.push(
      `<section class="panel ${extra}${extra.includes('panel--detail') || panels.length % 2 === 0 ? '' : ' img-first'}">${html}</section>`
    );

    add(`
      ${langLinks}
      <h1>${(s.title || '').split(' ').map((word) => `<span>${esc(word)}</span>`).join(' ')}</h1>
      <div class="cover-foot">
        <p class="identity">${esc(pick(h, 'title'))}, ${esc(subtitle)}</p>
        <p class="bio">${esc(pick(home, 'bio'))}</p>
      </div>
    `, 'panel--cover');

    if (pick(h, 'statement')) add(`<p class="statement">${esc(pick(h, 'statement'))}</p>`, 'panel--statement');

    const entries = [
      ...(featured.destacat ? [featured] : []),
      ...highlighted(projectes.projects),
      ...highlighted(festivals.festivals),
      ...highlighted(obres.works).filter((w) => w !== work),
      ...highlighted(premis.awards),
      ...highlighted(home.featuredProjects),
      ...highlighted(home.currentProjects),
      ...highlighted(quisoc.timeline).map(rollItem),
      ...highlighted(agenda.events)
    ];
    let bio = quisoc.destacat ? `
      <div class="text">
        <div>${heading(pick(quisoc, 'title'))}</div>
        ${lead([strip(pick(quisoc, 'biography')), strip(pick(quisoc, 'education'))].filter(Boolean).join(' '))}
      </div>
    ` : '';

    let detailCount = 0;
    entries.forEach((item, i) => {
      const image = imageOf(item);
      const meta = metaOf(item);
      const leadText = strip(pick(item, 'description') || pick(item, 'content'));
      add(`
        <div class="text">
          <div>
            ${heading(pick(item, 'title'))}
            ${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
          </div>
          ${lead(leadText)}
        </div>
        ${image ? `<figure><img src="${esc(asset(image))}" alt="${esc(altOf(item))}"></figure>` : ''}
      `, `panel--media${i % 3 === 1 ? ' panel--side' : ''}`);
      const detail = detailOf(item, leadText);
      if (detail.body || detail.links) {
        add(
          `<div class="detail-inner"><div class="detail-body">${detail.body}</div>${detail.links}</div>`,
          `panel--detail${detailCount++ % 2 ? ' panel--detail--wide' : ''}`
        );
      }
      if (bio && i === 1) { add(bio, 'panel--bio'); bio = ''; }
    });
    if (bio) add(bio, 'panel--bio');

    add(`
      <ul class="press">
        ${highlighted(premsa.articles).slice(0, 3).map((article) => (
          `<li><span class="meta">${esc(article.publication)}, ${esc(String(pick(article, 'date') || '').slice(0, 4))}</span><a href="${esc(article.url)}">${esc(pick(article, 'title'))}</a></li>`
        )).join('')}
      </ul>
    `, 'panel--press');

    add(`
      <p class="end-cta">${esc(pick(s, 'cta'))}</p>
      <p class="end-mail"><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
      <p class="social">
        ${Object.values(social).map((item) => (
          `<a href="${esc(item.url)}">${esc(item.label)}</a>`
        )).join(' <span aria-hidden="true">·</span> ')}
      </p>
      <p class="colophon">${esc(s.description)} · ${esc(s.copyright)}</p>
      ${langLinks}
    `, 'panel--cover panel--end');

    roll.innerHTML = panels.join('');
    roll.querySelector('.panel--end').id = 'final';

    const max = parseFloat(getComputedStyle(roll.querySelector('.statement') || roll.querySelector('.text h2')).fontSize);
    roll.querySelectorAll('.panel--detail .detail-inner').forEach((inner) => fitBody(inner, max));

    measure();
    Promise.all([...roll.querySelectorAll('img')].map((img) => img.decode().catch(() => {}))).then(measure);
    requestAnimationFrame(frame);
  }

  init().catch((error) => {
    console.error(error);
    roll.innerHTML = '<section class="panel panel--cover"><h1>Adrián Salcedo Toca</h1><p>contacte@adriansalcedo.com</p></section>';
    measure();
    requestAnimationFrame(frame);
  });
})();

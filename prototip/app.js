(() => {
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
    const names = ['site', 'home', 'obres', 'projectes', 'festivals', 'premis', 'premsa', 'quisoc', 'agenda'];
    let sources;
    try {
      sources = await Promise.all(names.map(load));
    } catch (error) {
      console.warn('Prototip: JSON no accessible, faig servir la còpia local.', error);
      sources = names.map((name) => (window.PROTOTIP_DATA || {})[name] || {});
    }
    const [site, home, obres, projectes, festivals, premis, premsa, quisoc, agenda] = sources;

    const s = site.site || {};
    const h = home.hero || {};
    const fw = home.featuredWork || {};
    const subtitle = String(h.subtitle || '').replace(/^./, (c) => c.toLowerCase());
    const details = {};
    let detailId = 0;
    const heading = (title, detail) => {
      const name = String(title || '');
      const cls = name.length > 20 ? ' long' : '';
      if (!detail) return `<h2 class="${cls}">${esc(name)}</h2>`;
      const id = detailId++;
      details[id] = detail;
      return `<h2 class="${cls}"><button type="button" class="title-btn" data-detail="${id}" aria-expanded="false">${esc(name)}</button></h2>`;
    };
    const lead = (value) => {
      const body = String(value || '');
      return `<p class="lead${body.length > 140 ? ' long' : ''}">${esc(body)}</p>`;
    };

    const highlighted = (list) => (list || []).filter((item) => item.destacat);
    const imageOf = (item) => item.image || (item.images || [])[0]?.src;
    const altOf = (item) => item.imageAlt || (item.images || [])[0]?.alt || '';
    const metaOf = (item) => item.meta || [
      item.type || item.label || item.category,
      item.year || (item.date || '').slice(0, 4),
      item.publisher,
      item.venue
    ].filter(Boolean).join(', ');
    const strip = (value) => text(Array.isArray(value) ? value[0] : value);
    const rollItem = (item) => (item.label && !item.title
      ? { ...item, title: item.label, meta: String(item.year || '') }
      : item);
    const detailOf = (item) => {
      const paragraphs = Array.isArray(item.content) ? item.content : [];
      let body = paragraphs.length > 1 ? paragraphs.slice(1).join('') : '';
      if (item.contentList) body += (Array.isArray(item.contentList) ? item.contentList : [item.contentList]).map((x) => `<p>${x}</p>`).join('');
      if (item.closing) body += `<p>${item.closing}</p>`;
      const media = (item.images || []).slice(1)
        .map((i) => `<figure><img src="${esc(asset(i.src))}" alt="${esc(i.alt || '')}"></figure>`).join('');
      const videos = (item.videos || []).map((v) => `<p><a href="${esc(v.url)}">${esc(v.title || '')}</a></p>`).join('');
      return body + media + videos;
    };

    const panels = [];
    const add = (html, extra = '') => panels.push(
      `<section class="panel ${extra}${panels.length % 2 ? ' img-first' : ''}">${html}</section>`
    );

    add(`
      <h1>${(s.title || '').split(' ').map((word) => `<span>${esc(word)}</span>`).join(' ')}</h1>
      <div class="cover-foot">
        <p class="identity">${esc(h.title)}, ${esc(subtitle)}</p>
        <p class="bio">${esc(home.bio)}</p>
      </div>
    `, 'panel--cover');

    if (h.statement) add(`<p class="statement">${esc(h.statement)}</p>`, 'panel--statement');

    const entries = [
      ...(fw.destacat ? [fw] : []),
      ...highlighted(projectes.projects),
      ...highlighted(festivals.festivals),
      ...highlighted(obres.works),
      ...highlighted(premis.awards),
      ...highlighted(home.featuredProjects),
      ...highlighted(home.currentProjects),
      ...highlighted(quisoc.timeline).map(rollItem),
      ...highlighted(agenda.events)
    ];
    let bio = quisoc.destacat ? `
      <div class="text">
        <div>${heading(quisoc.title)}</div>
        ${lead([strip(quisoc.biography), strip(quisoc.education)].filter(Boolean).join(' '))}
      </div>
    ` : '';

    entries.forEach((item, i) => {
      const image = imageOf(item);
      const meta = metaOf(item);
      add(`
        <div class="text">
          <div>
            ${heading(item.title, detailOf(item))}
            ${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
          </div>
          ${lead(strip(item.description || item.content))}
        </div>
        ${image ? `<figure><img src="${esc(asset(image))}" alt="${esc(altOf(item))}"></figure>` : ''}
      `, 'panel--media');
      if (bio && i === 1) { add(bio, 'panel--bio'); bio = ''; }
    });
    if (bio) add(bio, 'panel--bio');

    add(`
      <ul class="press">
        ${highlighted(premsa.articles).slice(0, 3).map((article) => (
          `<li><span class="meta">${esc(article.publication)}, ${esc((article.date || '').slice(0, 4))}</span><a href="${esc(article.url)}">${esc(article.title)}</a></li>`
        )).join('')}
      </ul>
    `, 'panel--press');

    add(`
      <p class="end-cta">${esc(s.cta)}</p>
      <p class="end-mail"><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
      <p class="social">
        ${Object.values(site.social || {}).map((item) => (
          `<a href="${esc(item.url)}">${esc(item.label)}</a>`
        )).join(' <span aria-hidden="true">·</span> ')}
      </p>
      <p class="colophon">${esc(s.description)} · ${esc(s.copyright)}</p>
    `, 'panel--cover panel--end');

    roll.innerHTML = panels.join('');
    roll.querySelector('.panel--end').id = 'final';

    roll.addEventListener('click', (event) => {
      const button = event.target.closest('.title-btn');
      if (!button) return;
      const panel = button.closest('.panel');
      const id = button.dataset.detail;
      const open = roll.querySelector(`.panel--detail[data-for="${id}"]`);
      if (open) {
        open.remove();
        button.setAttribute('aria-expanded', 'false');
        measure();
        window.scrollTo({ top: Math.min(panel.offsetLeft, travel), behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      const detail = document.createElement('section');
      detail.className = 'panel panel--detail';
      detail.dataset.for = id;
      detail.innerHTML = `<div class="detail-body">${details[id]}</div>`;
      panel.after(detail);
      button.setAttribute('aria-expanded', 'true');
      measure();
      window.scrollTo({ top: Math.min(detail.offsetLeft, travel), behavior: reduceMotion ? 'auto' : 'smooth' });
    });

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

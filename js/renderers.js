const Renderers = {
  navList(data, lang) {
    return data.nav.map(item => {
      const label = lang === 'en' ? (item.label_en || item.label) : item.label;
      return `<li><a class="nav-link${item.path === '/' ? ' active' : ''}" href="${item.path}">${label}</a></li>`;
    }).join('\n');
  },

  socialIcon(key) {
    const icons = {
      instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>',
      twitter: '<path d="M4 4 L20 20 M20 4 L4 20" fill="none" stroke="currentColor" stroke-width="1.8"/>',
      youtube: '<rect x="2.5" y="6" width="19" height="12" rx="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.2 9.6 L15 12 L10.2 14.4 Z" fill="currentColor"/>',
      tiktok: '<path d="M9.5 4.5 v8.2 a3.3 3.3 0 1 0 3.3 3.3 V4.5 h6.2 v2.6 a6 6 0 0 1 -6.2 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      goodreads: '<path d="M12 7.4 C10.5 6 8.5 5.5 5 5.5 V17.8 C8.5 17.8 10.5 18.3 12 19.6 C13.5 18.3 15.5 17.8 19 17.8 V5.5 C15.5 5.5 13.5 6 12 7.4 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.4 V19.6" fill="none" stroke="currentColor" stroke-width="1.2"/>',
      wikipedia: '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.6 8 L8 16.4 L12 10.6 L16 16.4 L18.4 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
      wikidata: '<path d="M5.5 18.5 V12.5 M9.8 18.5 V6.5 M14.2 18.5 V10.5 M18.5 18.5 V15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/>'
    };
    return `<svg class="social-icon" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">${icons[key] || ''}</svg>`;
  },

  socialLinks(data) {
    return Object.entries(data.social).map(([key, s]) =>
      `<a href="${s.url}" target="_blank" rel="noopener noreferrer me" class="social-link" aria-label="${s.label}" title="${s.label}">${this.socialIcon(s.icon || key)}<span class="social-label">${s.label}</span></a>`
    ).join('\n');
  },

  breadcrumb(items) {
    const parts = items.map((item, i) => {
      if (i === items.length - 1) return `<span>${item.label}</span>`;
      return `<a href="${item.url}">${item.label}</a>`;
    });
    return `<nav class="breadcrumb" aria-label="breadcrumb">${parts.join('<span class="sep">/</span>')}</nav>`;
  },

  itemList(items, basePath) {
    return items.map(item =>
      `<li><a class="item-link" href="${basePath}/${item.id}">${item.title}</a></li>`
    ).join('\n');
  },

  reviews(reviews, lang) {
    if (!reviews || !reviews.length) return '';
    const isEn = lang === 'en';
    return `
      <div class="reviews-container">
        <h3>${isEn ? 'Critical reception' : 'Recepció crítica'}</h3>
        ${reviews.map(r => `
          <div class="review-item">
            <p class="review-text">"${r.text}"</p>
            <p class="review-author">${r.author} <span>— ${r.role}</span></p>
          </div>
        `).join('')}
      </div>`;
  },

  contributors(list, lang) {
    if (!list || !list.length) return '';
    const isEn = lang === 'en';
    return `<div class="credits-line">
      <h4 class="section-label">${isEn ? 'Contributors' : 'Col·laboradors'}</h4>
      <div class="meta-line">${list.map(c => `<span class="meta-chip">${c}</span>`).join('')}</div>
    </div>`;
  },

  images(imgs, lang) {
    if (!imgs || !imgs.length) return '';
    const isEn = lang === 'en';
    const m = i => ({ ...i, alt: isEn ? (i.alt_en || i.alt) : i.alt });
    if (imgs.length === 2) {
      return `<div class="image-pair">
        ${imgs.map(i => `<img src="${i.src}" alt="${m(i).alt || ''}" loading="lazy" style="width: ${i.width || '100%'}; height: auto;" />`).join('')}
      </div>`;
    }
    return imgs.map(i =>
      `<p><img src="${i.src}" alt="${m(i).alt || ''}" loading="lazy" style="max-width: ${i.width || '100%'}; height: auto; margin: 15px 0;" /></p>`
    ).join('\n');
  },

  videos(vids, lang) {
    if (!vids || !vids.length) return '';
    const isEn = lang === 'en';
    return vids.map(v =>
      `      <div style="padding-bottom: 10px;">
        <iframe width="${v.width || 560}" height="${v.height || 315}"
          data-src="${v.url}"
          title="${isEn ? (v.title_en || v.title) : (v.title || '')}"
          loading="lazy"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen></iframe>
      </div>`
    ).join('\n');
  },

  paragraphs(paragraphs) {
    if (!paragraphs || !paragraphs.length) return '';
    return paragraphs.map(p => `<p>${p}</p>`).join('\n');
  },

  contentList(items) {
    if (!items || !items.length) return '';
    return `<ul class="item-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  },

  links(links, lang) {
    if (!links || !links.length) return '';
    const isEn = lang === 'en';
    return `<div class="item-links" style="margin: 25px 0;">
      <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.62; margin: 0 0 12px 0;">${isEn ? 'Read more' : 'Llegeix-ne més'}</h4>
      ${links.map(l =>
        `<a href="${l.url}" class="inline-link" target="_blank" rel="noopener">${isEn ? (l.label_en || l.label) : l.label} \u2192</a>`
      ).join(' \u00B7 ')}
    </div>`;
  },

  buyLinks(list, lang, anchorId) {
    if (!list || !list.length) return '';
    const isEn = lang === 'en';
    return `<div class="buy-links" id="${anchorId || 'comprar'}" style="margin: 25px 0;">
      <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.62; margin: 0 0 12px 0;">${isEn ? 'Where to buy' : 'On comprar-lo'}</h4>
      ${list.map(l => `
        <p style="margin: 6px 0;">
          <a href="${l.url}" class="inline-link" target="_blank" rel="noopener">${isEn ? (l.label_en || l.label) : l.label} \u2192</a>
        </p>`).join('')}
    </div>`;
  },

  timeline(events, lang) {
    if (!events || !events.length) return '';
    const isEn = lang === 'en';
    return `<div class="timeline">${events.map(e => `
      <div class="timeline-event">
        <div class="timeline-year">${e.year}</div>
        <div class="timeline-label">${isEn ? (e.label_en || e.label) : e.label}</div>
        <div class="timeline-desc">${isEn ? (e.description_en || e.description) : e.description}</div>
      </div>
    `).join('')}</div>`;
  },

  pressItems(articles, isEn) {
    if (!articles || !articles.length) return '';
    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    const readLabel = isEn ? 'Read' : 'Llegir';
    return sorted.map(a => `
      <div class="press-item">
        <div class="press-meta">${a.date} · ${a.publication} · ${a.type}</div>
        <div class="press-title">${a.title}</div>
        ${a.url ? `<div class="press-publication"><a href="${a.url}" class="inline-link" target="_blank" rel="noopener">${readLabel}</a></div>` : ''}
      </div>
    `).join('');
  },

  performances(list) {
    if (!list || !list.length) return '';
    return list.map(p => `
      <div class="performance-item">
        <div class="performance-date">${p.date}</div>
        <div class="performance-type">${p.type}</div>
        <h3>${p.title}</h3>
        <p><em>${p.venue}</em></p>
        <p>${p.description}</p>
      </div>
    `).join('');
  },

  _pick(obj, key, lang) {
    if (!obj) return '';
    const enKey = key + '_en';
    return lang === 'en' && obj[enKey] ? obj[enKey] : obj[key];
  },

  blocks(blocks, lang) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(b => this.block(b, lang)).join('\n');
  },

  block(b, lang) {
    if (!b || !b.type) return '';
    switch (b.type) {
      case 'heading':
        return `<h4 class="block-heading">${this._pick(b, 'text', lang)}</h4>`;
      case 'prose': {
        const text = this._pick(b, 'text', lang);
        const arr = Array.isArray(text) ? text : (text ? [text] : []);
        return arr.map(t => `<p>${t}</p>`).join('\n');
      }
      case 'poem': {
        const lines = lang === 'en' && Array.isArray(b.lines_en) && b.lines_en.length ? b.lines_en : (Array.isArray(b.lines) ? b.lines : []);
        if (!lines.length) return '';
        return `<div class="poem-block">
        ${lines.map(l => `<p class="poem-line">${l}</p>`).join('\n')}
      </div>`;
      }
      case 'quote': {
        const text = this._pick(b, 'text', lang);
        if (!text) return '';
        const author = b.author || '';
        const role = b.role || '';
        return `<div class="review-item">
        <p class="review-text">"${text}"</p>
        ${author ? `<p class="review-author">${author}${role ? ` <span>— ${role}</span>` : ''}</p>` : ''}
      </div>`;
      }
      case 'image':
        return `<p><img src="${b.src}" alt="${this._pick(b, 'alt', lang) || ''}" loading="lazy" style="max-width: ${b.width || '100%'}; height: auto; margin: 15px 0;" /></p>`;
      case 'gallery':
        return this.images(b.images, lang);
      case 'video':
        return `<div style="padding-bottom: 10px;">
        <iframe width="${b.width || 560}" height="${b.height || 315}" data-src="${b.url}" title="${this._pick(b, 'title', lang) || ''}" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>`;
      case 'audio':
        return `<div style="padding-bottom: 10px;">
        <audio controls preload="none" src="${b.url}">${this._pick(b, 'title', lang) || ''}</audio>
      </div>`;
      case 'links': {
        const items = b.items || [];
        if (!items.length) return '';
        return `<div class="item-links" style="margin: 25px 0;">
        <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.62; margin: 0 0 12px 0;">${lang === 'en' ? 'Read more' : 'Llegeix-ne més'}</h4>
        ${items.map(l => `<a href="${l.url}" class="inline-link" target="_blank" rel="noopener">${this._pick(l, 'label', lang)} \u2192</a>`).join(' \u00B7 ')}
      </div>`;
      }
      case 'buy': {
        const items = b.items || [];
        if (!items.length) return '';
        return `<div class="buy-links" style="margin: 25px 0;">
        <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.62; margin: 0 0 12px 0;">${lang === 'en' ? 'Where to buy' : 'On comprar-lo'}</h4>
        ${items.map(l => `<p style="margin: 6px 0;"><a href="${l.url}" class="inline-link" target="_blank" rel="noopener">${this._pick(l, 'label', lang)} \u2192</a></p>`).join('')}
      </div>`;
      }
      case 'list': {
        const items = (lang === 'en' && b.items_en && b.items_en.length ? b.items_en : b.items) || [];
        if (!items.length) return '';
        return `<ul class="item-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      }
      case 'meta': {
        const items = b.items || [];
        if (!items.length) return '';
        return `<div class="meta-line">${items.map(m => `<span class="meta-chip">${this._pick(m, 'label', lang)}: ${m.value}</span>`).join('')}</div>`;
      }
      case 'credits': {
        const items = b.items || [];
        if (!items.length) return '';
        return `<div class="credits-line" style="margin: 20px 0;">
        <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.62; margin: 0 0 10px 0;">${this._pick(b, 'title', lang) || (lang === 'en' ? 'Credits' : 'Crèdits')}</h4>
        <div class="meta-line">${items.map(c => `<span class="meta-chip">${c}</span>`).join('')}</div>
      </div>`;
      }
      default:
        return '';
    }
  },

  formatDate(dateStr, lang) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return dateStr;
    }
  },

  kindLabel(type, isEn) {
    const map = {
      publication: ['Publicació', 'Publication'],
      videopoem: ['Vídeopoema', 'Videopoem'],
      installation: ['Instal·lació', 'Installation'],
      digital: ['Digital', 'Digital'],
      recital: ['Recital', 'Recital'],
      exhibition: ['Exposició', 'Exhibition'],
      intervention: ['Intervenció', 'Intervention'],
      festival: ['Festival', 'Festival'],
      workshop: ['Taller', 'Workshop'],
      lecture: ['Conferència', 'Lecture'],
      audiovisual: ['Audiovisual', 'Audiovisual']
    };
    if (map[type]) return isEn ? map[type][1] : map[type][0];
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  },

  bibliography(items, lang, title) {
    const isEn = lang === 'en';
    const sorted = [...(items || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
    return `<h2>${title}</h2>
      ${sorted.map(it => {
        const t = this._pick(it, 'title', lang);
        const type = this._pick(it, 'type', lang);
        const pub = this._pick(it, 'publisher', lang);
        const role = this._pick(it, 'role', lang);
        const desc = this._pick(it, 'description', lang);
        return `
        <div class="bibliografia-item">
          <div class="bibliografia-year">${it.year || ''}</div>
          <div class="bibliografia-info">
            <h3>${t}</h3>
            <div class="bibliografia-meta">${[type, pub, role].filter(Boolean).join(' · ')}</div>
            ${desc ? `<p class="bibliografia-desc">${desc}</p>` : ''}
            ${it.url ? `<a class="inline-link" href="${it.url}" target="_blank" rel="noopener">${isEn ? 'See more \u2192' : 'Veure m\u00E9s \u2192'}</a>` : ''}
          </div>
        </div>`;
      }).join('')}`;
  },

  agenda(events, lang, title, desc) {
    const isEn = lang === 'en';
    const today = new Date().toISOString().slice(0, 10);
    const list = (events || []).map(e => ({ ...e, _date: e.date || '9999-12-31' }));
    const upcoming = list.filter(e => e._date >= today).sort((a, b) => a._date.localeCompare(b._date));
    const past = list.filter(e => e._date < today).sort((a, b) => b._date.localeCompare(a._date));

    const item = e => `
      <div class="agenda-item">
        <div class="agenda-date">${e.date ? this.formatDate(e.date, lang) : (isEn ? 'Date to be confirmed' : 'Data per confirmar')}</div>
        <div class="agenda-title">${this._pick(e, 'title', lang)}</div>
        <div class="agenda-venue">${[e.venue, e.city, e.time].filter(Boolean).join(' · ')}</div>
        ${e.description ? `<p>${this._pick(e, 'description', lang)}</p>` : ''}
        ${e.url ? `<a class="inline-link" href="${e.url}" target="_blank" rel="noopener">${isEn ? 'More info \u2192' : 'M\u00E9s informaci\u00F3 \u2192'}</a>` : ''}
      </div>`;

    let body = '';
    if (upcoming.length) {
      body += `<h3 class="agenda-section-label">${isEn ? 'Upcoming' : 'Properes'}</h3>${upcoming.map(item).join('')}`;
    }
    if (past.length) {
      body += `<h3 class="agenda-section-label">${isEn ? 'Past' : 'Passades'}</h3>${past.map(item).join('')}`;
    }
    if (!body) {
      body = `<p style="opacity: 0.65;">${isEn ? 'No public events scheduled at the moment.' : 'No hi ha lectures o actuacions programades de moment.'}</p>`;
    }

    return `<h2>${title}</h2>
      ${desc ? `<p>${desc}</p>` : ''}
      <div class="agenda-list">${body}</div>`;
  },

  contact(data, lang, opts) {
    const isEn = lang === 'en';
    const o = opts || {};
    const title = isEn ? (data.title_en || data.title) : data.title;
    const intro = isEn ? (data.intro_en || data.intro) : data.intro;
    const email = data.email || o.email || '';
    return `<h2>${title}</h2>
      ${intro ? `<p class="contact-intro">${intro}</p>` : ''}
      ${email ? `<p class="contact-mail"><a href="mailto:${email}">${email}</a></p>` : ''}
      ${o.social ? `<div class="contact-block">
        <h3 class="section-label">${isEn ? 'You can also find me on' : 'Tamb\u00E9 em pots trobar a'}</h3>
        ${this.socialLinks({ social: o.social })}
      </div>` : ''}
      ${o.cv ? `<p style="margin-top: 30px;"><a class="download-link" href="${o.cv}" target="_blank" rel="noopener">${isEn ? 'Download CV' : 'Descarregar CV'}</a></p>` : ''}`;
  },

  archive(src, lang, prefix) {
    const isEn = lang === 'en';
    const catalog = [];
    const push = (label, href, kind, year) => {
      if (label) catalog.push({ label, href: href || null, kind: kind || '', year: year || '' });
    };
    ((src && src.obres && src.obres.works) || []).forEach(w => push(this._pick(w, 'title', lang), `${prefix}/obres/${w.id}`, this.kindLabel(w.type, isEn), w.year));
    ((src && src.festivals && src.festivals.festivals) || []).forEach(f => push(this._pick(f, 'title', lang), `${prefix}/festivals/${f.id}`, this.kindLabel(f.label || f.type, isEn), f.year));
    ((src && src.premis && src.premis.awards) || []).forEach(a => push(this._pick(a, 'title', lang), `${prefix}/premis/${a.id}`, isEn ? 'Award' : 'Premi', a.year));
    ((src && src.projectes && src.projectes.projects) || []).forEach(p => push(this._pick(p, 'title', lang), `${prefix}/projectes/${p.id}`, isEn ? 'Project' : 'Projecte', p.year));
    ((src && src.bibliografia && src.bibliografia.items) || []).forEach(i => push(this._pick(i, 'title', lang), i.url || null, isEn ? 'Bibliography' : 'Bibliografia', i.year));

    const kinds = [...new Set(catalog.map(c => c.kind).filter(Boolean))].sort();
    const years = [...new Set(catalog.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

    window.__archiveCatalog = catalog;

    const row = c => `
      <li class="archive-item">
        ${c.href ? `<a class="item-link" href="${c.href}">${c.label}</a>` : `<span>${c.label}</span>`}
        <span class="archive-meta">${[c.kind, c.year].filter(Boolean).join(' \u00B7 ')}</span>
      </li>`;

    const sortedAll = [...catalog].sort((a, b) => String(b.year).localeCompare(String(a.year)));

    window.__archiveRender = function () {
      const listEl = document.getElementById('archive-list');
      if (!listEl) return;
      const kindEl = document.getElementById('archive-kind');
      const yearEl = document.getElementById('archive-year');
      const k = kindEl ? kindEl.value : '';
      const y = yearEl ? yearEl.value : '';
      const rows = window.__archiveCatalog.filter(c => (!k || c.kind === k) && (!y || String(c.year) === y));
      rows.sort((a, b) => String(b.year).localeCompare(String(a.year)));
      listEl.innerHTML = rows.length
        ? `<ul class="archive-list">${rows.map(row).join('')}</ul>`
        : `<p style="opacity: 0.65;">${isEn ? 'No results.' : 'Cap resultat.'}</p>`;
    };

    return `
      <div class="filter-bar">
        <label class="filter-label" for="archive-kind">${isEn ? 'Type' : 'Tipus'}</label>
        <select id="archive-kind" class="filter-select" aria-label="${isEn ? 'Filter by type' : 'Filtra per tipus'}">
          <option value="">${isEn ? 'All' : 'Tots'}</option>
          ${kinds.map(k => `<option value="${k}">${k}</option>`).join('')}
        </select>
        <label class="filter-label" for="archive-year">${isEn ? 'Year' : 'Any'}</label>
        <select id="archive-year" class="filter-select" aria-label="${isEn ? 'Filter by year' : 'Filtra per any'}">
          <option value="">${isEn ? 'All' : 'Tots'}</option>
          ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
      </div>
      <div class="archive-wrap"><div id="archive-list"><ul class="archive-list">${sortedAll.map(row).join('')}</ul></div></div>`;
  },

  home(data, lang) {
    const isEn = lang === 'en';
    const h = data.hero;
    const fw = data.featuredWork;
    const projects = data.featuredProjects || [];
    const bio = isEn ? (data.bio_en || data.bio) : (data.bio || '');
    const manifesto = isEn ? (data.manifesto_en || data.manifesto) : (data.manifesto || '');
    const currentProjects = data.currentProjects || [];

    const featuredLink = isEn ? (fw.link_en || fw.link || '/en/obres/obra-crit') : (fw.link || '/obres/obra-crit');
    const bioLink = isEn ? '/en/quisoc' : '/quisoc';
    const contactLink = isEn ? '/en/contacte' : '/contacte';
    const workSlug = (featuredLink.split('/').filter(Boolean).pop() || '');
    const buyLink = /^(https?:)?\/\//.test(featuredLink) || !workSlug ? '' : `${featuredLink}#comprar-${workSlug}`;

    let projectCards = '';
    projects.forEach(p => {
      const link = isEn ? (p.link_en || p.link || '#') : (p.link || '#');
      const title = isEn ? (p.title_en || p.title) : p.title;
      const desc = isEn ? (p.description_en || p.description) : p.description;
      projectCards += `
        <div class="project-card">
          <h3>${title}</h3>
          <p>${desc}</p>
          <a href="${link}" class="inline-link">${isEn ? 'Explore \u2192' : 'Explorar \u2192'}</a>
        </div>`;
    });

    let currentHtml = '';
    if (currentProjects.length) {
      currentHtml = `
        <div class="home-current" id="home-current">
          <h2 class="section-label">${isEn ? 'Now' : 'Ara'}</h2>
          ${currentProjects.map(p => {
            const title = isEn ? (p.title_en || p.title) : p.title;
            const desc = isEn ? (p.description_en || p.description) : p.description;
            const status = p.status ? `<span class="current-status">${p.status}</span>` : '';
            return `
              <div class="current-project-item">
                ${status}
                <h3>${title}</h3>
                <p>${desc}</p>
              </div>`;
          }).join('')}
        </div>`;
    }

    let manifestoHtml = '';
    if (manifesto) {
      manifestoHtml = `
        <div class="manifesto" id="home-manifesto">
          <p>${manifesto}</p>
        </div>`;
    }

    return `
      <div class="hero" id="home-hero">
        <h2 class="hero-title" id="hero-title">${isEn ? (h.title_en || h.title) : h.title}</h2>
        <p class="hero-subtitle" id="hero-subtitle">${isEn ? (h.subtitle_en || h.subtitle) : h.subtitle}</p>
        <div class="hero-statement" id="hero-statement">
          <p>${isEn ? (h.statement_en || h.statement) : h.statement}</p>
        </div>
      </div>

      ${manifestoHtml}

      <div class="home-featured" id="home-featured">
        <h2 class="section-label">${isEn ? 'Featured work' : 'Obra destacada'}</h2>
        <div class="featured-block">
          <div class="featured-info">
            <h3>${isEn ? (fw.title_en || fw.title) : fw.title}</h3>
            <p class="featured-meta">${isEn ? (fw.type_en || fw.type) : fw.type} \u00B7 ${fw.publisher} \u00B7 ${fw.year}</p>
            <p>${isEn ? (fw.description_en || fw.description) : fw.description}</p>
            <span class="cta-row">
              <a href="${featuredLink}" class="inline-link">${isEn ? 'Read more \u2192' : 'Llegir-ne m\u00E9s \u2192'}</a>
              ${buyLink ? `<a href="${buyLink}" class="inline-link">${isEn ? 'Where to buy \u2192' : 'On comprar-lo \u2192'}</a>` : ''}
            </span>
          </div>
          <div class="featured-image">
            <img src="${fw.image}" alt="${isEn ? (fw.imageAlt_en || fw.imageAlt || '') : (fw.imageAlt || '')}" loading="lazy" />
          </div>
        </div>
      </div>

      ${currentHtml}

      <div class="home-projects" id="home-projects">
        <h2 class="section-label">${isEn ? 'Projects' : 'Projectes'}</h2>
        <div class="project-grid">${projectCards}</div>
      </div>

      <div class="home-bio" id="home-bio">
        <p>${bio}</p>
        <span class="cta-row">
          <a href="${bioLink}" class="inline-link">${isEn ? 'Full biography \u2192' : 'Biografia completa \u2192'}</a>
          <a href="${contactLink}" class="inline-link">${isEn ? 'Contact \u2192' : 'Contacte \u2192'}</a>
        </span>
      </div>`;
  },

  festivalDetail(f, lang) {
    const isEn = lang === 'en';
    return `
      <a href="${isEn ? '/en/festivals' : '/festivals'}" class="back-link">\u2190 ${isEn ? 'back' : 'enrere'}</a>
      <h3>${isEn ? (f.title_en || f.title) : f.title}</h3>
      <div class="performance-type" style="margin-bottom:15px;">${f.label || f.type || 'recital'}</div>
      <p class="featured-meta" style="margin-bottom:15px;">${f.year}</p>
      ${Renderers.paragraphs(isEn ? (f.content_en || f.content) : f.content)}
      ${(f.contentList_en || f.contentList) ? Renderers.contentList(isEn ? (f.contentList_en || f.contentList) : f.contentList) : ''}
      ${Renderers.images(f.images, lang)}
      ${Renderers.videos(f.videos, lang)}`;
  }
};

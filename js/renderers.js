const Renderers = {
  navList(data, lang) {
    return data.nav.map(item => {
      const label = lang === 'en' ? (item.label_en || item.label) : item.label;
      return `<li><a class="nav-link${item.path === '/' ? ' active' : ''}" href="${item.path}">${label}</a></li>`;
    }).join('\n');
  },

  socialLinks(data) {
    return Object.values(data.social).map(s =>
      `<a href="${s.url}" target="_blank" rel="noopener noreferrer me"><i class="${s.icon}"></i></a>`
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

  reviews(reviews) {
    if (!reviews || !reviews.length) return '';
    return `
      <div class="reviews-container">
        <h3>Recepció crítica i lletres</h3>
        ${reviews.map(r => `
          <div class="review-item">
            <p class="review-text">"${r.text}"</p>
            <p class="review-author">${r.author} <span>— ${r.role}</span></p>
          </div>
        `).join('')}
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
      `<div style="padding-bottom: 10px;">
        <iframe width="${v.width || 560}" height="${v.height || 315}"
          src="${v.url}"
          title="${isEn ? (v.title_en || v.title) : (v.title || '')}"
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
            <a href="${featuredLink}" class="inline-link">${isEn ? 'Read more \u2192' : 'Llegir-ne m\u00E9s \u2192'}</a>
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
        <a href="${bioLink}" class="inline-link">${isEn ? 'Full biography \u2192' : 'Biografia completa \u2192'}</a>
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

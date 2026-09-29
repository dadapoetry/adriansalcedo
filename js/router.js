const App = {
  lang: 'ca',
  siteData: null,
  seoData: null,
  homeSeo: null,
  navTitles: null,
  _prevLang: null,

  async init() {
    this.detectLang();
    const [site, seo, home, siteCa] = await Promise.all([
      ContentLoader.loadSite(this.lang),
      ContentLoader.load('/content/seo.json'),
      ContentLoader.load('/content/home.json'),
      ContentLoader.load('/content/site.json')
    ]);
    this.siteData = site;
    this.seoData = seo;
    this.homeSeo = (home && home.seo) || null;
    this.navTitles = {};
    for (const item of (siteCa && siteCa.nav) || []) {
      if (!item || !item.id) continue;
      this.navTitles[item.id] = {
        ca: item.seo_title || item.label || null,
        en: item.seo_title_en || item.label_en || item.label || null
      };
    }
    if (this.siteData) this.renderShell();
    this.handleRouting();
    this.bindEvents();
  },

  sectionTitle(section) {
    const fromSeo = this.navTitles && this.navTitles[section];
    if (fromSeo && fromSeo[this.lang]) return fromSeo[this.lang];
    const nav = (this.siteData && this.siteData.nav) || [];
    const item = nav.find((n) => n.id === section)
      || nav.find((n) => (n.path || '').replace(/^\/en/, '') === '/' + section);
    if (!item) return null;
    if (this.lang === 'en') return item.seo_title_en || item.label_en || item.label || null;
    return item.seo_title || item.label || null;
  },

  sectionDescription(section) {
    const rows = (this.seoData && this.seoData.sections) || [];
    const row = rows.find((s) => s && s.key === section);
    if (!row) return null;
    return (this.lang === 'en' ? row.desc_en : row.desc) || null;
  },

  detectLang() {
    const path = window.location.pathname;
    if (path.startsWith('/en/') || path === '/en') {
      this.lang = 'en';
    } else {
      this.lang = 'ca';
    }
  },

  renderShell() {
    const navList = document.getElementById('nav-list');
    const socialList = document.getElementById('social-links');
    const footerText = document.getElementById('footer-text');
    const brandLink = document.querySelector('.brand-link');
    const searchTrigger = document.getElementById('search-trigger');

    if (navList && this.siteData) {
      navList.innerHTML = Renderers.navList(this.siteData, this.lang);
    }
    if (socialList && this.siteData) {
      socialList.innerHTML = Renderers.socialLinks(this.siteData);
    }
    const contactEl = document.getElementById('contact-email');
    if (contactEl && this.siteData) {
      const e = this.siteData.site.email;
      const cta = this.lang === 'en' ? (this.siteData.site.cta_en || '') : (this.siteData.site.cta || '');
      if (e) {
        contactEl.innerHTML = `<a href="mailto:${e}">${e}</a>${cta ? `<span class="contact-cta">${cta}</span>` : ''}`;
        contactEl.style.display = 'block';
      }
    }
    if (footerText && this.siteData) {
      footerText.innerHTML = this.siteData.site.copyright;
    }
    if (brandLink) {
      brandLink.href = this.lang === 'en' ? '/en' : '/';
    }
    const logoEl = document.getElementById('site-logo');
    if (logoEl && this.siteData.site.logo) {
      logoEl.innerHTML = `<img src="${this.siteData.site.logo}" alt="Adrián Salcedo Toca" class="site-logo-img" />`;
    }
    if (searchTrigger) {
      searchTrigger.href = this.lang === 'en' ? '/en/cerca' : '/cerca';
    }
  },

  async handleRouting() {
    this.detectLang();
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    let currentSection = segments[0] || 'home';
    if (currentSection === 'en') {
      currentSection = segments[1] || 'home';
    }
    if (currentSection === 'index.html' || currentSection === 'index') {
      currentSection = 'home';
    }
    const currentArticle = segments[2] || (segments[0] === 'en' ? segments[2] : segments[1]) || null;

    this.updateMeta(currentSection, currentArticle);
    await this.renderSection(currentSection, currentArticle);
    this.scrollToHash();

    const params = new URLSearchParams(window.location.search);
    if (currentSection === 'cerca' && params.has('q')) {
      setTimeout(async () => {
        await SearchEngine.performSearch(params.get('q'));
      }, 100);
    }
  },

  updateMeta(section, article) {
    const cleanUrl = window.location.pathname;
    const site = (this.siteData && this.siteData.site) || {};

    let pageTitle = site.title || 'Adrián Salcedo Toca';
    let pageDesc = site.description || '';

    if (article) {
      const fallbackTitle = article.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      pageTitle = `${fallbackTitle} | ${pageTitle}`;
    } else if (section === 'home' && this.homeSeo) {
      const seo = this.homeSeo;
      pageTitle = this.lang === 'en' ? (seo.title_en || seo.title || pageTitle) : (seo.title || pageTitle);
      pageDesc = this.lang === 'en' ? (seo.description_en || seo.description || pageDesc) : (seo.description || pageDesc);
    } else {
      const sectionTitle = this.sectionTitle(section);
      if (sectionTitle) {
        pageTitle = `${sectionTitle} | ${pageTitle}`;
        pageDesc = this.sectionDescription(section) || pageDesc;
      }
    }

    this._applyMetaTags(pageTitle, pageDesc, section, article, null);
  },

  updateArticleSEO(item, section) {
    if (!item) return;
    const isEn = this.lang === 'en';
    const seo = item.seo || {};

    let seoTitle = isEn ? (seo.title_en || seo.title) : seo.title;
    let seoDesc = isEn ? (seo.description_en || seo.description) : seo.description;

    if (seoTitle) {
      seoTitle = seoTitle + ' | Adrián Salcedo Toca';
    } else {
      const rawTitle = isEn ? (item.title_en || item.title) : item.title;
      seoTitle = rawTitle ? rawTitle + ' | Adrián Salcedo Toca' : null;
    }

    if (!seoDesc) {
      const raw = isEn ? (item.content_en || item.content) : item.content;
      if (raw) {
        const stripped = (Array.isArray(raw) ? raw.join(' ') : raw).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        seoDesc = stripped.slice(0, 300) || null;
      }
    }

    if (seoTitle || seoDesc) {
      const currentTitle = seoTitle || document.title;
      const currentDesc = seoDesc || '';
      this._applyMetaTags(currentTitle, currentDesc, section, item.id || true, item);
    }
  },

  _baseUrl() {
    return ((this.siteData && this.siteData.site && this.siteData.site.url) || 'https://adriansalcedo.com').replace(/\/$/, '');
  },

  _applyMetaTags(pageTitle, pageDesc, section, article, item) {
    const baseUrl = this._baseUrl();
    const cleanUrl = window.location.pathname;

    document.title = pageTitle;
    document.documentElement.lang = this.lang === 'en' ? 'en' : 'ca';

    const canonical = `${baseUrl}${cleanUrl}`;
    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) linkCanonical.setAttribute('href', canonical);

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
    if (ogUrl) ogUrl.setAttribute('content', canonical);
    if (ogLocale) ogLocale.setAttribute('content', this.lang === 'en' ? 'en_GB' : 'ca_ES');

    if (article) {
      if (ogType) ogType.setAttribute('content', 'article');
    } else {
      if (ogType) ogType.setAttribute('content', 'website');
    }

    if (!article && section === 'home') {
      if (ogImage) ogImage.setAttribute('content', `${baseUrl}/media/images/sat.png`);
    }

    const twCard = document.querySelector('meta[name="twitter:card"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    if (twDesc) twDesc.setAttribute('content', pageDesc);
    if (!article && section === 'home') {
      if (twImage) twImage.setAttribute('content', `${baseUrl}/media/images/sat.png`);
    }

    this.injectStructuredData(section, article, pageTitle, pageDesc, canonical, item);
  },

  injectStructuredData(section, article, title, desc, canonical, item) {
    const baseUrl = this._baseUrl();
    const isEn = this.lang === 'en';

    let schema = null;

    if (section === 'home' && !article) {
      schema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "name": title,
        "description": desc,
        "url": canonical,
        "mainEntity": {
          "@type": "Person",
          "name": "Adrián Salcedo Toca",
          "url": baseUrl
        }
      };
    } else if (section === 'contacte' && !article) {
      const email = (this.siteData && this.siteData.site && this.siteData.site.email) || '';
      schema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": title,
        "description": desc,
        "url": canonical,
        "mainEntity": {
          "@type": "Person",
          "name": (this.siteData && this.siteData.site && this.siteData.site.title) || "Adrián Salcedo Toca",
          "url": baseUrl,
          ...(email ? { "email": `mailto:${email}` } : {})
        }
      };
    } else if (section === 'obres' && !article) {
      schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": desc,
        "url": canonical,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Adrián Salcedo Toca",
          "url": baseUrl
        }
      };
    } else if (article) {
      const isWork = section === 'obres' && item;
      const crumbs = this._breadcrumbs(section, isEn, item);
      const isBook = isWork && !!item.isbn;
      const body = isWork ? {
        "@type": isBook ? "Book" : "CreativeWork",
        "name": isEn ? (item.title_en || item.title) : item.title,
        "author": { "@type": "Person", "name": "Adrián Salcedo Toca", "url": baseUrl },
        "inLanguage": "ca"
      } : {
        "@type": "Article",
        "headline": title,
        "author": { "@type": "Person", "name": "Adrián Salcedo Toca", "url": baseUrl },
        "publisher": { "@type": "Person", "name": "Adrián Salcedo Toca" }
      };
      if (isWork) {
        if (item.isbn) body.isbn = item.isbn;
        if (isBook && item.publisher) body.publisher = { "@type": "Organization", "name": item.publisher };
        if (item.year) body.datePublished = String(item.year);
        if (item.images && item.images[0] && item.images[0].src) {
          body.image = item.images[0].src.startsWith('http') ? item.images[0].src : baseUrl + item.images[0].src;
        }
      }
      body["@context"] = "https://schema.org";
      body.description = desc;
      body.url = canonical;
      body.isPartOf = {
        "@type": "WebSite",
        "name": "Adrián Salcedo Toca",
        "url": baseUrl
      };
      if (crumbs) body.breadcrumb = crumbs;
      schema = body;
    }

    const existingScript = document.getElementById('dynamic-schema');

    // sense schema per a aquesta pàgina: el del servidor ja no hi serveix
    if (!schema) {
      if (existingScript) existingScript.remove();
      return;
    }

    // el worker pot ja haver renderitzat el schema: el reutilitzem en lloc de duplicar-lo
    if (existingScript) {
      existingScript.textContent = JSON.stringify(schema);
      return;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'dynamic-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  },

  _breadcrumbs(section, isEn, item) {
    const baseUrl = this._baseUrl();
    const prefix = isEn ? '/en' : '';
    const nav = (this.siteData && this.siteData.nav) || [];
    const homeItem = nav.find((n) => n.id === 'home');
    const label = this.sectionTitle(section)
      || (isEn ? (homeItem && (homeItem.label_en || homeItem.label)) : (homeItem && homeItem.label))
      || section;
    const list = [
      { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Inici", item: baseUrl + (isEn ? "/en" : "/") },
      { "@type": "ListItem", position: 2, name: label, item: baseUrl + prefix + '/' + section }
    ];
    if (item && (item.title || item.title_en)) {
      list.push({ "@type": "ListItem", position: 3, name: isEn ? (item.title_en || item.title) : item.title, item: baseUrl + prefix + '/' + section + '/' + (item.id || '') });
    }
    return { "@type": "BreadcrumbList", itemListElement: list };
  },

  setMetaImage(src) {
    if (!src) return;
    const imageSrc = src.startsWith('http') ? src : `${this._baseUrl()}${src}`;
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twImage = document.querySelector('meta[name="twitter:image"]');
    const twCard = document.querySelector('meta[name="twitter:card"]');
    if (ogImage) ogImage.setAttribute('content', imageSrc);
    if (twImage) twImage.setAttribute('content', imageSrc);
    if (twCard) twCard.setAttribute('content', 'summary_large_image');
  },

  _references(isEn) {
    const social = (this.siteData && this.siteData.social) || {};
    const keys = ['goodreads', 'wikipedia', 'wikidata'];
    const items = keys.filter(k => social[k]).map(k => social[k]);
    if (!items.length) return '';
    return `<div class="references">
      <h3 class="section-label">${isEn ? 'References' : 'REFERÈNCIES'}</h3>
      <p>${items.map(s => `<a href="${s.url}" class="inline-link" target="_blank" rel="noopener">${s.label}</a>`).join(' \u00B7 ')}</p>
    </div>`;
  },

  scrollToHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    let target = null;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { target = null; }
    if (!target) return;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },

  activateMedia(scope) {
    const frames = (scope || document).querySelectorAll('iframe[data-src]');
    frames.forEach(f => {
      if (f.getAttribute('src')) return;
      f.setAttribute('src', f.getAttribute('data-src'));
    });
  },

  async renderSection(section, article) {
    const main = document.getElementById('main-content');
    const sections = main.querySelectorAll('.content-section');

    if (this._prevLang !== this.lang) {
      this.siteData = await ContentLoader.loadSite(this.lang);
      if (this.siteData) this.renderShell();
      this._prevLang = this.lang;
    }

    sections.forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    const navLinks = document.querySelectorAll('.nav-link');
    const sectionPath = this.lang === 'en' ? `/en/${section}` : section === 'home' ? (this.lang === 'en' ? '/en' : '/') : `/${section}`;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === sectionPath);
    });

    const langSwitchLinks = document.querySelectorAll('#lang-switch-mobile a');
    langSwitchLinks.forEach(a => {
      const lang = a.getAttribute('lang');
      a.classList.toggle('active', lang === this.lang);
      if (section === 'home') {
        if (lang === 'ca') a.href = '/';
        if (lang === 'en') a.href = '/en';
      } else if (article) {
        if (lang === 'ca') a.href = `/${section}/${article}`;
        if (lang === 'en') a.href = `/en/${section}/${article}`;
      } else {
        if (lang === 'ca') a.href = `/${section}`;
        if (lang === 'en') a.href = `/en/${section}`;
      }
    });

    let sectionEl = document.getElementById(`section-${section}`);

    if (!sectionEl) {
      sectionEl = document.createElement('section');
      sectionEl.id = `section-${section}`;
      sectionEl.className = 'content-section';

      const listLayer = document.createElement('div');
      listLayer.className = 'view-layer list-layer active';
      sectionEl.appendChild(listLayer);

      document.getElementById('main-content').appendChild(sectionEl);
    }

    const listLayer = sectionEl.querySelector('.list-layer');
    if (listLayer) {
      listLayer.innerHTML = '<p style="opacity:0.3;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;animation:pulse 1.2s ease-in-out infinite;">carregant...</p>';
    }

    await this.loadContent(section, sectionEl, article);

    sectionEl.style.display = 'block';
    sectionEl.classList.add('active');
    window.scrollTo(0, 0);

    const detailLayers = sectionEl.querySelectorAll('.detail-layer');

    if (!article) {
      if (listLayer) {
        listLayer.style.display = 'block';
        listLayer.classList.add('active');
      }
      detailLayers.forEach(d => {
        d.classList.remove('active');
        d.style.display = 'none';
      });
    } else {
      if (listLayer) {
        listLayer.classList.remove('active');
        listLayer.style.display = 'none';
      }
      detailLayers.forEach(d => {
        if (d.id === article) {
          d.style.display = 'block';
          d.classList.add('active');
        } else {
          d.classList.remove('active');
          d.style.display = 'none';
        }
      });
    }

    const activeLayer = sectionEl.querySelector('.view-layer.active');
    this.activateMedia(activeLayer || sectionEl);
  },

  async loadContent(section, sectionEl, article) {
    const listLayer = sectionEl.querySelector('.list-layer');
    if (!listLayer) return;

    const isEn = this.lang === 'en';
    const prefix = isEn ? '/en' : '';

    const validSections = ['home', 'quisoc', 'projectes', 'obres', 'festivals', 'premis', 'premsa', 'arxiu', 'cerca', 'bibliografia', 'agenda', 'contacte'];
    if (!validSections.includes(section)) {
      listLayer.innerHTML = `
        <div class="error-404">
          <h2>404</h2>
          <p>${isEn ? 'Page not found.' : 'Pàgina no trobada.'}</p>
          <p><a href="${isEn ? '/en' : '/'}" class="inline-link">${isEn ? 'Go home \u2192' : 'Tornar a l\'inici \u2192'}</a></p>
        </div>`;
      document.title = isEn ? 'Page not found | Adri\u00E1n Salcedo Toca' : 'P\u00E0gina no trobada | Adri\u00E1n Salcedo Toca';
      return;
    }

    let data = await ContentLoader.loadSection(section, this.lang);
    if (!data) {
      listLayer.innerHTML = '<p style="opacity:0.65;font-size:11px;">No s\'ha pogut carregar el contingut.</p>';
      return;
    }

    if (section === 'home') {
      listLayer.innerHTML = Renderers.home(data, this.lang);
    } else if (section === 'quisoc') {
      const title = isEn ? (data.title_en || data.title) : data.title;
      const bio = isEn ? (data.biography_en || data.biography) : data.biography;
      const perfs = isEn ? (data.performances_en || data.performances) : data.performances;
      const members = isEn ? (data.memberships_en || data.memberships) : data.memberships;
      const awtxt = isEn ? (data.awards_en || data.awards) : data.awards;
      const edu = isEn ? (data.education_en || data.education) : data.education;
      const statement = isEn ? (data.artistStatement_en || data.artistStatement) : data.artistStatement;
      const tlLabel = isEn ? 'Career trajectory' : 'Trajectòria';

      listLayer.innerHTML = `<h2>${title}</h2>
        ${data.portrait ? `<img src="${data.portrait}" alt="Portrait" style="display: block; max-width: 300px; height: auto; margin: 0 0 20px 0;" loading="lazy" />` : ''}
        ${Renderers.paragraphs(bio)}
        ${Renderers.paragraphs(perfs)}
        ${Renderers.paragraphs(members)}
        ${Renderers.paragraphs(awtxt)}
        ${Renderers.paragraphs(edu)}
        ${statement ? `<p><em>${statement}</em></p>` : ''}
        ${data.cv ? `<p><a href="${data.cv}" class="inline-link" target="_blank" rel="noopener">${isEn ? 'Download CV' : 'Descarregar CV'}</a></p>` : ''}
        ${this._references(isEn)}
        ${data.timeline ? `<div class="timeline-wrapper" style="margin-top: 40px; border-top: 1px dashed #e0e0e0; padding-top: 30px;"><h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.62; margin-bottom: 25px;">${tlLabel}</h3>${Renderers.timeline(data.timeline, this.lang)}</div>` : ''}`;
    } else if (section === 'projectes' && data.projects) {
      listLayer.innerHTML = `<h2>${isEn ? 'Projects' : 'Projectes'}</h2>
        <ul class="item-list">${data.projects.map(p => `<li><a class="item-link" href="${prefix}/projectes/${p.id}">${p.title}</a></li>`).join('')}</ul>`;

      data.projects.forEach(p => {
        let existing = sectionEl.querySelector(`#${p.id}`);
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'view-layer detail-layer';
          existing.id = p.id;
          sectionEl.appendChild(existing);
        }
        const body = (p.blocks && p.blocks.length)
          ? Renderers.blocks(p.blocks, this.lang)
          : `${p.image ? `<img src="${p.image}" style="max-width: ${p.imageWidth || '50%'}; height: auto; margin: 15px 0;" alt="${p.imageAlt || ''}" loading="lazy" />` : ''}
          ${Renderers.paragraphs(isEn ? (p.content_en || p.content) : p.content)}`;
        existing.innerHTML = `<a href="${prefix}/projectes" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${p.title}${p.issn ? ` (ISSN: ${p.issn})` : ''}</h3>
          ${body}`;
      });
      if (article) {
        const match = data.projects.find(p => p.id === article);
        if (match) this.updateArticleSEO(match, section);
      }
    } else if (section === 'obres' && data.works) {
      listLayer.innerHTML = `<h2>${isEn ? 'Works' : 'Obres'}</h2>
        <ul class="item-list">${data.works.map(w => `<li><a class="item-link" href="${prefix}/obres/${w.id}">${w.title}</a>${w.year ? `<span class="archive-meta">${[Renderers.kindLabel(w.type, isEn), w.year].filter(Boolean).join(' \u00B7 ')}</span>` : ''}</li>`).join('')}</ul>`;
      data.works.forEach(w => {
        let existing = sectionEl.querySelector(`#${w.id}`);
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'view-layer detail-layer';
          existing.id = w.id;
          sectionEl.appendChild(existing);
        }
        const ficha = [
          Renderers.kindLabel(w.type, isEn),
          w.publisher,
          w.year,
          w.isbn ? `ISBN: ${w.isbn}` : ''
        ].filter(Boolean).join(' \u00B7 ');
        const body = (w.blocks && w.blocks.length)
          ? Renderers.blocks(w.blocks, this.lang)
          : `${w.image_position === 'top' ? Renderers.images(w.images, this.lang) : ''}
          ${w.videos_position === 'top' ? Renderers.videos(w.videos, this.lang) : ''}
          ${Renderers.paragraphs(isEn ? (w.content_en || w.content) : w.content)}
          ${Renderers.links(w.links, this.lang)}
          ${w.image_position === 'middle' ? Renderers.images(w.images, this.lang) : ''}
          ${w.videos_position === 'middle' ? Renderers.videos(w.videos, this.lang) : ''}
          ${Renderers.buyLinks(w.buyLinks, this.lang, 'comprar-' + w.id)}
          ${w.image_position !== 'top' && w.image_position !== 'middle' ? Renderers.images(w.images, this.lang) : ''}
          ${w.videos_position !== 'top' && w.videos_position !== 'middle' ? Renderers.videos(w.videos, this.lang) : ''}
          ${Renderers.reviews(w.reviews, this.lang)}
          ${Renderers.contributors(w.contributors, this.lang)}`;
        existing.innerHTML = `<a href="${prefix}/obres" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${w.title}</h3>
          ${ficha ? `<p class="featured-meta">${ficha}</p>` : ''}
          ${body}`;
      });
      if (article) {
        const match = data.works.find(w => w.id === article);
        if (match) this.updateArticleSEO(match, section);
      }
    } else if (section === 'festivals' && data.festivals) {
      const sectionTitle = isEn ? (data.title_en || data.title || 'Festivals') : (data.title || 'Festivals');
      listLayer.innerHTML = `<h2>${sectionTitle}</h2>
          <ul class="item-list">${data.festivals.map(f => `<li><a class="item-link" href="${prefix}/festivals/${f.id}">${isEn ? (f.title_en || f.title) : f.title}</a></li>`).join('')}</ul>`;
      data.festivals.forEach(f => {
        let existing = sectionEl.querySelector(`#${f.id}`);
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'view-layer detail-layer';
          existing.id = f.id;
          sectionEl.appendChild(existing);
        }
        const body = (f.blocks && f.blocks.length)
          ? Renderers.blocks(f.blocks, this.lang)
          : `${f.label ? `<div class="performance-type">${f.label}</div>` : ''}
          ${Renderers.paragraphs(isEn ? (f.content_en || f.content) : f.content)}
          ${isEn ? ((f.contentList_en && f.contentList_en.length) ? Renderers.contentList(f.contentList_en) : (f.contentList && f.contentList.length ? Renderers.contentList(f.contentList) : '')) : ((f.contentList && f.contentList.length) ? Renderers.contentList(f.contentList) : '')}
          ${Renderers.images(f.images, this.lang)}
          ${Renderers.videos(f.videos, this.lang)}`;
        existing.innerHTML = `<a href="${prefix}/festivals" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${isEn ? (f.title_en || f.title) : f.title}</h3>
          ${body}`;
      });
      if (article) {
        const match = data.festivals.find(f => f.id === article);
        if (match) this.updateArticleSEO(match, section);
      }
    } else if (section === 'premis' && data.awards) {
      listLayer.innerHTML = `<h2>${isEn ? 'Awards' : 'Premis'}</h2>
        <ul class="item-list">${data.awards.map(a => `<li><a class="item-link" href="${prefix}/premis/${a.id}">${isEn ? (a.title_en || a.title) : a.title}</a></li>`).join('')}</ul>`;
      data.awards.forEach(a => {
        let existing = sectionEl.querySelector(`#${a.id}`);
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'view-layer detail-layer';
          existing.id = a.id;
          sectionEl.appendChild(existing);
        }
        const body = (a.blocks && a.blocks.length)
          ? Renderers.blocks(a.blocks, this.lang)
          : `<p class="featured-meta">${a.year} · ${a.category}</p>
          ${Renderers.paragraphs(isEn ? (a.content_en || a.content) : a.content)}
          ${Renderers.images(a.images, this.lang)}
          ${Renderers.videos(a.videos, this.lang)}`;
        existing.innerHTML = `<a href="${prefix}/premis" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${isEn ? (a.title_en || a.title) : a.title}</h3>
          ${body}`;
      });
      if (article) {
        const match = data.awards.find(a => a.id === article);
        if (match) this.updateArticleSEO(match, section);
      }
    } else if (section === 'premsa') {
      listLayer.innerHTML = `<h2>${isEn ? (data.title_en || data.title) : data.title}</h2>
        ${data.articles ? Renderers.pressItems(data.articles, isEn) : ''}`;
    } else if (section === 'contacte') {
      const qu = await ContentLoader.loadSection('quisoc');
      const site = this.siteData || {};
      listLayer.innerHTML = Renderers.contact(data, this.lang, {
        email: site.site ? site.site.email : '',
        cv: qu ? qu.cv : '',
        social: site.social || null
      });
    } else if (section === 'bibliografia' && data.items) {
      const title = isEn ? (data.title_en || data.title) : data.title;
      listLayer.innerHTML = Renderers.bibliography(data.items, this.lang, title);
    } else if (section === 'agenda') {
      const title = isEn ? (data.title_en || data.title) : data.title;
      const desc = isEn ? (data.description_en || data.description) : data.description;
      listLayer.innerHTML = Renderers.agenda(data.events || [], this.lang, title, desc);
    } else if (section === 'arxiu') {
      const title = isEn ? (data.title_en || data.title) : data.title;
      const [obres, festivals, premis, projectes, bibliografia] = await Promise.all([
        ContentLoader.load('obres'),
        ContentLoader.load('festivals'),
        ContentLoader.load('premis'),
        ContentLoader.load('projectes'),
        ContentLoader.load('bibliografia')
      ]);
      listLayer.innerHTML = `<h2>${title}</h2>
        <p>${data.description || ''}</p>
        ${Renderers.archive({ obres, festivals, premis, projectes, bibliografia }, this.lang, prefix)}
        ${data.tags && data.tags.length ? `<div class="tag-cloud">${data.tags.map(t => `<a href="/cerca?q=${t}" class="tag">${t}</a>`).join('')}</div>` : ''}`;
    }

    const firstImg = sectionEl.querySelector('img');
    if (firstImg && firstImg.src) this.setMetaImage(firstImg.src);
  },

  async navigateTo(path) {
    window.history.pushState(null, '', path);
    await this.handleRouting();
  },

  bindEvents() {
    document.addEventListener('click', async e => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/') && !link.target) {
        e.preventDefault();
        await this.navigateTo(link.getAttribute('href'));
      }
    });

    document.addEventListener('change', e => {
      if (e.target && (e.target.id === 'archive-kind' || e.target.id === 'archive-year')) {
        if (window.__archiveRender) window.__archiveRender();
      }
    });

    window.addEventListener('popstate', () => {
      this.handleRouting();
    });

    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    document.addEventListener('load', e => {
      if (e.target.tagName === 'IMG' && e.target.hasAttribute('loading')) {
        e.target.classList.add('loaded');
      }
    }, true);
  }
};

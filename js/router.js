const App = {
  lang: 'ca',
  siteData: null,
  _prevLang: null,
  sectionTitles: {
    'home': { ca: 'Inici — Poeta avantguardista', en: 'Home — Avant-garde poet' },
    'obres': { ca: 'Obres i poesia avantguardista', en: 'Works and avant-garde poetry' },
    'projectes': { ca: 'Projectes poètics', en: 'Poetic projects' },
    'festivals': { ca: 'Festivals i exposicions', en: 'Festivals and exhibitions' },
    'premis': { ca: 'Premis i reconeixements', en: 'Awards and recognition' },
    'quisoc': { ca: 'Qui soc', en: 'About' },
    'premsa': { ca: 'Premsa', en: 'Press' },
    'cerca': { ca: 'Cerca', en: 'Search' },
    'arxiu': { ca: 'Arxiu', en: 'Archive' }
  },

  async init() {
    this.detectLang();
    this.siteData = await ContentLoader.loadSite(this.lang);
    if (this.siteData) this.renderShell();
    this.handleRouting();
    this.bindEvents();
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
    if (footerText && this.siteData) {
      footerText.textContent = this.siteData.site.copyright;
    }
    if (brandLink) {
      brandLink.href = this.lang === 'en' ? '/en' : '/';
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
  },

  updateMeta(section, article) {
    let pageTitle = 'Adrián Salcedo Toca';
    let pageDesc = this.lang === 'en'
      ? 'Digital portfolio of Adrián Salcedo Toca, avant-garde poet and cultural critic.'
      : 'Portfoli digital d\'Adrián Salcedo Toca, poeta avantguardista i crític cultural.';

    if (article) {
      pageTitle = `${article.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | Adrián Salcedo Toca`;
    } else if (this.sectionTitles[section]) {
      pageTitle = `${this.sectionTitles[section][this.lang]} | Adrián Salcedo Toca`;
      pageDesc = this.lang === 'en'
        ? `Explore the ${this.sectionTitles[section].en.toLowerCase()} of Adrián Salcedo Toca.`
        : `Explora la secció de ${this.sectionTitles[section].ca.toLowerCase()} d'Adrián Salcedo Toca.`;
    }

    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);
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
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      let sectionPath;
      if (section === 'home') {
        sectionPath = this.lang === 'en' ? '/en' : '/';
      } else if (article) {
        sectionPath = this.lang === 'en' ? `/en/${section}/${article}` : `/${section}/${article}`;
      } else {
        sectionPath = this.lang === 'en' ? `/en/${section}` : `/${section}`;
      }
      link.classList.toggle('active', href === sectionPath);
    });

    const langSwitchLinks = document.querySelectorAll('#lang-switch a');
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

    const sectionEl = document.getElementById(`section-${section}`);

    if (!sectionEl) return;

    await this.loadContent(section, sectionEl);

    sectionEl.style.display = 'block';
    sectionEl.classList.add('active');
    window.scrollTo(0, 0);

    const listLayer = sectionEl.querySelector('.list-layer');
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
  },

  async loadContent(section, sectionEl) {
    const listLayer = sectionEl.querySelector('.list-layer');
    if (!listLayer) return;

    const isEn = this.lang === 'en';
    const prefix = isEn ? '/en' : '';

    let data = await ContentLoader.loadSection(section, this.lang);
    if (!data) return;

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
        <div class="about-body">
          <div class="calligram-shape"></div>
          ${data.portrait ? `<img src="${data.portrait}" alt="Portrait" style="max-width: 300px; height: auto; margin: 0 0 20px 0;" loading="lazy" />` : ''}
          ${Renderers.paragraphs(bio)}
          ${Renderers.paragraphs(perfs)}
          ${Renderers.paragraphs(members)}
          ${Renderers.paragraphs(awtxt)}
          ${Renderers.paragraphs(edu)}
          ${statement ? `<p><em>${statement}</em></p>` : ''}
          ${data.cv ? `<p><a href="${data.cv}" class="inline-link" target="_blank">${isEn ? 'Download CV' : 'Descarregar CV'}</a></p>` : ''}
        </div>
        ${data.timeline ? `<div class="timeline-wrapper" style="margin-top: 40px; border-top: 1px dashed #e0e0e0; padding-top: 30px;"><h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.5; margin-bottom: 25px;">${tlLabel}</h3>${Renderers.timeline(data.timeline, this.lang)}</div>` : ''}`;
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
        const content = isEn ? (p.content_en || p.content) : p.content;
        existing.innerHTML = `<a href="${prefix}/projectes" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${p.title}${p.issn ? ` (ISSN: ${p.issn})` : ''}</h3>
          ${p.image ? `<img src="${p.image}" style="max-width: ${p.imageWidth || '50%'}; height: auto; margin: 15px 0;" alt="${p.imageAlt || ''}" loading="lazy" />` : ''}
          ${Renderers.paragraphs(content)}`;
      });
    } else if (section === 'obres' && data.works) {
      listLayer.innerHTML = `<h2>${isEn ? 'Works' : 'Obres'}</h2>
        <ul class="item-list">${data.works.map(w => `<li><a class="item-link" href="${prefix}/obres/${w.id}">${w.title}</a></li>`).join('')}</ul>`;
      data.works.forEach(w => {
        let existing = sectionEl.querySelector(`#${w.id}`);
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'view-layer detail-layer';
          existing.id = w.id;
          sectionEl.appendChild(existing);
        }
        existing.innerHTML = `<a href="${prefix}/obres" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${w.title}</h3>
          ${Renderers.paragraphs(isEn ? (w.content_en || w.content) : w.content)}
          ${Renderers.images(w.images, this.lang)}
          ${Renderers.videos(w.videos, this.lang)}`;
      });
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
        existing.innerHTML = `<a href="${prefix}/festivals" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${isEn ? (f.title_en || f.title) : f.title}</h3>
          ${f.label ? `<div class="performance-type">${f.label}</div>` : ''}
          ${Renderers.paragraphs(isEn ? (f.content_en || f.content) : f.content)}
          ${isEn ? ((f.contentList_en && f.contentList_en.length) ? Renderers.contentList(f.contentList_en) : (f.contentList && f.contentList.length ? Renderers.contentList(f.contentList) : '')) : ((f.contentList && f.contentList.length) ? Renderers.contentList(f.contentList) : '')}
          ${Renderers.images(f.images, this.lang)}
          ${Renderers.videos(f.videos, this.lang)}`;
      });
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
        existing.innerHTML = `<a href="${prefix}/premis" class="back-link">← ${isEn ? 'back' : 'enrere'}</a>
          <h3>${isEn ? (a.title_en || a.title) : a.title}</h3>
          <p class="featured-meta">${a.year} · ${a.category}</p>
          ${Renderers.paragraphs(isEn ? (a.content_en || a.content) : a.content)}
          ${Renderers.images(a.images, this.lang)}
          ${Renderers.videos(a.videos, this.lang)}`;
      });
    } else if (section === 'premsa') {
      listLayer.innerHTML = `<h2>${isEn ? (data.title_en || data.title) : data.title}</h2>
        ${data.articles ? Renderers.pressItems(data.articles) : ''}`;
    } else if (section === 'arxiu') {
      const title = isEn ? (data.title_en || data.title) : data.title;
      listLayer.innerHTML = `<h2>${title}</h2>
        <p>${data.description || ''}</p>
        ${data.tags && data.tags.length ? `<div class="tag-cloud">${data.tags.map(t => `<a href="/arxiu?tag=${t}" class="tag">${t}</a>`).join('')}</div>` : ''}`;
    }
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

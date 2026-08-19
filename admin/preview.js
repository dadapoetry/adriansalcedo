/* ═══════════════════════════════════════════════════════════
   PREVIEW TEMPLATES
   Custom preview rendering for Decap CMS collections
   ═══════════════════════════════════════════════════════════ */

var h = React.createElement;

function getVal(entry, path, fallback) {
  try {
    var val = entry.getIn(['data'].concat(path));
    return val !== undefined && val !== null ? val : (fallback || '');
  } catch (e) {
    return fallback || '';
  }
}

function getAssetSrc(entry, path, getAsset) {
  try {
    var val = entry.getIn(['data'].concat(path));
    if (!val) return '';
    var asset = getAsset(val);
    return asset ? asset.toString() : '';
  } catch (e) {
    return '';
  }
}

function renderParagraphs(paragraphs) {
  if (!paragraphs || !paragraphs.size) return null;
  return paragraphs.map(function (p, i) {
    var text = typeof p === 'string' ? p : (p.get ? p.get('paragraph', '') : '');
    return h('p', { key: i }, text);
  }).toArray();
}

function renderList(items) {
  if (!items || !items.size) return null;
  return h('ul', {},
    items.map(function (item, i) {
      var text = typeof item === 'string' ? item : (item.get ? item.get('item', item.get('text', '')) : '');
      return h('li', { key: i }, text);
    }).toArray()
  );
}

function renderImages(images, getAsset) {
  if (!images || !images.size) return null;
  return images.map(function (img, i) {
    var src = '';
    var alt = '';
    if (img.get) {
      src = getAssetSrc({ getIn: function (p) { return img.get(p[1]); } }, ['src'], getAsset) || img.get('src', '');
      alt = img.get('alt', img.get('alt_en', ''));
    }
    if (!src) return null;
    return h('img', { key: i, src: src, alt: alt, style: { maxWidth: '100%', borderRadius: '6px', margin: '8px 0' } });
  }).toArray();
}

function renderSEO(entry, prefix) {
  var title = getVal(entry, [prefix, 'title'], getVal(entry, ['seo', 'title'], ''));
  var desc = getVal(entry, [prefix, 'description'], getVal(entry, ['seo', 'description'], ''));
  if (!title && !desc) return null;
  return h('div', { className: 'preview-seo' },
    h('h3', {}, 'SEO'),
    title ? h('p', { className: 'seo-title' }, title) : null,
    desc ? h('p', { className: 'seo-desc' }, desc) : null
  );
}


/* ─── OBRES (Works) ─── */
CMS.registerPreviewTemplate('obres', createClass({
  render: function () {
    var entry = this.props.entry;
    var works = entry.getIn(['data', 'works']);
    if (!works || !works.size) return h('div', { className: 'cms-preview' }, h('p', {}, 'Cap obra configurada.'));

    return h('div', { className: 'cms-preview' },
      h('h1', {}, 'Obres'),
      works.map(function (work, i) {
        var title = work.get('title', '');
        var type = work.get('type', '');
        var year = work.get('year', '');
        var content = work.get('content');
        var images = work.get('images');
        var seo = work.get('seo');

        return h('div', { key: i, style: { marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-subtle)' } },
          type ? h('span', { className: 'preview-tag' }, type) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          images ? renderImages(images, this.props.getAsset) : null,
          seo ? renderSEO(h, '', function () { return seo; }) : null
        );
      }.bind(this)).toArray()
    );
  }
}));


/* ─── FESTIVALS ─── */
CMS.registerPreviewTemplate('festivals', createClass({
  render: function () {
    var entry = this.props.entry;
    var festivals = entry.getIn(['data', 'festivals']);
    if (!festivals || !festivals.size) return h('div', { className: 'cms-preview' }, h('p', {}, 'Cap festival configurat.'));

    return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Festivals')),
      festivals.map(function (fest, i) {
        var title = fest.get('title', '');
        var label = fest.get('label', '');
        var year = fest.get('year', '');
        var content = fest.get('content');
        var contentList = fest.get('contentList');
        var images = fest.get('images');
        var videos = fest.get('videos');

        return h('div', { key: i, style: { marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-subtle)' } },
          label ? h('span', { className: 'preview-tag' }, label) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          contentList ? h('div', { className: 'preview-content' }, renderList(contentList)) : null,
          images ? renderImages(images, this.props.getAsset) : null,
          videos && videos.size ? h('div', { style: { marginTop: '12px' } },
            h('h3', {}, 'Vídeos'),
            videos.map(function (vid, vi) {
              var url = vid.get('url', '');
              var vtitle = vid.get('title', '');
              return url ? h('p', { key: vi, style: { color: 'var(--accent)' } }, vtitle || url) : null;
            }).toArray()
          ) : null
        );
      }.bind(this)).toArray()
    );
  }
}));


/* ─── PREMIS (Awards) ─── */
CMS.registerPreviewTemplate('premis', createClass({
  render: function () {
    var entry = this.props.entry;
    var awards = entry.getIn(['data', 'awards']);
    if (!awards || !awards.size) return h('div', { className: 'cms-preview' }, h('p', {}, 'Cap premi configurat.'));

    return h('div', { className: 'cms-preview' },
      h('h1', {}, 'Premis'),
      awards.map(function (award, i) {
        var title = award.get('title', '');
        var category = award.get('category', '');
        var year = award.get('year', '');
        var content = award.get('content');
        var images = award.get('images');

        return h('div', { key: i, style: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-subtle)' } },
          category ? h('span', { className: 'preview-tag' }, category) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          images ? renderImages(images, this.props.getAsset) : null
        );
      }.bind(this)).toArray()
    );
  }
}));


/* ─── PREMSA (Press) ─── */
CMS.registerPreviewTemplate('premsa', createClass({
  render: function () {
    var entry = this.props.entry;
    var articles = entry.getIn(['data', 'articles']);
    if (!articles || !articles.size) return h('div', { className: 'cms-preview' }, h('p', {}, 'Cap article de premsa configurat.'));

    return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Premsa')),
      articles.map(function (art, i) {
        var title = art.get('title', '');
        var publication = art.get('publication', '');
        var date = art.get('date', '');
        var type = art.get('type', '');
        var url = art.get('url', '');
        var language = art.get('language', '');

        return h('div', { key: i, style: { marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' } },
          type ? h('span', { className: 'preview-tag' }, type) : null,
          h('h3', {}, title),
          h('p', { className: 'preview-meta' },
            [publication, date, language].filter(Boolean).join(' · ')
          ),
          url ? h('a', { href: url, target: '_blank', style: { color: 'var(--accent)', fontSize: '0.9rem' } }, url) : null
        );
      }.bind(this)).toArray()
    );
  }
}));


/* ─── PROJECTES ─── */
CMS.registerPreviewTemplate('projectes', createClass({
  render: function () {
    var entry = this.props.entry;
    var projects = entry.getIn(['data', 'projects']);
    if (!projects || !projects.size) return h('div', { className: 'cms-preview' }, h('p', {}, 'Cap projecte configurat.'));

    return h('div', { className: 'cms-preview' },
      h('h1', {}, 'Projectes'),
      projects.map(function (proj, i) {
        var title = proj.get('title', '');
        var status = proj.get('status', '');
        var issn = proj.get('issn', '');
        var content = proj.get('content');
        var image = getAssetSrc(entry.getIn(['data', 'projects']).get(i).set('src', proj.get('image')), ['src'], this.props.getAsset) || proj.get('image', '');

        return h('div', { key: i, style: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-subtle)' } },
          status ? h('span', { className: 'preview-tag' }, status) : null,
          h('h2', {}, title),
          issn ? h('p', { className: 'preview-meta' }, 'ISSN: ' + issn) : null,
          image ? h('img', { src: image, style: { maxWidth: '100%', borderRadius: '6px', margin: '8px 0' } }) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null
        );
      }.bind(this)).toArray()
    );
  }
}));


/* ─── HOME (Inici) ─── */
CMS.registerPreviewTemplate('home', createClass({
  render: function () {
    var entry = this.props.entry;
    var hero = entry.getIn(['data', 'hero']);
    var featured = entry.getIn(['data', 'featuredWork']);
    var bio = getVal(entry, ['bio'], '');

    return h('div', { className: 'cms-preview' },
      h('h1', {}, 'Inici'),
      hero ? h('div', { style: { marginBottom: '32px' } },
        h('h2', {}, 'Hero'),
        getVal(entry, ['hero', 'title'], '') ? h('h1', {}, getVal(entry, ['hero', 'title'], '')) : null,
        getVal(entry, ['hero', 'subtitle'], '') ? h('p', { style: { color: 'var(--text-secondary)' } }, getVal(entry, ['hero', 'subtitle'], '')) : null
      ) : null,
      featured ? h('div', { style: { marginBottom: '32px' } },
        h('h2', {}, 'Obra destacada'),
        getVal(entry, ['featuredWork', 'title'], '') ? h('h3', {}, getVal(entry, ['featuredWork', 'title'], '')) : null,
        getVal(entry, ['featuredWork', 'type'], '') ? h('span', { className: 'preview-tag' }, getVal(entry, ['featuredWork', 'type'], '')) : null,
        getVal(entry, ['featuredWork', 'publisher'], '') ? h('p', { className: 'preview-meta' }, getVal(entry, ['featuredWork', 'publisher'], '') + ' · ' + getVal(entry, ['featuredWork', 'year'], '')) : null,
        getVal(entry, ['featuredWork', 'description'], '') ? h('p', {}, getVal(entry, ['featuredWork', 'description'], '')) : null
      ) : null,
      bio ? h('div', { style: { marginBottom: '32px' } },
        h('h2', {}, 'Bio'),
        h('p', {}, bio)
      ) : null
    );
  }
}));


/* ─── QUISOC ─── */
CMS.registerPreviewTemplate('quisoc', createClass({
  render: function () {
    var entry = this.props.entry;
    var bio = entry.getIn(['data', 'biography']);
    var timeline = entry.getIn(['data', 'timeline']);

    return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Qui soc')),
      bio ? h('div', { className: 'preview-content' }, renderParagraphs(bio)) : null,
      timeline && timeline.size ? h('div', { style: { marginTop: '32px' } },
        h('h2', {}, 'Línia de temps'),
        timeline.map(function (item, i) {
          return h('div', { key: i, style: { display: 'flex', gap: '12px', marginBottom: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '6px' } },
            h('strong', { style: { color: 'var(--accent)', minWidth: '48px' } }, item.get('year', '')),
            h('div', {},
              h('div', { style: { fontWeight: '500' } }, item.get('label', '')),
              item.get('description') ? h('p', { style: { color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' } }, item.get('description')) : null
            )
          );
        }).toArray()
      ) : null
    );
  }
}));

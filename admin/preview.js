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

function getBlockVal(block, key, fallback) {
  if (!block) return (fallback || '');
  if (block.get) {
    var v = block.get(key);
    return v !== undefined && v !== null ? v : (fallback || '');
  }
  return block[key] !== undefined && block[key] !== null ? block[key] : (fallback || '');
}

function renderBlock(block, i, getAsset) {
  if (!block) return null;
  var type = getBlockVal(block, 'type', '');
  switch (type) {
    case 'heading':
      return h('h4', { key: i, style: { margin: '14px 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 } }, getBlockVal(block, 'text', ''));
    case 'prose': {
      var txt = getBlockVal(block, 'text', []);
      if (!txt || !txt.map) return null;
      return h('div', { key: i, className: 'preview-content' }, txt.map(function (p, pi) {
        return h('p', { key: pi }, p);
      }).toArray());
    }
    case 'poem': {
      var lines = getBlockVal(block, 'lines', []);
      if (!lines || !lines.map) return null;
      return h('div', { key: i, style: { padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '6px', margin: '10px 0', fontStyle: 'italic' } },
        lines.map(function (line, li) { return h('p', { key: li, style: { margin: 0 } }, line); }).toArray()
      );
    }
    case 'quote': {
      var text = getBlockVal(block, 'text', '');
      var author = getBlockVal(block, 'author', '');
      var role = getBlockVal(block, 'role', '');
      return h('blockquote', { key: i, style: { borderLeft: '3px solid var(--accent)', paddingLeft: '12px', margin: '10px 0', opacity: 0.92 } },
        text ? h('p', {}, '"' + text + '"') : null,
        (author || role) ? h('footer', { style: { fontSize: '0.85rem', marginTop: '4px' } }, [author, role].filter(Boolean).join(' — ')) : null
      );
    }
    case 'image': {
      var src = '';
      if (block.get) src = getAssetSrc({ getIn: function (p) { return block.get(p[1]); } }, ['src'], getAsset) || block.get('src', '');
      else src = block.src || '';
      return src ? h('img', { key: i, src: src, style: { maxWidth: '100%', borderRadius: '6px', margin: '8px 0' } }) : null;
    }
    case 'gallery': {
      var imgs = getBlockVal(block, 'images', []);
      if (!imgs || !imgs.map) return null;
      return h('div', { key: i, style: { display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '8px 0' } },
        imgs.map(function (img, gi) {
          var s = '';
          if (img && img.get) s = getAssetSrc({ getIn: function (p) { return img.get(p[1]); } }, ['src'], getAsset) || img.get('src', '');
          else if (img) s = img.src || '';
          return s ? h('img', { key: gi, src: s, style: { maxWidth: '48%', borderRadius: '6px' } }) : null;
        }).toArray()
      );
    }
    case 'video': {
      var url = getBlockVal(block, 'url', '');
      var vtitle = getBlockVal(block, 'title', url);
      return url ? h('p', { key: i, style: { color: 'var(--accent)', margin: '6px 0' } }, vtitle) : null;
    }
    case 'audio': {
      var aurl = getBlockVal(block, 'url', '');
      return aurl ? h('audio', { key: i, controls: true, src: aurl, style: { maxWidth: '100%' } }) : null;
    }
    case 'links':
    case 'buy': {
      var items = getBlockVal(block, 'items', []);
      if (!items || !items.map) return null;
      return h('div', { key: i, style: { margin: '6px 0' } }, items.map(function (it, li) {
        var label = it ? getBlockVal(it, 'label', '') : '';
        var iurl = it ? getBlockVal(it, 'url', '') : '';
        return label ? h('p', { key: li, style: { margin: '2px 0' } },
          h('a', { href: iurl, target: '_blank', style: { color: 'var(--accent)' } }, label))
          : null;
      }).toArray());
    }
    case 'list': {
      var litems = getBlockVal(block, 'items', []);
      if (!litems || !litems.map) return null;
      return h('ul', { key: i, style: { margin: '6px 0 6px 18px' } }, litems.map(function (x, li) {
        return h('li', { key: li, style: { listStyle: 'disc', marginLeft: '6px' } }, x);
      }).toArray());
    }
    case 'meta':
    case 'credits': {
      var mitems = getBlockVal(block, 'items', []);
      if (!mitems || !mitems.map) return null;
      var mtitle = getBlockVal(block, 'title', '');
      return h('div', { key: i, style: { margin: '8px 0' } },
        mtitle ? h('h5', { style: { margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, fontSize: '0.75rem' } }, mtitle) : null,
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }, mitems.map(function (m, mi) {
          var label = m ? getBlockVal(m, 'label', '') : '';
          var value = m ? getBlockVal(m, 'value', '') : '';
          var name = m ? getBlockVal(m, 'name', '') : '';
          var content = label ? (label + (value ? ': ' + value : '')) : (name || value);
          return content ? h('span', { key: mi, className: 'preview-tag' }, content) : null;
        }).toArray())
      );
    }
    default:
      return null;
  }
}

function renderBlocks(blocks, getAsset) {
  if (!blocks || !blocks.map || !blocks.size) return null;
  return blocks.map(function (b, i) {
    return renderBlock(b, i, getAsset);
  }).toArray();
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
        var blocks = work.get('blocks');

        return h('div', { key: i, style: { marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-subtle)' } },
          type ? h('span', { className: 'preview-tag' }, type) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          images ? renderImages(images, this.props.getAsset) : null,
          blocks ? h('div', { style: { marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' } },
            h('h3', { style: { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 } }, 'Blocs (modular)'),
            renderBlocks(blocks, this.props.getAsset)
          ) : null,
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
        var blocks = fest.get('blocks');

        return h('div', { key: i, style: { marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-subtle)' } },
          label ? h('span', { className: 'preview-tag' }, label) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          contentList ? h('div', { className: 'preview-content' }, renderList(contentList)) : null,
          images ? renderImages(images, this.props.getAsset) : null,
          blocks ? h('div', { style: { marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' } },
            h('h3', { style: { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 } }, 'Blocs (modular)'),
            renderBlocks(blocks, this.props.getAsset)
          ) : null,
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
        var blocks = award.get('blocks');

        return h('div', { key: i, style: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-subtle)' } },
          category ? h('span', { className: 'preview-tag' }, category) : null,
          h('h2', {}, title),
          year ? h('p', { className: 'preview-meta' }, year) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          images ? renderImages(images, this.props.getAsset) : null,
          blocks ? h('div', { style: { marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' } },
            h('h3', { style: { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 } }, 'Blocs (modular)'),
            renderBlocks(blocks, this.props.getAsset)
          ) : null
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
        var blocks = proj.get('blocks');
        var image = getAssetSrc(entry.getIn(['data', 'projects']).get(i).set('src', proj.get('image')), ['src'], this.props.getAsset) || proj.get('image', '');

        return h('div', { key: i, style: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-subtle)' } },
          status ? h('span', { className: 'preview-tag' }, status) : null,
          h('h2', {}, title),
          issn ? h('p', { className: 'preview-meta' }, 'ISSN: ' + issn) : null,
          image ? h('img', { src: image, style: { maxWidth: '100%', borderRadius: '6px', margin: '8px 0' } }) : null,
          content ? h('div', { className: 'preview-content' }, renderParagraphs(content)) : null,
          blocks ? h('div', { style: { marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' } },
            h('h3', { style: { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 } }, 'Blocs (modular)'),
            renderBlocks(blocks, this.props.getAsset)
          ) : null
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


/* ─── CONTACT ─── */
CMS.registerPreviewTemplate('contacte', createClass({
  render: function () {
    var entry = this.props.entry;

    return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Contacte')),
      getVal(entry, ['intro'], '') ? h('p', { className: 'preview-content' }, getVal(entry, ['intro'], '')) : null,
      h('div', { style: { marginTop: '20px', fontSize: '0.85rem', opacity: 0.6 } },
        'El correu, els enllaços a xarxes, les refer\u00E8ncies verificables (Goodreads, Viquip\u00E8pedia, Wikidata) i el CV es mostren autom\u00E0ticament des de la configuraci\u00F3 del lloc i de la biografia. El correu nom\u00E9s s\u0027edita a \u00ABConfiguraci\u00F3 del lloc\u00BB.'
      )
    );
  }
}));


/* ─── SEO ─── */
CMS.registerPreviewTemplate('seo', createClass({
  render: function () {
    var entry = this.props.entry;
    var rows = entry.getIn(['data', 'sections']);

    return h('div', { className: 'cms-preview' },
      h('h1', {}, 'Descripcions SEO per secció'),
      h('p', { className: 'preview-meta' }, 'Aquests textos són la meta description de cada secció (i el que veuen Google i les xarxes socials).'),
      rows && rows.size ? rows.map(function (row, i) {
        var key = row.get('key', '');
        var desc = row.get('desc', '');
        var descEn = row.get('desc_en', '');
        return h('div', { key: i, style: { marginBottom: '18px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: '6px' } },
          h('strong', { style: { color: 'var(--accent)' } }, '/' + key),
          desc ? h('p', { style: { margin: '6px 0 0', fontSize: '0.9rem' } }, desc) : null,
          descEn ? h('p', { className: 'preview-meta', style: { margin: '4px 0 0' } }, 'EN: ' + descEn) : null,
          h('p', { className: 'preview-meta', style: { margin: '4px 0 0' } },
            (desc || '').length + ' car\u00E0cters' + (descEn ? ' / ' + descEn.length + ' (EN)' : '')
          )
        );
      }.bind(this)).toArray() : h('p', {}, 'Cap secció configurada.')
    );
  }
}));


/* ─── AGENDA ─── */
CMS.registerPreviewTemplate('agenda', createClass({
  render: function () {
    var entry = this.props.entry;
    var events = entry.getIn(['data', 'events']);
    if (!events || !events.size) return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Agenda')),
      h('p', { className: 'preview-meta' }, 'Encara no hi ha esdeveniments programats.')
    );

    return h('div', { className: 'cms-preview' },
      h('h1', {}, getVal(entry, ['title'], 'Agenda')),
      getVal(entry, ['description'], '') ? h('p', { className: 'preview-meta' }, getVal(entry, ['description'], '')) : null,
      events.map(function (ev, i) {
        var title = ev.get('title', '');
        var date = ev.get('date', '');
        var venue = ev.get('venue', '');
        var city = ev.get('city', '');
        var time = ev.get('time', '');

        return h('div', { key: i, style: { marginBottom: '16px', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '6px' } },
          h('h3', { style: { margin: 0 } }, title),
          h('p', { className: 'preview-meta', style: { margin: '4px 0 0' } }, [date, time, venue, city].filter(Boolean).join(' · '))
        );
      }.bind(this)).toArray()
    );
  }
}));

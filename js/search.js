const SearchEngine = {
  index: [],
  built: false,

  async buildIndex() {
    if (this.built) return;
    const sections = ['crit', 'projectes', 'festivals', 'obres', 'premis', 'quisoc', 'premsa', 'actuacions'];
    for (const section of sections) {
      const data = await ContentLoader.loadSection(section);
      if (!data) continue;
      this.index.push({ section, data });
    }
    this.built = true;
  },

  query(q) {
    if (!q || q.length < 2) return [];
    const term = q.toLowerCase();
    const results = [];

    for (const entry of this.index) {
      const json = JSON.stringify(entry.data).toLowerCase();
      if (json.includes(term)) {
        const title = entry.data.title || entry.data.label || entry.section;
        results.push({
          section: entry.section,
          title: typeof title === 'string' ? title : title[0],
          match: term
        });
      }
    }
    return results.slice(0, 20);
  },

  async init() {
    await this.buildIndex();
  },

  renderResults(results, container) {
    if (!results.length) {
      container.innerHTML = '<p style="opacity: 0.4; font-size: 12px;">No s\'han trobat resultats.</p>';
      return;
    }
    container.innerHTML = results.map(r =>
      `<div class="search-result-item">
        <div class="search-result-path">/${r.section}</div>
        <a href="/${r.section}" class="item-link">${r.title}</a>
      </div>`
    ).join('\n');
  },

  performSearch(term) {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;
    input.value = term;
    const hits = this.query(term);
    this.renderResults(hits, results);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SearchEngine.init();
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (input && results) {
    input.addEventListener('input', () => {
      const term = input.value.trim();
      if (term.length < 2) {
        results.innerHTML = '<p style="opacity: 0.4; font-size: 12px;">Escriu almenys 2 caràcters per cercar.</p>';
        return;
      }
      const hits = SearchEngine.query(term);
      SearchEngine.renderResults(hits, results);
    });
  }
});
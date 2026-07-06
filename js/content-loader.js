const ContentLoader = {
  cache: {},

  async load(file) {
    if (this.cache[file]) return this.cache[file];
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      const data = await res.json();
      this.cache[file] = data;
      return data;
    } catch (err) {
      console.error(`ContentLoader: ${err.message}`);
      return null;
    }
  },

  async loadSite(lang) {
    const file = lang === 'en' ? '/content/site.en.json' : '/content/site.json';
    return this.load(file);
  },

  async loadSection(section, lang) {
    return this.load(`/content/${section}.json`);
  },

  clearCache() {
    this.cache = {};
  }
};

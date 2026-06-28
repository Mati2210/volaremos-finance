export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  try {
    const r = await fetch('https://boi.org.il/PublicApi/GetExchangeRates?asJson=true', {
      headers: { 'Accept': 'application/json' }
    });
    const json = await r.json();
    const list = json.exchangeRates || json;

    const usd = list.find(x => (x.key || x.Key) === 'USD');
    const eur = list.find(x => (x.key || x.Key) === 'EUR');

    if (!usd || !eur) {
      return res.status(502).json({ error: 'rates not found in BOI response' });
    }

    return res.json({
      USD: usd.currentExchangeRate ?? usd.CurrentExchangeRate,
      EUR: eur.currentExchangeRate ?? eur.CurrentExchangeRate,
      lastUpdate: usd.lastUpdate || usd.LastUpdate || new Date().toISOString(),
      source: 'boi'
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}

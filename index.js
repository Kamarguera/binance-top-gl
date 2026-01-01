const WebSocket = require('ws');
const axios = require('axios');


let symbols = [];
const changes = {};










async function start() {
  const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
  symbols = response.data.symbols.filter(symbol => symbol.quoteAsset === 'USDT').map(symbol => symbol.symbol.toLowerCase());

  const streams = symbols.map(symbol => `${symbol}@kline_1m`).join('/');

  // console.log(streams);

  const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
  ws.on('message', data => {
    const obj = JSON.parse(data);
    if (obj.data.k.x) {

      const openPrice = parseFloat(obj.data.k.o);
      const closePrice = parseFloat(obj.data.k.c);
      const change = ((closePrice - openPrice) / openPrice) * 100;
      changes[obj.data.s] = change;
      // console.log(obj.data.s, changes[obj.data.s].toFixed(2) + '%');
    }
  });

  // Handle WebSocket error
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };



  setInterval(() => {
    console.clear();
    const changeArray = Object.keys(changes).map(k => {
      return { symbol: k, change: changes[k] };
    });

    const topGainers = changeArray.sort((a, b) => b.change - a.change).slice(0, 5);
    const topLosers = changeArray.sort((a, b) => a.change - b.change).slice(0, 5);

    console.log('\nTop 5 Gainers:');
    topGainers.forEach(gainer => {
      console.log(`${gainer.symbol}: ${gainer.change.toFixed(2)}%`);
    });

    console.log('\nTop 5 Losers:');
    topLosers.forEach(loser => {
      console.log(`${loser.symbol}: ${loser.change.toFixed(2)}%`);
    });

  }, 5000);



}

start();
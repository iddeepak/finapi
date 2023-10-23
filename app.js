// app.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');
const csvtojson = require('csvtojson');

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(__dirname + '/public'));


// Define the route to convert CSV to JSON
app.get('/convertCSV/:date', async (req, res) => {
  const date = req.params.date;

  // Fetch the CSV data from the URL
  const csvUrl = `https://archives.nseindia.com/products/content/sec_bhavdata_full_${date}.csv`;

  try {
    const response = await axios.get(csvUrl);

    if (response.status === 200) {
      const csvData = response.data;

      // Convert CSV to JSON directly from the data
      const jsonArray = await csvtojson().fromString(csvData);

      res.json(jsonArray);
    } else {
      res.status(response.status).json({ error: 'Failed to fetch CSV data' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while converting CSV to JSON' });
  }
});

// Define the route to fetch SYMBOLS where DELIV_QTY of date2 > DELIV_QTY of date1 for specific SYMBOLS and SERIES = EQ
app.get('/getSymbolsWithHigherDelivery/:date1/:date2', async (req, res) => {
  const { date1, date2 } = req.params;

  // Ensure that date1 and date2 are provided in the URL
  if (!date1 || !date2) {
    return res.status(400).json({ error: 'Both date1 and date2 parameters are required' });
  }

  // Define the list of allowed SYMBOL values
  const allowedSymbols = [
    'ADANIENT',
    'ADANIPORTS',
    'APOLLOHOSP',
    'ASIANPAINT',
    'AXISBANK',
    'BAJAJ-AUTO',
    'BAJFINANCE',
    'BAJAJFINSV',
    'BPCL',
    'BHARTIARTL',
    'BRITANNIA',
    'CIPLA',
    'COALINDIA',
    'DIVISLAB',
    'DRREDDY',
    'EICHERMOT',
    'GRASIM',
    'HCLTECH',
    'HDFCBANK',
    'HDFCLIFE',
    'HEROMOTOCO',
    'HINDALCO',
    'HINDUNILVR',
    'ICICIBANK',
    'ITC',
    'INDUSINDBK',
    'INFY',
    'JSWSTEEL',
    'KOTAKBANK',
    'LTIM',
    'LT',
    'M&M',
    'MARUTI',
    'NTPC',
    'NESTLEIND',
    'ONGC',
    'POWERGRID',
    'RELIANCE',
    'SBILIFE',
    'SBIN',
    'SUNPHARMA',
    'TCS',
    'TATACONSUM',
    'TATAMOTORS',
    'TATASTEEL',
    'TECHM',
    'TITAN',
    'UPL',
    'ULTRACEMCO',
    'WIPRO',
  ];

  // Fetch the CSV data for date1
  const csvUrl1 = `https://archives.nseindia.com/products/content/sec_bhavdata_full_${date1}.csv`;

  // Fetch the CSV data for date2
  const csvUrl2 = `https://archives.nseindia.com/products/content/sec_bhavdata_full_${date2}.csv`;

  try {
    const [response1, response2] = await Promise.all([
      axios.get(csvUrl1),
      axios.get(csvUrl2),
    ]);

    if (response1.status === 200 && response2.status === 200) {
      const csvData1 = response1.data;
      const csvData2 = response2.data;

      // Convert CSV to JSON directly from the data
      const jsonArray1 = await csvtojson().fromString(csvData1);
      const jsonArray2 = await csvtojson().fromString(csvData2);

      // Extract unique SYMBOLS where DELIV_QTY of date2 > DELIV_QTY of date1 for allowed SYMBOLS and SERIES = EQ
      const symbolsWithHigherDelivery = Array.from(new Set(
        jsonArray2
          .filter(item2 => {
            const correspondingItem1 = jsonArray1.find(item1 =>
              item1.SYMBOL === item2.SYMBOL && item1.SERIES === 'EQ'
            );

            return (
              correspondingItem1 &&
              allowedSymbols.includes(item2.SYMBOL) &&
              Number(item2.DELIV_QTY) > Number(correspondingItem1.DELIV_QTY)&&
              Number(item2.LAST_PRICE) < Number(correspondingItem1.HIGH_PRICE) &&
              Number(item2.LAST_PRICE) > Number(correspondingItem1.LOW_PRICE)
            );
          })
          .map(item2 => item2.SYMBOL)
      ));

      res.json({ symbols: symbolsWithHigherDelivery });
    } else {
      res.status(response1.status).json({ error: 'Failed to fetch CSV data' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

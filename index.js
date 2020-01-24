const axios = require('axios');
const qs = require('querystring');
const crypto = require('crypto');
const yelpToken = process.env.YELPTOKEN;
const slackSigningSecret = process.env.SLACKSIGNINGSECRET;

exports.handler = async (event) => {
  try {
    const body = Buffer.from(event.body, 'base64').toString();    
    const params = qs.parse(body);
    const location = params.text;

    // verify the event
    const slackSigningSig = event.headers['X-Slack-Signature'];
    const slackTs = event.headers['X-Slack-Request-Timestamp']; 
    
    let now = Math.floor(new Date().getTime()/1000);
    if (Math.abs(now - slackTs) > 300) {
      return res.status(400).send('Ignore this request.');
    }

    const sigBaseString = `v0:${slackTs}:${body}`    
    let appSigningSig = `v0=${crypto.createHmac('sha256', slackSigningSecret).update(sigBaseString, 'utf8').digest('hex')}`;

    if (slackSigningSig !== appSigningSig) {
      return res.status(400).send('Verification failed');
    }    

    const r = await axios({
      url: 'https://api.yelp.com/v3/businesses/search',
      method: 'get',
      headers: {
        Authorization: `Bearer ${yelpToken}`
      },
      params: {
        location,
        limit: 10, 
        price: '1,2',
        open_now: true,
        radius: 1500,
        offset: Math.floor(Math.random() * Math.floor(10)),
        sort_by: 'rating'
      }
    });
    
    const rec = `${r.data.businesses[0].name}: ${r.data.businesses[0].location.address1}, ${r.data.businesses[0].location.city} ${r.data.businesses[0].location.zip_code}`
    const response = {
      statusCode: 200,
      body: JSON.stringify(rec)
    }
    return response;
  }
  catch(err) {
    console.log(err);
    return 'fail';
  }
}
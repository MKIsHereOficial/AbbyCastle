const axios = require('axios').default;

module.exports = {
  fetchURL: async (url) => {
    var data, err;
    
    
    await axios.get(url).catch(e => {err = e}).then((r, err) => {
      //console.log(r, err);
      if (err) {
        return {data, err};
      }

      if (r && r.data) data = r.data;
    });

    return {data, err};
  },
  fetchUserWithoutId: async (data) =>{
      const results = null;
      await axios
        .get(
          `https://discord.com/api/users/@me`,
          {headers: {Authorization: `Bearer ${data.access_token}`}}
        ).catch(console.error);
  },
  fetchUser: async ({id = "475072755033702400"}) => {
    const data = null;

    await axios.get(`https://discord.com/api/users/@me`).then((results) => {
      data = results.data;
    })

    return data;
  }
}
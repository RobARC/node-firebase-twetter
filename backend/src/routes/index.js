const { Router } = require('express');
const app = require('../app');
const router = Router();
const ApiClient = require('../config');
const twitterClient = require('../config');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DB_URL
});

const db = admin.database();

router.get('/', async (req, res) => {

    await db.ref('tweets').on('value', (snapshot) => {
        const data = snapshot.val();
        let crx = [];
        snapshot.forEach(element => {
            crx = element.val();
            //console.log(element.val()[0].text);
        });
        res.render('home', { tweets: crx });
    });
});


router.get('/search/:word', async (req, res) => {

    const params = { q: req.params.word, count: 5, result_type: 'recent', lang: 'es' }

    await ApiClient.ApiClient.get('search/tweets', params, function (err, data, response) {
        //console.log(data);
        const allTweetsDto = data.statuses.map(tweet => tweetToDto(tweet));
        res.json(allTweetsDto)
    });
});


router.post('/search/:word', async (req, res) => {

    const params = { q: req.params.word, count: 5, result_type: 'recent', lang: 'es' }

    await ApiClient.ApiClient.get('search/tweets', params, async function (err, data, response) {
        try {
            //transfor tweets in a smaller data
            const allTweetsDto = data.statuses.map(tweet => tweetToDto(tweet));
            await saveInDB(allTweetsDto);
            await res.redirect('/');
        }
        catch (err) {
            console.log(err);
        }

    });
});

router.get('/statuses/user_timeline/', async (req, res) => {
    const params = { screen_name: 'TalCual', count: 5 }

    twitterClient.twitterClient.get('/statuses/user_timeline/', params, function (err, data, response) {
        //const tweets = [];

        console.log(data)

        //tweets.push(data);
        //tweetToDto(data);

        //console.log(tweets);
    })

    //const allTweetsDto = data

    //console.log(allTweetsDto);
    //await saveInDB(allTweetsDto);
    //await res.redirect('/');


})




//Delete all Tweets
router.get('/delete-tweet/', async (req, res) => {
    try {
        await deleteTwits();
        await res.redirect('/');
    }
    catch (err) {
        console.log(err);
    }
});


// Data to return each tweet
function tweetToDto(tweet) {
    return {
        created_at: tweet.created_at,
        text: tweet.text,
        name: tweet.user.name,
        screen_name: tweet.user.screen_name,
        id: tweet.user.id,
        location: tweet.user.location,
        description: tweet.user.description,
        profile_img: tweet.user.profile_image_url_https
    };
};

//save in Firebase database
async function saveInDB(allTweetsDto) {
    await db.ref('tweets').push(allTweetsDto);
    console.log('Saved in Firebase');
};

async function deleteTwits() {
    await db.ref('tweets').remove();
    console.log('Removed in Firebase');
};

module.exports = router;

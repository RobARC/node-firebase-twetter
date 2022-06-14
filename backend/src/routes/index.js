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
    try {
        await db.ref('tweets').on('value', (snapshot) => {
            const data = snapshot.val();
            let crx = [];
            snapshot.forEach(element => {
                crx = element.val();
                //console.log(element.val()[0].text);
            });
            res.render('home', { tweets: crx });
        });
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }
});

router.get('/search/:word', async (req, res) => {

    const params = { q: req.params.word, count: 5, result_type: 'recent', lang: 'es' }

    await ApiClient.ApiClient.get('search/tweets', params, async function (err, data, response) {
        //console.log(data);
        const allTweetsDto = data.statuses.map(tweet => tweetToDto(tweet));
        //res.json(allTweetsDto)
        await saveInDB(allTweetsDto);
        await res.redirect('/');
    });
});

router.post('/search/:word', async (req, res) => {
    try {
        const params = { q: req.params.word, count: 5, result_type: 'recent', lang: 'es' };

        await ApiClient.ApiClient.get('search/tweets', params, async function (err, data, response) {

            //transfor tweets in a smaller data
            const allTweetsDto = data.statuses.map(tweet => tweetToDto(tweet));
            await saveInDB(allTweetsDto);
            await res.redirect('/');

        });
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }

});

router.get('/statuses/user_timeline/:screen_name', async (req, res) => {
    try {
        const params = { screen_name: req.params.screen_name, count: 5 }

        await twitterClient.twitterClient.get('/statuses/user_timeline/', params, async function (err, data, response) {
            //await console.log(data);
            const allTweetsTimeLine = data.map(tweets => tweetsTimeLine(tweets));

            //console.log(allTweetsTimeLine);
            await saveInDB(allTweetsTimeLine);
            await res.redirect('/');
        });
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }
});

//Delete all Tweets
router.get('/delete-tweet/', async (req, res) => {
    try {
        await deleteTwits();
        await res.redirect('/');
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
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

//Data to return TimeLine 
function tweetsTimeLine(tweets) {
    return {
        created_at: tweets.created_at,
        text: tweets.text,
        name: tweets.user.name,
        screen_name: tweets.user.screen_name,
        id: tweets.user.id,
        location: tweets.user.location,
        description: tweets.user.description,
        profile_img: tweets.user.profile_image_url_https
    };
}

//save in Firebase database
async function saveInDB(allTweetsDto) {
    await db.ref('tweets').push(allTweetsDto);
    console.log('Saved in Firebase');
};

//delete data from DB firebase
async function deleteTwits() {
    await db.ref('tweets').remove();
    console.log('Removed in Firebase');
};

module.exports = router;

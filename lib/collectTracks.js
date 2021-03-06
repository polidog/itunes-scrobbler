'use strict';


const {getItunesPath} = require('@johnpaulvaughan/itunes-music-library-path');
const {getItunesTracks} = require('@johnpaulvaughan/itunes-music-library-tracks');


const makeId = ({artist, album, track}) => `track|${artist}|${album}|${track}`;


const makeName = ({artist, album, track}) => `${artist} [${album}] ${track}`;


const decode = buffer => JSON.parse(buffer.toString('utf-8'));


const map = track => ({
  artist: track['Artist'] || track['Album Artist'],
  album: track['Album'],
  date: track['Year'],
  track: track['Name'],
  playCount: 'Play Count' in track ? track['Play Count'] : 0,
  lastPlayed: 'Play Date UTC' in track ? new Date(track['Play Date UTC']).getTime() : -1,
  loved: 'Loved' in track
});


const unfuckery = track => Object.keys(track)
  .reduce((result, key) => Object.assign(result, {
    [key]: typeof(track[key]) === 'string' ? track[key].replace(/&#38;/g, '&') : track[key]
  }), {});


exports.collectTracks = () => new Promise((resolve, reject) => getItunesPath()
  .then(getItunesTracks)
  .then(stream => {
    const tracks = [];

    const onTrack = buffer => {
      const track = unfuckery(map(decode(buffer)));
      if (track.playCount > 0 || track.loved) {
        tracks.push(Object.assign({
          id: makeId(track),
          name: makeName(track)
        }, track));
      }
    };

    let error = false;
    stream.on('data', onTrack);
    stream.on('error', err => {
      if (!error) {
        error = err;
      }
    });
    stream.on('end', () => error ? reject(error) : resolve(tracks));
  })
);

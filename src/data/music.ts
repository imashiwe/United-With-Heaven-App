export interface Track {
  id: string;
  title: string;
  album: string;
  file: any;
  lyrics?: string;
}

export interface Album {
  id: string;
  name: string;
  accent: string;
  bg: string;
}

export const albums: Album[] = [
  { id: 'open',     name: 'Open Doors',              accent: '#B8722A', bg: '#FFF8EE' },
  { id: 'victory',  name: 'Victory',                  accent: '#AA4A20', bg: '#FFF0E8' },
  { id: 'feasting', name: 'Feasting On His Goodness', accent: '#2A8A5A', bg: '#F0FFF6' },
  { id: 'happy',    name: 'Happy Songs',               accent: '#C9973A', bg: '#FFFBEE' },
  { id: 'power',    name: "God's Power & Dominion",    accent: '#4A4AAA', bg: '#F0F0FF' },
  { id: 'kingdom',  name: 'Spiritual Kingdom',         accent: '#8A6A10', bg: '#FFF8E0' },
  { id: 'journey',  name: 'The Journey',               accent: '#2A6AAA', bg: '#E8F4FF' },
  { id: 'lessons',  name: 'Lessons',                   accent: '#7A5C44', bg: '#F5ECD8' },
];

export const tracks: Track[] = [
  // Open Doors
  { id: 'od1',  title: 'Open Doors',                  album: 'open',     file: require('../../assets/music/Open doors.mp3') },

  // Victory
  { id: 'v1',   title: 'No More Dragon',               album: 'victory',  file: require('../../assets/music/Victory/No more dragon.mp3') },
  { id: 'v2',   title: 'Fruitful and Multiply',        album: 'victory',  file: require('../../assets/music/Victory/Fruitful and Multiply.mp3') },
  { id: 'v3',   title: 'The Enemy Has No Power',       album: 'victory',  file: require('../../assets/music/Victory/The enemy has no power.mp3') },
  { id: 'v4',   title: "They Couldn't Destroy Me",     album: 'victory',  file: require("../../assets/music/Victory/They couldn't destroy me.mp3") },
  { id: 'v5',   title: 'You Are',                      album: 'victory',  file: require('../../assets/music/Victory/You Are.mp3') },

  // Feasting On His Goodness
  { id: 'f1',   title: 'Fresh Oil Poured Out',         album: 'feasting', file: require('../../assets/music/Feasting On His Goodness/Fresh oil poured out.mp3') },
  { id: 'f2',   title: 'My Rock',                      album: 'feasting', file: require('../../assets/music/Feasting On His Goodness/My Rock.mp3') },
  { id: 'f3',   title: 'I Am Going to Dance',          album: 'feasting', file: require('../../assets/music/Feasting On His Goodness/I am going to dance.mp3') },

  // Happy Songs
  { id: 'h1',   title: 'Happy and Merry',              album: 'happy',    file: require('../../assets/music/Happy Songs/Happy and Merry.mp3') },
  { id: 'h2',   title: 'The Happy Song',               album: 'happy',    file: require('../../assets/music/Happy Songs/The happy song.mp3') },

  // God's Power and Dominion
  { id: 'p1',   title: 'Jesus Reigns',                 album: 'power',    file: require('../../assets/music/Gods Power and Dominion/Jesus Reigns.mp3') },
  { id: 'p2',   title: 'Nations',                      album: 'power',    file: require('../../assets/music/Gods Power and Dominion/Nations.mp3') },
  { id: 'p3',   title: 'You Are',                      album: 'power',    file: require('../../assets/music/Gods Power and Dominion/You Are.mp3') },

  // Spiritual Kingdom
  { id: 'sk1',  title: 'Romans 8:28',                  album: 'kingdom',  file: require('../../assets/music/Spiritual Kingdom/Romans 828.mp3') },

  // The Journey
  { id: 'tj1',  title: 'LORD I Can Go Forward',        album: 'journey',  file: require('../../assets/music/The Journey/LORD I can go forward.mp3') },
  { id: 'tj2',  title: 'Wilderness Experience',        album: 'journey',  file: require('../../assets/music/The Journey/Wilderness experience.mp3') },

  // Lessons
  { id: 'l1',   title: 'When People Hate You',         album: 'lessons',  file: require('../../assets/music/Lessons/When people hate you.mp3') },
  { id: 'l2',   title: 'Woman, Get Discernment',       album: 'lessons',  file: require('../../assets/music/Lessons/Woman get discernment.mp3') },
  { id: 'l3',   title: "Wolves in Sheep's Clothing",   album: 'lessons',  file: require("../../assets/music/Lessons/Wolves in sheep's clothing.mp3") },
];

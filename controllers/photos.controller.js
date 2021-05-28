const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file.size !== 0) { // if fields are not empty...
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      const titlePatt = new RegExp(/^([A-z]|\s|[0-9]|\.){1,25}$/);
      if (!titlePatt.test(title)) throw new Error('Fix up the title!');

      const authorPatt = new RegExp(/^([A-z]|\s|[0-9]|\.){1,50}$/);
      if (!authorPatt.test(author)) throw new Error('Fix up the author\'s name!');

      const emailPatt = new RegExp(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]{1,6}))$/i);
      if (!emailPatt.test(email)) throw new Error('Fix up the email address!');

      if ( ['gif', 'png', 'jpg'].includes(fileExt) && title.length <= 25 && author.length <= 50) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save();
        res.json(newPhoto);
      } else {
        throw new Error('Are you REALLY certain that\'s what you want to submit?');
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err.response.data.message);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const activeVoter = await Voter.exists({user: req.clientIp});
      if(!activeVoter) {
        const voter = new Voter ({user: req.clientIp, votes: [photoToUpdate._id]});
        await voter.save();
      } else {
        const voter = await Voter.findOne({user: req.clientIp});
        if (voter.votes.includes(photoToUpdate._id)) {
          throw new Error ('Already voted, we BOTH know it!');
        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err.response.data.message);
  }

};